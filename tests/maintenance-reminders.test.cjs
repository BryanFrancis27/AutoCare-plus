const { test } = require('node:test');
const assert = require('node:assert/strict');
const { load, hookHarness, find, nodes, textOf, React, renderToStaticMarkup } = require('./vehicle-test-helpers.cjs');
const { reminderPresentation, localDateKey } = load('src/lib/maintenance/presentation.ts');
const { validateService, serviceSubmission, validateReminder, reminderSubmission } = load('src/lib/maintenance/forms.ts');
const { filterHistory, historySummary, defaultHistoryFilters } = load('src/lib/maintenance/history-model.ts');
const { readComplete } = load('src/lib/maintenance/read-complete.ts');
const base = { dueDate: undefined, dueMileage: undefined, priority: 'medium', status: 'upcoming', isCompleted: false };
const present = (extra, mileage) => reminderPresentation({ ...base, ...extra }, mileage, '2026-10-31');
const service = { vehicleId: 'owned', serviceType: 'Oil change', serviceCategory: 'oil-change', serviceDate: '2026-10-31', mileage: '0', cost: '0', notes: '' };
const reminder = { vehicleId: 'owned', title: 'Oil due', reminderType: 'Oil Change', serviceCategory: 'Engine', description: '', dueDate: '', dueMileage: '0', priority: 'critical', notes: '' };

test('date-only: past, today, inclusive 30 days, beyond window and invalid dates', () => {
  for (const [date, expected] of [['2026-10-30','overdue'], ['2026-10-31','due-soon'], ['2026-11-30','due-soon'], ['2026-12-01','scheduled'], ['2026-02-30','unknown']]) assert.equal(present({ dueDate: date }).schedule, expected);
  assert.equal(present({ dueDate: '2026-10-31' }).days, 0);
});
test('mileage-only includes zero, exact threshold, 500 km window and unknown odometer', () => {
  assert.equal(present({ dueMileage: 0 }, 0).schedule, 'mileage-reached');
  assert.equal(present({ dueMileage: 1000 }, 500).schedule, 'due-soon');
  assert.equal(present({ dueMileage: 1001 }, 500).schedule, 'scheduled');
  for (const mileage of [null, undefined, NaN, Infinity, -1]) assert.equal(present({ dueMileage: 1000 }, mileage).schedule, 'unknown');
  assert.equal(present({}, 0).schedule, 'unknown');
});
test('combined triggers use date OR mileage, preserve reasons and never invent date overdue', () => {
  const state = present({ dueDate: '2027-01-01', dueMileage: 1000 }, 1000);
  assert.equal(state.schedule, 'mileage-reached'); assert.ok(!state.reason.includes('calendar days past'));
  assert.equal(present({ dueDate: '2026-10-01', dueMileage: 1000 }, 0).schedule, 'overdue');
  assert.equal(present({ dueDate: '2027-01-01', dueMileage: 1000 }, 600).schedule, 'due-soon');
});
test('priority is independent, stored overdue is explicit, completion takes precedence', () => {
  assert.equal(present({ priority: 'critical', dueDate: '2027-01-01' }).schedule, 'scheduled');
  assert.equal(present({ priority: 'low', dueDate: '2026-10-01' }).schedule, 'overdue');
  assert.equal(present({ status: 'overdue', dueDate: '2027-01-01' }).reason, 'Stored status: overdue');
  for (const extra of [{ isCompleted: true }, { status: 'completed' }]) assert.equal(present({ dueDate: '2020-01-01', dueMileage: 0, ...extra }, 5).schedule, 'completed');
});
test('calendar days avoid DST, midnight and timezone shifts', () => {
  const previous = process.env.TZ;
  try {
    for (const tz of ['Asia/Manila', 'America/Los_Angeles', 'Pacific/Kiritimati']) {
      process.env.TZ = tz;
      for (const hour of [0, 12, 23]) {
        const now = new Date(2026, 9, 31, hour, 59);
        assert.equal(localDateKey(now), '2026-10-31');
        assert.equal(reminderPresentation({ ...base, dueDate: '2026-10-31' }, null, localDateKey(now)).days, 0);
      }
      assert.equal(reminderPresentation({ ...base, dueDate: '2026-03-09' }, null, '2026-03-08').days, 1);
    }
  } finally { if (previous === undefined) delete process.env.TZ; else process.env.TZ = previous; }
});
test('maintenance validation/submission preserves zero and decimals; optional blank cost is zero', () => {
  assert.deepEqual(validateService(service), {});
  assert.deepEqual(validateService({ ...service, mileage: '0.5', cost: '1200.35' }), {});
  assert.equal(serviceSubmission({ ...service, cost: '1200.35' }).cost, 1200.35);
  assert.equal(serviceSubmission({ ...service, mileage: '0.5', cost: '' }).mileage, 0.5);
  assert.equal(serviceSubmission({ ...service, cost: '' }).cost, 0);
  for (const value of ['-1','NaN','Infinity','1e3','1,000','5km',' ']) for (const key of ['mileage','cost']) assert.ok(validateService({ ...service, [key]: value })[key]);
  for (const date of ['', '2026-02-29', '2026-10-31T12:00:00Z']) assert.ok(validateService({ ...service, serviceDate: date }).serviceDate);
});
test('reminder forms require date OR mileage, allow zero/decimal mileage and validate both provided fields', () => {
  assert.deepEqual(validateReminder(reminder), {}); assert.equal(reminderSubmission(reminder).dueMileage, 0);
  assert.deepEqual(validateReminder({ ...reminder, dueDate: '2026-10-31', dueMileage: '' }), {});
  assert.ok(validateReminder({ ...reminder, dueMileage: '' }).dueDate);
  assert.ok(validateReminder({ ...reminder, dueDate: '2026-02-30' }).dueDate);
  for (const value of ['-1', 'Infinity', 'NaN', ' ']) assert.ok(validateReminder({ ...reminder, dueMileage: value }).dueMileage);
  assert.equal(reminderSubmission({ ...reminder, dueMileage: '1500.75' }).dueMileage, 1500.75);
});
test('history searches display category/type, filters inclusive dates, sorts date/cost and resets without mutation', () => {
  const rows = [ { id:'b', serviceType:'Synthetic', serviceCategory:'oil-change', serviceDate:'2026-10-30', cost:100.25 }, { id:'a', serviceType:'Brake Inspection', serviceCategory:'brake-inspection', serviceDate:'2026-10-31', cost:0 } ];
  assert.deepEqual(filterHistory(rows, { ...defaultHistoryFilters, search:'oil change' }).map(r=>r.id), ['b']);
  assert.deepEqual(filterHistory(rows, { ...defaultHistoryFilters, category:'brake-inspection', from:'2026-10-31', to:'2026-10-31' }).map(r=>r.id), ['a']);
  for (const [sort, expected] of [['newest','a'], ['oldest','b'], ['cost-high','b'], ['cost-low','a']]) assert.equal(filterHistory(rows, { ...defaultHistoryFilters, sort })[0].id, expected);
  assert.equal(filterHistory(rows, defaultHistoryFilters).length, 2); assert.equal(rows[0].id, 'b');
  assert.deepEqual(historySummary(rows), { count:2, total:100.25, latest:'2026-10-31' });
});
test('pagination tolerates a lower server cap and sums >1000 records accurately', async () => {
  const rows = Array.from({ length:1205 }, (_,i)=>({ id:String(i), serviceDate:'2026-10-31', cost:0.1 }));
  const ranges=[];
  const all=await readComplete(async (from,to)=>{ ranges.push([from,to]); return { data:rows.slice(from,Math.min(to+1,from+100)),count:rows.length,error:null }; });
  assert.equal(all.length,1205);assert.equal(historySummary(all).total,120.5);assert.equal(ranges[1][0],100);
});
test('pagination rejects partial failure, changing counts, duplicate IDs and missing counts', async () => {
  for (const response of [{data:[],count:2,error:null}, {data:null,count:0,error:'offline'}, {data:[],count:null,error:null}, {data:[{id:'a'},{id:'a'}],count:2,error:null}]) await assert.rejects(readComplete(async()=>response));
  let page=0; await assert.rejects(readComplete(async()=>({ data:[{id:String(page)}],count:page++ ? 3 : 2,error:null })));
});
test('confirmed submit blocks concurrent writes and allows retry after error or exception', async () => {
  const h=hookHarness('src/lib/maintenance/use-confirmed-submit.ts','useConfirmedSubmit');
  let release,calls=0,success=0;
  const write=()=>{calls++;return new Promise(resolve=>release=resolve);};
  let hook=h.render();const first=hook.submit(write,()=>success++);await hook.submit(write,()=>success++);
  assert.equal(calls,1);assert.equal(h.render().pending,true);
  release({data:null,error:'offline'});await first;hook=h.render();assert.equal(hook.pending,false);assert.match(hook.error,/retained/);assert.equal(success,0);
  await hook.submit(async()=>{throw Error('offline');},()=>success++);assert.match(h.render().error,/offline/);
  await h.render().submit(async()=>({data:{id:'persisted'},error:null}),()=>success++);assert.equal(success,1);assert.equal(h.render().error,null);
});
test('shared maintenance form retains invalid/failed draft and confirms success only after persisted row', async () => {
  let payload, fail=true, success=0;
  const h=hookHarness('src/components/maintenance/MaintenanceForm.tsx','MaintenanceForm',{'@/app/actions/maintenance':{createMaintenanceRecord:async input=>{payload=input;return fail?{data:null,error:'offline'}:{data:{id:'saved'},error:null};}}});
  const props={vehicles:[{id:'owned',label:'Test vehicle',currentMileage:0}],vehicleId:'owned',onSuccess:()=>success++};
  function field(tree,name){return find(tree,n=>n.props?.name===name && typeof n.props?.children==='function').props.children({});}
  let tree=h.render(props);field(tree,'serviceCategory').props.onChange({target:{value:'oil-change'}});
  tree=h.render(props);field(tree,'cost').props.onChange({target:{value:'12.35'}});
  tree=h.render(props);await find(tree,n=>n.type==='form').props.onSubmit({preventDefault(){}});
  tree=h.render(props);assert.equal(field(tree,'cost').props.value,'12.35');assert.equal(payload.cost,12.35);assert.equal(payload.mileage,0);assert.equal(success,0);assert.match(textOf(tree),/retained/);
  fail=false;await find(tree,n=>n.type==='form').props.onSubmit({preventDefault(){}});assert.equal(success,1);
});

// Minimal owner-aware query double, invoking the real server actions.
function actionsFixture({ user={id:'owner'}, foreign=false, insertError=false }={}) {
  const calls=[],tables={vehicles:foreign?[]:[{id:'owned',user_id:'owner',current_mileage:0}],reminders:[{id:'r',user_id:'owner',vehicle_id:'owned',service_category:'oil-change',reminder_type:'Oil change',is_completed:false}],maintenance_logs:[]};
  class Query {
    constructor(table){this.table=table;this.filters=[];this.kind='read';calls.push(this);}
    select(){return this;} order(){return this;} limit(){return this;}
    eq(k,v){this.filters.push([k,v]);return this;}
    insert(data){this.kind='insert';this.payload=data;return this;}
    update(data){this.kind='update';this.payload=data;return this;}
    delete(){this.kind='delete';return this;}
    async single(){const result=await this.run(true);return result.data ? result : {...result,error:{message:'Row unavailable'}};} maybeSingle(){return this.run(true);}
    range(from,to){this.bounds=[from,to];return this.run(false);}
    then(resolve,reject){return this.run(false).then(resolve,reject);}
    async run(single){
      let rows=tables[this.table].filter(row=>this.filters.every(([key,value])=>row[key]===value));
      const count=rows.length;
      if(this.kind==='insert') {if(insertError && this.table==='maintenance_logs')return {data:null,error:{message:'insertion failed'},count:null};const row={id:'new-'+tables[this.table].length,...this.payload};tables[this.table].push(row);rows=[row];}
      if(this.kind==='update')rows.forEach(row=>Object.assign(row,this.payload));
      if(this.kind==='delete')tables[this.table]=tables[this.table].filter(row=>!rows.includes(row));
      if(this.bounds)rows=rows.slice(this.bounds[0],this.bounds[1]+1);
      return {data:single?rows[0]??null:rows,error:null,count};
    }
  }
  const client={auth:{getUser:async()=>({data:{user}})},from:table=>new Query(table)};
  const mocks={'@/lib/supabase/server':{createSupabaseServerClient:()=>client},'next/cache':{revalidatePath(){}}};
  return {maintenance:load('src/app/actions/maintenance.ts',mocks),reminders:load('src/app/actions/reminders.ts',mocks),calls,tables};
}
test('creation rejects foreign vehicles, invalid numbers/dates and unauthenticated accounts before inserting', async () => {
  for (const config of [{foreign:true},{user:null}]) {
    const f=actionsFixture(config);
    assert.ok((await f.maintenance.createMaintenanceRecord(serviceSubmission(service))).error);
    assert.ok((await f.reminders.createReminder(reminderSubmission(reminder))).error);
    assert.ok(!f.calls.some(c=>c.kind==='insert'));
  }
  const f=actionsFixture();
  assert.ok((await f.maintenance.createMaintenanceRecord({...serviceSubmission(service),mileage:Infinity})).error);
  assert.ok((await f.reminders.createReminder({...reminderSubmission(reminder),dueDate:'2026-02-30'})).error);
  assert.ok(!f.calls.some(c=>c.kind==='insert'));
});
test('creation associates authenticated owner/vehicle, preserves decimal cost, and retains existing generation ordering', async () => {
  const f=actionsFixture();
  const result=await f.maintenance.createMaintenanceRecord({...serviceSubmission(service),cost:12.35});assert.equal(result.error,null);
  const log=f.tables.maintenance_logs[0];assert.equal(log.user_id,'owner');assert.equal(log.vehicle_id,'owned');assert.equal(log.cost,12.35);assert.equal(log.mileage,0);
  assert.equal(f.tables.reminders.length,2);assert.ok(f.tables.reminders.some(r=>r.is_completed));
  const reminderResult=await f.reminders.createReminder(reminderSubmission(reminder));assert.equal(reminderResult.error,null);
  assert.equal(f.tables.reminders.at(-1).due_mileage,0);assert.equal(f.tables.reminders.at(-1).user_id,'owner');
});
test('maintenance/reminder complete reads scope every page to owner and vehicle', async () => {
  const f=actionsFixture();await f.maintenance.getMaintenanceRecords('owned');await f.reminders.getRemindersForVehicle('owned');await f.reminders.getAllReminders();
  for(const call of f.calls) {assert.ok(call.filters.some(([k,v])=>k==='user_id'&&v==='owner'));if(call.table==='maintenance_logs')assert.ok(call.filters.some(([k,v])=>k==='vehicle_id'&&v==='owned'));}
});
test('basic completion changes only reminder state; retained service completion is nontransactional and repeats logs', async () => {
  const basic=actionsFixture();assert.equal((await basic.reminders.completeReminder('r')).success,true);assert.equal(basic.tables.maintenance_logs.length,0);
  const f=actionsFixture();assert.equal((await f.reminders.completeReminderWithServiceLog('r')).success,true);assert.equal(f.tables.maintenance_logs.length,1);assert.equal(f.tables.maintenance_logs[0].cost,0);
  assert.equal((await f.reminders.completeReminderWithServiceLog('r')).success,true);assert.equal(f.tables.maintenance_logs.length,2); // Characterizes deferred idempotency defect.
  const failure=actionsFixture({insertError:true});assert.equal((await failure.reminders.completeReminderWithServiceLog('r')).success,true);assert.equal(failure.tables.reminders[0].is_completed,true);assert.equal(failure.tables.maintenance_logs.length,0); // Deferred ignored insert error.
});
test('reminder form failure retains draft and retry submits same vehicle and zero threshold', async () => {
  let fail=true,payload,success=0;
  const h=hookHarness('src/components/reminders/ReminderForm.tsx','ReminderForm',{'@/app/actions/reminders':{createReminder:async value=>{payload=value;return fail?{data:null,error:'offline'}:{data:{id:'r'},error:null};}}});
  const props={vehicleId:'owned',vehicleName:'Test vehicle',onCancel(){},onSuccess(){success++;}};
  const field=(tree,name)=>find(tree,n=>n.props?.name===name&&typeof n.props.children==='function').props.children({});
  for(const [key,value] of [['title','Custom service'],['reminderType','Custom'],['serviceCategory','Other'],['dueMileage','0']]){const tree=h.render(props);field(tree,key).props.onChange({target:{value}});}
  let tree=h.render(props);await find(tree,n=>n.type==='form').props.onSubmit({preventDefault(){}});tree=h.render(props);assert.equal(field(tree,'title').props.value,'Custom service');assert.equal(payload.vehicleId,'owned');assert.equal(payload.dueMileage,0);assert.equal(success,0);
  fail=false;await find(tree,n=>n.type==='form').props.onSubmit({preventDefault(){}});assert.equal(success,1);
});
test('dashboard includes distant-date reminders whose recorded mileage is reached', () => {
  const { relevantReminders }=load('src/services/dashboardService.ts');
  const rows=relevantReminders([{id:'r',reminder_type:'Oil',due_date:'2027-12-01',due_mileage:0,status:'upcoming',priority:'critical',vehicle_id:'owned',vehicles:{make:'Test',model:'Car',year:2024,current_mileage:0}}],new Date(2026,9,31,12));
  assert.equal(rows.length,1);assert.equal(rows[0].schedule,'mileage-reached');assert.equal(rows[0].overdue,true);
});
test('reminder list searches, filters by vehicle/status, and keeps errors separate from empty totals', () => {
  const h=hookHarness('src/components/reminders/RemindersListClient.tsx','RemindersListClient');
  const props={initialError:null,initialVehicles:[{id:'owned',make:'Test',model:'Car',year:2024,plate_number:'TEST',current_mileage:0}],initialReminders:[{...base,id:'one',title:'Oil service',vehicleId:'owned',dueMileage:0},{...base,id:'two',title:'Done brakes',vehicleId:'other',isCompleted:true}]};
  let tree=h.render(props);assert.match(textOf(tree),/Oil service/);assert.doesNotMatch(textOf(tree),/Done brakes/);
  const label=(tree,text)=>find(tree,n=>n.type==='label'&&textOf(n).startsWith(text));
  const select=(tree,text)=>find(label(tree,text),n=>n.type==='select');
  select(tree,'Status').props.onChange({target:{value:'completed'}});tree=h.render(props);assert.match(textOf(tree),/Done brakes/);assert.doesNotMatch(textOf(tree),/Oil service/);
  select(tree,'Vehicle').props.onChange({target:{value:'owned'}});tree=h.render(props);assert.match(textOf(tree),/No matching reminders/);
  find(tree,n=>textOf(n)==='Reset Filters'&&n.props?.onClick).props.onClick();tree=h.render(props);assert.match(textOf(tree),/Oil service/);
  find(tree,n=>n.type==='input'&&n.props.placeholder).props.onChange({target:{value:'unmatched'}});tree=h.render(props);assert.match(textOf(tree),/No matching reminders/);
  tree=h.render({...props,initialError:'offline'});assert.match(textOf(tree),/Totals and results are unavailable/);assert.doesNotMatch(textOf(tree),/Active reminders|No reminders yet/);
});
test('service completion requires explicit confirmation, prevents duplicate requests and never reports an unconfirmed service save', async () => {
  let release,calls=0;
  const r={...base,id:'one',title:'Oil service',vehicleId:'owned'};
  const h=hookHarness('src/components/reminders/RemindersListClient.tsx','RemindersListClient',{'@/app/actions/reminders':{getReminderModalData:async()=>({data:{reminder:r,vehicle:{id:'owned',displayName:'Test Car',currentMileage:0}},error:null}),completeReminderWithServiceLog:()=>{calls++;return new Promise(resolve=>release=resolve);}}});
  const props={initialError:null,initialVehicles:[],initialReminders:[r]};
  let tree=h.render(props);await find(tree,n=>n.props?.['aria-label']==='View details for Oil service').props.onClick();tree=h.render(props);
  const action=tree=>find(tree,n=>n.props?.onClick&&textOf(n)==='Confirm service completion');
  assert.equal(action(tree).props.disabled,true);await action(tree).props.onClick();assert.equal(calls,0);
  find(tree,n=>n.type==='input'&&n.props.type==='checkbox').props.onChange({target:{checked:true}});tree=h.render(props);
  const callback=action(tree).props.onClick;const first=callback();await callback();assert.equal(calls,1);
  release({success:false,error:'offline'});await first;tree=h.render(props);assert.match(textOf(tree),/offline/);assert.doesNotMatch(textOf(tree),/Reminder updated/);
  const second=action(tree).props.onClick();release({success:true,error:null});await second;tree=h.render(props);assert.match(textOf(tree),/Review maintenance history/);assert.doesNotMatch(textOf(tree),/Maintenance record saved/);
});
test('modal/page forms share the same implementation and validation errors are associated with controls', () => {
  const {AddMaintenanceForm}=load('src/app/(protected)/vehicles/[vehicleId]/maintenance/add/AddMaintenanceForm.tsx');
  const {EditMaintenanceForm}=load('src/app/(protected)/maintenance/[maintenanceId]/edit/EditMaintenanceForm.tsx');
  const add=AddMaintenanceForm({vehicleId:'owned',vehicle:{id:'owned',label:'Car',currentMileage:0}});
  const edit=EditMaintenanceForm({record:{...serviceSubmission(service),id:'log'}});
  assert.equal(add.props.children.type.name,'MaintenanceForm');assert.equal(edit.props.children.type.name,'MaintenanceForm');
  const {MaintenanceField}=load('src/components/maintenance/MaintenanceField.tsx');
  const html=renderToStaticMarkup(React.createElement(MaintenanceField,{name:'cost',label:'Cost (PHP)',error:'Invalid cost'},props=>React.createElement('input',props)));
  assert.match(html,/aria-invalid="true"/);assert.match(html,/aria-describedby="[^"]+-error"/);assert.match(html,/id="[^"]+-error"/);assert.match(html,/for="[^"]+"/);
});
test('existing edit destination updates only matching owner and vehicle; reminder update/delete remain owner-scoped', async () => {
  const f=actionsFixture();
  const saved=await f.maintenance.createMaintenanceRecord(serviceSubmission(service));
  const update=await f.maintenance.updateMaintenanceRecord({...serviceSubmission(service),id:saved.data.id,cost:100.25});
  assert.equal(update.data.cost,100.25);
  const call=f.calls.find(c=>c.table==='maintenance_logs'&&c.kind==='update');
  assert.ok(call.filters.some(([k,v])=>k==='user_id'&&v==='owner'));assert.ok(call.filters.some(([k,v])=>k==='vehicle_id'&&v==='owned'));
  assert.ok((await f.maintenance.updateMaintenanceRecord({...serviceSubmission(service),vehicleId:'foreign',id:saved.data.id})).error);
  await f.reminders.updateReminder({...reminderSubmission(reminder),id:'r'});await f.reminders.deleteReminder('r','owned');
  for(const call of f.calls.filter(c=>c.table==='reminders'&&['update','delete'].includes(c.kind))) assert.ok(call.filters.some(([k,v])=>k==='user_id'&&v==='owner'));
});
