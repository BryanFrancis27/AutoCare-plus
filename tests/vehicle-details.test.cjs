const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const Module = require('node:module');
const ts = require('typescript');
const React = require('react');
const { renderToStaticMarkup } = require('react-dom/server');

// Compile the real local modules in memory, using existing dependencies only.
function load(relative, mocks = {}, cache = new Map()) {
  const file = path.resolve(__dirname, '..', relative);
  if (cache.has(file)) return cache.get(file).exports;
  const target = new Module(file, module);
  target.filename = file;
  target.paths = module.paths;
  cache.set(file, target);
  const normalRequire = target.require.bind(target);
  target.require = request => {
    if (Object.hasOwn(mocks, request)) return mocks[request];
    const candidate = request.startsWith('@/') ? path.resolve(__dirname, '../src', request.slice(2)) : request.startsWith('.') ? path.resolve(path.dirname(file), request) : null;
    if (candidate) {
      const local = ['.ts', '.tsx', '/index.ts'].map(extension => candidate + extension).find(file => fs.existsSync(file));
      if (local) return load(path.relative(path.resolve(__dirname, '..'), local), mocks, cache);
    }
    return normalRequire(request);
  };
  const output = ts.transpileModule(fs.readFileSync(file, 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020, jsx: ts.JsxEmit.ReactJSX, esModuleInterop: true },
  }).outputText;
  target._compile(output, file);
  return target.exports;
}
const model = load('src/lib/vehicles/vehicle-model.ts');
const { normalizeVehicle, vehicleFormValues, validateVehicleForm, vehicleSubmission } = model;
const row = { id: '11111111-1111-1111-1111-111111111111', make: 'Toyota', model: 'Vios', year: 2023, vehicle_type: 'sedan', powertrain: 'gasoline', transmission: 'Automatic', current_mileage: 0, purchase_price: 0, notes: 'Existing note' };
const vehicle = normalizeVehicle(row);
const valid = vehicleFormValues(vehicle);

test('normalizes database snake_case and legacy references without inventing VIN', () => {
  const result = normalizeVehicle({ ...row, license_plate: 'ABC', photo_url: '/old.jpg', purchase_date: '2024-01-01', color: 'Red' });
  assert.equal(result.plate_number, 'ABC'); assert.equal(result.image_url, '/old.jpg');
  assert.equal(result.vehicle_type, 'sedan'); assert.equal(result.purchase_date, '2024-01-01');
  assert.equal(result.purchase_price, 0); assert.equal(result.current_mileage, 0);
  assert.equal(result.color, 'Red'); assert.equal('vin' in result, false);
  assert.equal(normalizeVehicle({ ...row, plate_number: '', license_plate: 'old', image_url: '', photo_url: '/old' }).image_url, '');
});
test('zero, empty, absent and invalid numeric fields do not become misleading zeroes', () => {
  for (const value of [undefined, null, '', ' ', 'invalid', Infinity, false]) assert.equal(normalizeVehicle({ current_mileage: value }).current_mileage, null);
  assert.equal(normalizeVehicle({ current_mileage: '0' }).current_mileage, 0);
  assert.equal(normalizeVehicle({ current_mileage: '123.5' }).current_mileage, 123.5);
  assert.equal(normalizeVehicle({}).year, null); assert.equal(normalizeVehicle({}).purchase_date, null);
});
test('populates every editable field and preserves zero in form strings', () => {
  const result = vehicleFormValues(normalizeVehicle({ ...row, plate_number: 'ABC', color: 'Red', purchase_date: '2024-01-01', image_url: '/car.jpg' }));
  assert.deepEqual(result, { ...valid, licensePlate: 'ABC', color: 'Red', purchaseDate: '2024-01-01' });
  assert.equal(result.currentMileage, '0'); assert.equal(result.purchasePrice, '0');
  assert.equal(Object.values(vehicleFormValues()).every(value => value === ''), true);
});
test('validation keeps existing required fields and accepts zero and decimals', () => {
  assert.deepEqual(validateVehicleForm(valid), {});
  assert.deepEqual(validateVehicleForm({ ...valid, currentMileage: '123.45', purchasePrice: '0.5' }), {});
  for (const field of ['make','model','year','vehicleType','powertrain','transmission','currentMileage']) assert.ok(validateVehicleForm({ ...valid, [field]: ' ' })[field]);
  for (const value of ['-1', 'NaN', 'Infinity', '12km', '1,000', '1e3']) assert.ok(validateVehicleForm({ ...valid, currentMileage: value }).currentMileage);
  assert.ok(validateVehicleForm({ ...valid, year: '2024.5' }).year);
  assert.ok(validateVehicleForm({ ...valid, purchasePrice: '-2' }).purchasePrice);
  assert.ok(validateVehicleForm({ ...valid, purchaseDate: '2025-02-29' }).purchaseDate);
  assert.equal(validateVehicleForm({ ...valid, purchaseDate: '2024-02-29' }).purchaseDate, undefined);
});
test('submission preserves decimal mileage and zero price; empty ownership fields clear as null', () => {
  const result = vehicleSubmission({ ...valid, currentMileage: '12.75', purchaseDate: '', purchasePrice: '' });
  assert.equal(result.currentMileage, 12.75); assert.equal(result.purchaseDate, null); assert.equal(result.purchasePrice, null);
  assert.equal(vehicleSubmission(valid).purchasePrice, 0); assert.equal(result.notes, row.notes);
  assert.equal('vin' in result, false);
});
test('reminder association excludes other vehicles and both completed representations', () => {
  const rows = [{ id:'a', vehicleId:row.id }, { id:'b', vehicleId:'other' }, { id:'c', vehicleId:row.id, isCompleted:true }, { id:'d', vehicleId:row.id, status:'completed' }];
  assert.deepEqual(model.vehicleReminders(rows,row.id).map(r=>r.id), ['a']);
});
test('confirmed saves reject errors, exceptions, missing and deleted records and return actual persisted values', async () => {
  for (const result of [{data:null,error:'internal DB details'}, {data:null,error:null}, {data:{},error:null}]) await assert.rejects(model.confirmedVehicleSave(async()=>result), /could not save/);
  const result = await model.confirmedVehicleSave(async()=>({data:{...row,notes:'persisted'},error:null}));
  assert.equal(result.notes,'persisted');
});

function hookHarness(relative, name, extra = {}) {
  const cells=[];let cursor=0;const effects=[];
  const hooks={...React,useState(initial){const i=cursor++;if(!cells[i])cells[i]={value:typeof initial==='function'?initial():initial};return [cells[i].value,next=>{cells[i].value=typeof next==='function'?next(cells[i].value):next;}];},useRef(initial){const i=cursor++;if(!cells[i])cells[i]={current:initial};return cells[i];},useEffect(fn,deps){const i=cursor++;const old=cells[i];if(!old||deps.some((d,j)=>d!==old[j]))effects.push(fn);cells[i]=deps;},useTransition(){return [false,fn=>fn()];}};
  const events=[];const router={refresh(){events.push('refresh');},push(url){events.push(url);}};
  const loaded=load(relative, {'react':hooks,'next/navigation':{useRouter:()=>router,useSearchParams:()=>new URLSearchParams()},...extra});
  return {events,render(props){cursor=0;const tree=loaded[name](props);while(effects.length)effects.shift()();return tree;}};
}
function nodes(tree) { if(!tree||typeof tree!=='object')return [];if(Array.isArray(tree))return tree.flatMap(nodes);return [tree,...nodes(tree.props?.children)]; }
function find(tree,predicate){const result=nodes(tree).find(predicate);assert.ok(result,'Expected element');return result;}
function textOf(tree){if(typeof tree==='string'||typeof tree==='number')return String(tree);if(!tree)return '';if(Array.isArray(tree))return tree.map(textOf).join('');return textOf(tree.props?.children);}

test('shared controller preserves entered values and only reports confirmed persisted success', async () => {
  let resolve,calls=0;const saved=[];
  const h=hookHarness('src/lib/vehicles/use-vehicle-form.ts','useVehicleForm',{'@/app/actions/vehicles':{updateVehicle:payload=>{calls++;assert.equal(payload.currentMileage,12.75);return new Promise(r=>resolve=r);}}});
  const props={vehicle,onSaved:v=>saved.push(v)};h.render(props);let form=h.render(props);
  form.setField('model','Updated model');form.setField('currentMileage','12.75');form=h.render(props);
  assert.equal(form.form.model,'Updated model');const pending=form.submit();form.submit();assert.equal(calls,1);assert.equal(saved.length,0);
  resolve({data:{...row,model:'Database result',current_mileage:12.75},error:null});await pending;
  assert.equal(saved[0].model,'Database result');assert.deepEqual(h.events,['refresh']);
});
test('save failure keeps shared form entries intact and safe retry feedback', async () => {
  const h=hookHarness('src/lib/vehicles/use-vehicle-form.ts','useVehicleForm',{'@/app/actions/vehicles':{updateVehicle:async()=>({data:null,error:'secret sql identifier'})}});
  const props={vehicle,onSaved:()=>assert.fail('must not report success')};h.render(props);let form=h.render(props);
  form.setField('notes','Draft note');form=h.render(props);await form.submit();form=h.render(props);
  assert.equal(form.form.notes,'Draft note');assert.equal(form.form.currentMileage,'0');assert.match(form.message,/entries are retained/);assert.doesNotMatch(form.message,/secret sql/);assert.equal(form.retry,true);assert.equal(h.events.length,0);
});
test('photo preview opts into local URLs, fallback handles missing and failed images', () => {
  const h=hookHarness('src/components/vehicles/VehicleImage.tsx','VehicleImage');
  let tree=h.render({src:'blob:preview',name:'Vios',allowLocalPreview:true});
  const image=find(tree,n=>n.props?.src==='blob:preview');assert.equal(image.props.alt,'Photo of Vios');
  image.props.onError();tree=h.render({src:'blob:preview',name:'Vios',allowLocalPreview:true});assert.match(textOf(tree),/Photo unavailable/);
  assert.match(textOf(h.render({src:null,name:'Vios'})),/No photo added yet/);
  assert.match(textOf(h.render({src:'javascript:bad',name:'Vios'})),/Photo unavailable/);
});
test('detail markup displays actual normalized data, zero, missing fields and separate read failures', () => {
  const mocks={'next/navigation':{useRouter:()=>({}),useSearchParams:()=>new URLSearchParams()},'@/components/reminders/AddReminderModal':{AddReminderModal:()=>null},'@/components/maintenance/LogMaintenanceModal':{LogMaintenanceModal:()=>null}};
  const {VehicleDetailsClient}=load('src/components/vehicles/VehicleDetailsClient.tsx',mocks);
  const render=props=>renderToStaticMarkup(React.createElement(VehicleDetailsClient,{vehicle,stats:{totalRecords:2,totalCost:500,lastServiceDate:'2026-10-01'},upcomingReminders:[],maintenanceError:false,remindersError:false,...props}));
  let html=render({});assert.match(html,/0 km/);assert.match(html,/\u20b10/);assert.match(html,/Existing note/);assert.doesNotMatch(html,/VIN/);assert.match(html,/Maintenance History/);
  html=render({maintenanceError:true,remindersError:true});assert.match(html,/Maintenance information could not be loaded/);assert.match(html,/Reminders could not be loaded/);assert.doesNotMatch(html,/No open reminders/);assert.doesNotMatch(html,/Recorded spending/);
  html=render({upcomingReminders:[{id:'r',title:'Oil',priority:'high',status:'upcoming',dueMileage:0}]});assert.match(html,/Priority: High/);assert.match(html,/Recorded status: Upcoming/);assert.match(html,/Due mileage: 0 km/);
});
function actionHarness({user={id:'owner'},data=row,error=null}={}) {
  const predicates=[];let queries=0;
  const chain={select(){return this;},eq(key,value){predicates.push([key,value]);return this;},maybeSingle:async()=>({data,error})};
  const actions=load('src/app/actions/vehicles.ts',{'@/lib/supabase/server':{createSupabaseServerClient:()=>({auth:{getUser:async()=>({data:{user},error:null})},from(){queries++;return chain;}})},'next/cache':{revalidatePath(){}},'./templates':{generateInitialReminders(){}}});
  return {actions,predicates,get queries(){return queries;}};
}
test('vehicle read rejects malformed IDs before querying and scopes valid IDs to authenticated owner',async()=>{
  const h=actionHarness();assert.equal((await h.actions.getVehicleById('invalid')).status,'missing');assert.equal(h.queries,0);
  const result=await h.actions.getVehicleById(row.id);assert.equal(result.data.current_mileage,0);assert.deepEqual(h.predicates,[['id',row.id],['user_id','owner']]);
});
test('missing/foreign/deleted vehicles share a safe response; unauthenticated reads never query',async()=>{
  const missing=actionHarness({data:null});assert.equal((await missing.actions.getVehicleById(row.id)).status,'missing');
  const unauth=actionHarness({user:null});assert.equal((await unauth.actions.getVehicleById(row.id)).data,null);assert.equal(unauth.queries,0);
  const failed=actionHarness({error:{message:'sensitive SQL'}});const result=await failed.actions.getVehicleById(row.id);assert.equal(result.status,'error');assert.doesNotMatch(result.error,/sensitive/);
});
test('overview catches independent reads and keeps reminder associations scoped',async()=>{
  const service=load('src/services/vehicleService.ts',{'@/app/actions/maintenance':{getMaintenanceStats:async()=>{throw Error('offline');}},'@/app/actions/reminders':{getRemindersForVehicle:async()=>({data:[{vehicleId:'other'},{id:'r',vehicleId:row.id}],error:null})}});
  const result=await service.getVehicleOverview(row.id);assert.equal(result.stats,null);assert.equal(result.maintenanceError,true);assert.equal(result.remindersError,false);assert.deepEqual(result.upcomingReminders.map(r=>r.id),['r']);
});
test('photo replacement is retained on upload failure; removing the draft photo saves explicit null', async () => {
  const {File}=require('node:buffer');const chosen=new File(['image'],'car.png',{type:'image/png'});const updated=[];
  const h=hookHarness('src/lib/vehicles/use-vehicle-form.ts','useVehicleForm',{
    '@/lib/vehicles/image-processing':{optimizeImageForUpload:async file=>file},
    '@/app/actions/vehicles':{uploadVehicleImage:async()=>({data:null,error:'storage policy details'}),updateVehicle:async payload=>{updated.push(payload);return {data:{...row,image_url:payload.imageUrl},error:null};}},
  });
  const props={vehicle:normalizeVehicle({...row,image_url:'/old.jpg'}),onSaved:()=>{}};h.render(props);let form=h.render(props);
  await form.choosePhoto({target:{files:[chosen],value:'fakepath'}});form=h.render(props);assert.ok(form.preview.startsWith('blob:'));
  await form.submit();form=h.render(props);assert.equal(updated.length,0);assert.match(form.message,/photo could not be uploaded/);assert.doesNotMatch(form.message,/storage policy details/);
  form.removePhoto();form=h.render(props);await form.submit();assert.equal(updated.length,1);assert.equal(updated[0].imageUrl,null);
});
test('unsupported images retain the existing preview without mutating', async()=>{
  let writes=0;
  const h=hookHarness('src/lib/vehicles/use-vehicle-form.ts','useVehicleForm',{'@/app/actions/vehicles':{updateVehicle:async()=>writes++}});
  const props={vehicle:normalizeVehicle({...row,image_url:'/old.jpg'}),onSaved:()=>{}};h.render(props);let form=h.render(props);
  await form.choosePhoto({target:{files:[{type:'image/svg+xml',size:20}],value:'fake'}});form=h.render(props);
  assert.match(form.message,/Choose a JPEG/);assert.equal(form.preview,'/old.jpg');assert.equal(writes,0);assert.equal(form.dirty,false);
});
test('update mutation maps fields and explicit clears, scopes owner, and revalidates detail/garage/dashboard',async()=>{
  const predicates=[],paths=[];let payload;
  const chain={update(value){payload=value;return this;},eq(k,v){predicates.push([k,v]);return this;},select(){return this;},single:async()=>({data:row,error:null})};
  const actions=load('src/app/actions/vehicles.ts',{'@/lib/supabase/server':{createSupabaseServerClient:()=>({auth:{getUser:async()=>({data:{user:{id:'owner'}},error:null})},from:()=>chain})},'next/cache':{revalidatePath:p=>paths.push(p)},'./templates':{generateInitialReminders(){}}});
  await actions.updateVehicle({id:row.id,...vehicleSubmission({...valid,currentMileage:'0',purchaseDate:'',purchasePrice:''}),imageUrl:null});
  assert.equal(payload.current_mileage,0);assert.equal(payload.purchase_price,null);assert.equal(payload.purchase_date,null);assert.equal(payload.image_url,null);assert.equal(payload.plate_number,null);
  assert.deepEqual(predicates,[['id',row.id],['user_id','owner']]);assert.deepEqual(paths,['/vehicles',`/vehicles/${row.id}`,'/dashboard']);
});
test('signed URL renewal only signs this project owner path and leaves foreign/public URLs intact',async()=>{
  const previous=process.env.NEXT_PUBLIC_SUPABASE_URL;process.env.NEXT_PUBLIC_SUPABASE_URL='https://project.example';
  const signed=[];let source;
  const supabase={auth:{getUser:async()=>({data:{user:{id:'owner'}},error:null})},from:()=>({select(){return this;},eq(){return this;},maybeSingle:async()=>({data:{...row,image_url:source},error:null})}),storage:{from:bucket=>({createSignedUrl:async path=>{signed.push([bucket,path]);return {data:{signedUrl:'https://project.example/renewed'},error:null};}})}};
  const actions=load('src/app/actions/vehicles.ts',{'@/lib/supabase/server':{createSupabaseServerClient:()=>supabase},'next/cache':{revalidatePath(){}},'./templates':{generateInitialReminders(){}}});
  try {
    for(const url of ['https://foreign.example/storage/v1/object/sign/vehicles/owner/car.jpg','https://project.example/storage/v1/object/sign/vehicles/another-owner/car.jpg','https://project.example/storage/v1/object/public/vehicles/owner/car.jpg']){source=url;assert.equal((await actions.getVehicleById(row.id)).data.image_url,url);}
    assert.equal(signed.length,0);source='https://project.example/storage/v1/object/sign/vehicles/owner/car.jpg?token=expired';
    assert.equal((await actions.getVehicleById(row.id)).data.image_url,'https://project.example/renewed');assert.deepEqual(signed,[['vehicles','owner/car.jpg']]);
  } finally {if(previous===undefined)delete process.env.NEXT_PUBLIC_SUPABASE_URL;else process.env.NEXT_PUBLIC_SUPABASE_URL=previous;}
});
test('uploads use authenticated owner storage only; policy/signing errors remain safe',async()=>{
  const calls=[];let failUpload=false,failSign=false;
  const actions=load('src/app/actions/vehicles.ts',{'@/lib/supabase/server':{createSupabaseServerClient:()=>({auth:{getUser:async()=>({data:{user:{id:'owner'}},error:null})},storage:{from:bucket=>{assert.equal(bucket,'vehicles');return {upload:async path=>{calls.push(path);return {error:failUpload?{message:'policy internals'}:null};},createSignedUrl:async()=>({data:failSign?null:{signedUrl:'https://project.example/signed'}})};}}})},'next/cache':{revalidatePath(){}},'./templates':{generateInitialReminders(){}}});
  const body={get:()=>({type:'image/jpeg',name:'car.jpg',size:50,arrayBuffer:async()=>new ArrayBuffer(50)})};
  let result=await actions.uploadVehicleImage(body);assert.equal(result.data.displayUrl,'https://project.example/signed');assert.ok(calls[0].startsWith('owner/'));
  failUpload=true;result=await actions.uploadVehicleImage(body);assert.equal(result.data,null);assert.doesNotMatch(result.error,/policy internals/);
  failUpload=false;failSign=true;result=await actions.uploadVehicleImage(body);assert.equal(result.data,null);assert.match(result.error,/preview is unavailable/);
  const before=calls.length;result=await actions.uploadVehicleImage({get:()=>({type:'image/svg+xml',arrayBuffer(){}})});assert.equal(result.data,null);assert.equal(calls.length,before);
});
test('maintenance overview totals every page with owner/vehicle scoping and latest service first',async()=>{
  const rows=Array.from({length:1102},(_,index)=>({id:String(index),service_date:index===0?'2026-10-30':'2026-01-01',cost:2,next_due_date:null}));
  const ranges=[],predicates=[];let failing=false;
  const actions=load('src/app/actions/maintenance.ts',{'@/lib/supabase/server':{createSupabaseServerClient:()=>({auth:{getUser:async()=>({data:{user:{id:'owner'}}})},from:()=>({select(){return this;},eq(k,v){predicates.push([k,v]);return this;},order(){return this;},range:async(start,end)=>{ranges.push([start,end]);return {data:failing?null:rows.slice(start,end+1),count:rows.length,error:failing?{message:'internal'}:null};}})})},'next/cache':{revalidatePath(){}}});
  let result=await actions.getMaintenanceStats(row.id);assert.equal(result.data.totalRecords,1102);assert.equal(result.data.totalCost,2204);assert.equal(result.data.lastServiceDate,'2026-10-30');assert.deepEqual(ranges,[[0,499],[500,999],[1000,1499]]);
  assert.ok(predicates.every(([key,value])=>key==='user_id'?value==='owner':key==='vehicle_id'&&value===row.id));
  failing=true;result=await actions.getMaintenanceStats(row.id);assert.equal(result.data,null);assert.doesNotMatch(result.error,/internal/);
});
test('explicitly cleared canonical photo and plate do not resurrect older aliases',()=>{
  const normalized=normalizeVehicle({...row,image_url:null,photo_url:'/legacy.jpg',plate_number:null,license_plate:'OLD'});
  assert.equal(normalized.image_url,null);assert.equal(normalized.plate_number,null);
  assert.equal(normalizeVehicle({...row,photo_url:'/legacy.jpg',license_plate:'OLD'}).image_url,'/legacy.jpg');
});
