const {test}=require('node:test');
const assert=require('node:assert/strict');
const {File}=require('node:buffer');
const {load,hookHarness,nodes,find,textOf,React,renderToStaticMarkup}=require('./vehicle-test-helpers.cjs');
const model=load('src/lib/vehicles/vehicle-model.ts');
const row={id:'11111111-1111-1111-1111-111111111111',make:'Toyota',model:'Vios',year:2023,plate_number:'ABC 123',color:'White',vehicle_type:'sedan',powertrain:'gasoline',transmission:'Automatic',current_mileage:0,purchase_date:'2024-02-29',purchase_price:1234.75,notes:'Owned since new',image_url:'/car.jpg'};
const vehicle=model.normalizeVehicle(row);
const valid=model.vehicleFormValues(vehicle);
function controllerHarness(actions={},extra={}){
  const saved=[];
  const h=hookHarness('src/lib/vehicles/use-vehicle-form.ts','useVehicleForm',{'@/app/actions/vehicles':actions,...extra});
  const props={vehicle,onSaved:v=>saved.push(v)};
  h.render(props);
  return {h,props,saved,render:()=>h.render(props)};
}
function browserEvents(t){
  const previous=global.window,raf=global.requestAnimationFrame;
  const listeners=new Map();
  global.window={addEventListener:(type,fn)=>listeners.set(type,fn),removeEventListener:(type,fn)=>{if(listeners.get(type)===fn)listeners.delete(type);}};
  global.requestAnimationFrame=fn=>fn();
  t.after(()=>{if(previous===undefined)delete global.window;else global.window=previous;if(raf===undefined)delete global.requestAnimationFrame;else global.requestAnimationFrame=raf;});
  return listeners;
}
function editorHarness(actions={},extra={}) {
  const navigation={guard:null,register(fn){this.guard=fn;return()=>{if(this.guard===fn)this.guard=null;};},request(fn){if(this.guard)this.guard(fn);else fn();}};
  const h=hookHarness('src/components/vehicles/EditVehicleClient.tsx','EditVehicleClient',{'@/app/actions/vehicles':actions,'@/components/layout/NavigationGuard':{useNavigationGuard:()=>navigation},...extra});
  const props={vehicle};h.render(props);
  const render=()=>h.render(props);
  const controller=tree=>find(tree,n=>n.props?.controller).props.controller;
  return {h,navigation,render,controller};
}

test('editor populates every editable field in one page, preserving optional fields and zero',()=>{
  const {EditVehicleClient}=load('src/components/vehicles/EditVehicleClient.tsx',{'next/navigation':{useRouter:()=>({})},'@/app/actions/vehicles':{}});
  const html=renderToStaticMarkup(React.createElement(EditVehicleClient,{vehicle}));
  for(const heading of ['Basic Information','Technical Information','Ownership Information','Vehicle Photo','Live draft preview'])assert.ok(html.includes(heading),heading);
  for(const [field,value]of Object.entries(valid)){
    assert.ok(html.includes('name="'+field+'"'),field);
    if(field==='notes')assert.ok(html.includes('>'+value+'</textarea>'));
    else if(['vehicleType','powertrain','transmission'].includes(field))assert.ok(html.includes('value="'+value+'" selected=""'));
    else assert.ok(html.includes('value="'+value+'"'),field+' populated');
  }
  assert.match(html,/object-contain/);assert.match(html,/h-44/);assert.doesNotMatch(html,/Step 1|>Next<|Vehicle setup progress/);
  assert.match(html,/No unsaved changes/);assert.match(html,/disabled=""[^>]*>.*?Save Changes/);
});
test('pristine controller suppresses writes, detects edits to every field and becomes pristine on reversal',async()=>{
  let writes=0;const {h,render}=controllerHarness({updateVehicle:async()=>writes++});
  let c=render();assert.equal(c.dirty,false);await c.submit();assert.equal(writes,0);
  for(const field of Object.keys(valid)){c.setField(field,valid[field]+'x');c=render();assert.equal(c.dirty,true,field);c.setField(field,valid[field]);c=render();assert.equal(c.dirty,false,field+' restored');}
  h.unmount();
});
test('field rendering retains supported legacy option values and associates validation errors',()=>{
  const {VehicleFormFields}=load('src/components/vehicles/VehicleFormFields.tsx');
  const form={...valid,vehicleType:'legacy-type',powertrain:'hydrogen',transmission:'Legacy Manual',currentMileage:'-1'};
  const errors=model.validateVehicleForm(form);
  const tree=VehicleFormFields({controller:{form,errors,blocked:false,setField(){}},fields:model.STEP_FIELDS.flat(),prefix:'test'});
  for(const value of ['legacy-type','hydrogen','Legacy Manual'])assert.ok(nodes(tree).some(n=>n.type==='option'&&n.props.value===value));
  const input=find(tree,n=>n.props?.name==='currentMileage');assert.equal(input.props['aria-invalid'],true);assert.match(input.props['aria-describedby'],/test-currentMileage-error/);assert.ok(nodes(tree).some(n=>n.props?.id==='test-currentMileage-error'));
});
test('all-field validation retains invalid drafts without mutation, including required and date errors',async()=>{
  let writes=0;const {h,render}=controllerHarness({updateVehicle:async()=>writes++});let c=render();
  c.setField('make',' ');c.setField('currentMileage','-1');c.setField('purchaseDate','2025-02-29');c=render();await c.submit();c=render();
  assert.ok(c.errors.make);assert.ok(c.errors.currentMileage);assert.ok(c.errors.purchaseDate);assert.equal(c.form.currentMileage,'-1');assert.equal(writes,0);h.unmount();
});
test('zero and decimals, explicit ownership clears, confirmed persisted result and duplicate guard',async()=>{
  let resolve;const payloads=[];
  const {h,render,saved}=controllerHarness({updateVehicle:p=>{payloads.push(p);return new Promise(r=>resolve=r);}});let c=render();
  c.setField('notes','');c.setField('purchaseDate','');c.setField('purchasePrice','0.25');c=render();const pending=c.submit();c.submit();assert.equal(payloads.length,1);
  assert.equal(payloads[0].currentMileage,0);assert.equal(payloads[0].purchasePrice,0.25);assert.equal(payloads[0].purchaseDate,null);assert.equal(payloads[0].notes,'');assert.equal(saved.length,0);
  resolve({data:{...row,purchase_date:null,purchase_price:0.25,notes:'persisted response'},error:null});await pending;c=render();
  assert.equal(c.dirty,false);assert.equal(saved[0].notes,'persisted response');assert.deepEqual(h.events,['refresh']);await c.submit();assert.equal(payloads.length,1);h.unmount();
});
test('failed save retains drafts and enables explicit retry even after reverting fields',async()=>{
  let writes=0;const {h,render}=controllerHarness({updateVehicle:async()=>{writes++;throw Error('internal identifier');}});let c=render();c.setField('model','Draft model');c=render();await c.submit();c=render();
  assert.equal(c.form.model,'Draft model');assert.equal(c.dirty,true);assert.equal(c.retry,true);assert.doesNotMatch(c.message,/internal identifier/);
  c.setField('model',vehicle.model);c=render();assert.equal(c.dirty,false);await c.submit();assert.equal(writes,2);h.unmount();
});
test('photo replacement and removal are dirty; undo and removing a newly selected photo restore pristine state',async()=>{
  const {h,render}=controllerHarness({}, {'@/lib/vehicles/image-processing':{optimizeImageForUpload:async file=>file}});let c=render();const image=new File(['image'],'car.png',{type:'image/png'});
  await c.choosePhoto({target:{files:[image],value:''}});c=render();assert.equal(c.photoChanged,true);assert.equal(c.dirty,true);
  c.restorePhoto();c=render();assert.equal(c.preview,row.image_url);assert.equal(c.dirty,false);
  c.removePhoto();c=render();assert.equal(c.preview,null);assert.equal(c.dirty,true);c.restorePhoto();c=render();assert.equal(c.dirty,false);
  const revoke=URL.revokeObjectURL,revoked=[];URL.revokeObjectURL=value=>revoked.push(value);
  try{await c.choosePhoto({target:{files:[image],value:''}});c=render();const last=c.preview;h.unmount();assert.ok(revoked.includes(last));}finally{URL.revokeObjectURL=revoke;}
  const direct=hookHarness('src/lib/vehicles/use-vehicle-form.ts','useVehicleForm',{'@/app/actions/vehicles':{},'@/lib/vehicles/image-processing':{optimizeImageForUpload:async file=>file}});const options={vehicle:{...vehicle,image_url:null},onSaved(){}};direct.render(options);c=direct.render(options);await c.choosePhoto({target:{files:[image],value:''}});c=direct.render(options);c.removePhoto();c=direct.render(options);assert.equal(c.dirty,false);direct.unmount();
});
test('closing during photo processing ignores late completion and releases no stale preview',async()=>{
  let resolve;const {h,render}=controllerHarness({}, {'@/lib/vehicles/image-processing':{optimizeImageForUpload:()=>new Promise(r=>resolve=r)}});let c=render();
  const pending=c.choosePhoto({target:{files:[new File(['x'],'car.png',{type:'image/png'})],value:''}});h.unmount();resolve(new File(['x'],'car.png',{type:'image/png'}));await pending;
  // The async operation settled after cleanup without publishing a new preview.
  assert.equal(c.preview,row.image_url);
});
test('pristine Cancel leaves immediately without confirmation or persistence',t=>{
  browserEvents(t);let writes=0;const e=editorHarness({updateVehicle:async()=>writes++});let tree=e.render();
  find(tree,n=>n.type==='button'&&textOf(n)==='Cancel').props.onClick();tree=e.render();assert.deepEqual(e.h.events,[`/vehicles/${row.id}`]);assert.equal(find(tree,n=>n.props?.title==='Discard unsaved changes?').props.isOpen,false);assert.equal(writes,0);e.h.unmount();
});
test('dirty Cancel supports Keep Editing, accessible dismissal and Discard without writing',t=>{
  const listeners=browserEvents(t);let writes=0;const e=editorHarness({updateVehicle:async()=>writes++});let tree=e.render();e.controller(tree).setField('notes','Unsaved');tree=e.render();
  assert.ok(listeners.has('beforeunload'));assert.match(textOf(tree),/Unsaved changes/);
  find(tree,n=>n.type==='button'&&textOf(n)==='Cancel').props.onClick();tree=e.render();let dialog=find(tree,n=>n.props?.title==='Discard unsaved changes?');assert.equal(dialog.props.isOpen,true);assert.equal(e.h.events.length,0);
  find(dialog,n=>n.type==='button'&&textOf(n)==='Keep Editing').props.onClick();tree=e.render();assert.equal(e.controller(tree).form.notes,'Unsaved');
  find(tree,n=>n.type==='button'&&textOf(n)==='Cancel').props.onClick();tree=e.render();dialog=find(tree,n=>n.props?.title==='Discard unsaved changes?');dialog.props.onClose();tree=e.render();assert.equal(find(tree,n=>n.props?.title==='Discard unsaved changes?').props.isOpen,false);
  find(tree,n=>n.type==='button'&&textOf(n)==='Cancel').props.onClick();tree=e.render();find(tree,n=>n.type==='button'&&textOf(n)==='Discard Changes').props.onClick();assert.deepEqual(e.h.events,[`/vehicles/${row.id}`]);assert.equal(writes,0);e.h.unmount();assert.equal(listeners.size,0);
});
test('editor guards sidebar/header requests, restores pristine navigation and uses native refresh warning',t=>{
  const listeners=browserEvents(t);const e=editorHarness();let tree=e.render();e.controller(tree).setField('model','Unsaved model');tree=e.render();let navigated=0;e.navigation.request(()=>navigated++);tree=e.render();assert.equal(navigated,0);assert.equal(find(tree,n=>n.props?.title==='Discard unsaved changes?').props.isOpen,true);
  let prevented=false;const event={preventDefault(){prevented=true;},returnValue:null};listeners.get('beforeunload')(event);assert.equal(prevented,true);assert.equal(event.returnValue,'');
  find(tree,n=>n.type==='button'&&textOf(n)==='Keep Editing').props.onClick();tree=e.render();e.controller(tree).setField('model',row.model);tree=e.render();assert.equal(listeners.has('beforeunload'),false);e.navigation.request(()=>navigated++);assert.equal(navigated,1);e.h.unmount();assert.equal(e.navigation.guard,null);
});
test('successful editor save refreshes and navigates only after persistence, bypassing discard prompt',async t=>{
  const listeners=browserEvents(t);let resolve;const e=editorHarness({updateVehicle:()=>new Promise(r=>resolve=r)});let tree=e.render();e.controller(tree).setField('notes','Save me');tree=e.render();
  const c=e.controller(tree);const pending=c.submit();c.submit();tree=e.render();assert.ok(nodes(tree).filter(n=>n.type==='button'&&n.props.type==='submit').every(n=>n.props.disabled));assert.equal(e.h.events.length,0);
  e.navigation.request(()=>assert.fail('must not leave while saving'));resolve({data:{...row,notes:'Save me'},error:null});await pending;tree=e.render();assert.deepEqual(e.h.events,['refresh',`/vehicles/${row.id}?saved=1`]);assert.equal(e.controller(tree).dirty,false);assert.equal(listeners.has('beforeunload'),false);assert.equal(find(tree,n=>n.props?.title==='Discard unsaved changes?').props.isOpen,false);e.h.unmount();
});
test('Add Vehicle retains all three guided steps and preserves input through Back and Next',async t=>{
  browserEvents(t);const h=hookHarness('src/components/vehicles/AddVehicleModal.tsx','AddVehicleModal',{'@/app/actions/vehicles':{createVehicle:async()=>({data:row,error:null})}});let closed=0;const props={isOpen:true,onClose:()=>closed++};h.render(props);let tree=h.render(props);
  let c=find(tree,n=>n.props?.controller).props.controller;for(const field of model.STEP_FIELDS[0])c.setField(field,valid[field]);tree=h.render(props);
  find(tree,n=>n.type==='form').props.onSubmit({preventDefault(){}});tree=h.render(props);assert.match(textOf(tree),/Step 2 of 3/);c=find(tree,n=>n.props?.controller).props.controller;for(const field of model.STEP_FIELDS[1])c.setField(field,valid[field]);tree=h.render(props);
  find(tree,n=>n.type==='button'&&textOf(n)==='Back').props.onClick();tree=h.render(props);assert.equal(find(tree,n=>n.props?.controller).props.controller.form.model,row.model);
  find(tree,n=>n.type==='form').props.onSubmit({preventDefault(){}});tree=h.render(props);assert.equal(find(tree,n=>n.props?.controller).props.controller.form.currentMileage,'0');find(tree,n=>n.type==='form').props.onSubmit({preventDefault(){}});tree=h.render(props);assert.match(textOf(tree),/Step 3 of 3/);
  find(tree,n=>n.type==='form').props.onSubmit({preventDefault(){}});await new Promise(setImmediate);assert.equal(closed,1);assert.deepEqual(h.events,['refresh']);h.unmount();
});
test('navigation provider registers and cleans up a scoped guard; no guard executes immediately',()=>{
  const h=hookHarness('src/components/layout/NavigationGuard.tsx','NavigationGuardProvider');const provider=h.render({children:null});const navigation=provider.props.value;let count=0,pending;
  navigation.request(()=>count++);assert.equal(count,1);const cleanup=navigation.register(action=>pending=action);navigation.request(()=>count++);assert.equal(count,1);pending();assert.equal(count,2);cleanup();navigation.request(()=>count++);assert.equal(count,3);h.unmount();
});
test('edit entry points use dedicated route while card View/Delete/Maintenance/Expenses remain available',()=>{
  const fs=require('node:fs');const {GarageVehicleCard}=load('src/components/vehicles/GarageVehicleCard.tsx');const html=renderToStaticMarkup(React.createElement(GarageVehicleCard,{vehicle,onView(){},onDelete(){},onLogMaintenance(){},onServiceHistory(){}}));assert.match(html,new RegExp(`href="/vehicles/${row.id}/edit"`));for(const label of ['View Vehicle','Delete Vehicle','Log Maintenance','Service &amp; Expenses'])assert.ok(html.includes(label));
  const garage=fs.readFileSync('src/components/vehicles/VehiclesListClient.tsx','utf8');assert.doesNotMatch(garage,/mode="edit"|vehicleToEdit/);assert.match(garage,/vehicleToView.id\}\/edit/);
});
test('guarded shell links defer same-tab navigation, preserve modifier clicks and close menus only on approval',()=>{
  let pending,closed=0;const paths=[];
  const navigation={request:fn=>pending=fn};
  const {GuardedLink}=load('src/components/layout/NavigationGuard.tsx',{'react':{...React,useContext:()=>navigation},'next/navigation':{useRouter:()=>({push:path=>paths.push(path)})}});
  const tree=GuardedLink({href:'/vehicles',onNavigate:()=>closed++,children:'Garage'});
  let prevented=0;
  tree.props.onClick({button:0,ctrlKey:true,preventDefault(){prevented++;}});assert.equal(prevented,0);assert.equal(pending,undefined);assert.equal(closed,0);
  tree.props.onClick({button:0,preventDefault(){prevented++;}});assert.equal(prevented,1);assert.equal(closed,0);assert.equal(paths.length,0);pending();assert.equal(closed,1);assert.deepEqual(paths,['/vehicles']);
});
test('pristine or failed processing cannot create phantom photo changes; a late unmounted result creates no object URL',async()=>{
  let resolve;const {h,render}=controllerHarness({}, {'@/lib/vehicles/image-processing':{optimizeImageForUpload:()=>new Promise(r=>resolve=r)}});const c=render();
  const original=URL.createObjectURL;let created=0;URL.createObjectURL=()=>{created++;return 'blob:unexpected';};
  try{const pending=c.choosePhoto({target:{files:[new File(['x'],'car.png',{type:'image/png'})],value:''}});h.unmount();resolve(new File(['x'],'car.png',{type:'image/png'}));await pending;assert.equal(created,0);}finally{URL.createObjectURL=original;}
});
test('photo processing blocks app navigation and activates native unload protection before a preview exists',async t=>{
  const listeners=browserEvents(t);let resolve;
  const e=editorHarness({}, {'@/lib/vehicles/image-processing':{optimizeImageForUpload:()=>new Promise(r=>resolve=r)}});let tree=e.render();
  const pending=e.controller(tree).choosePhoto({target:{files:[new File(['image'],'car.png',{type:'image/png'})],value:''}});tree=e.render();
  assert.equal(e.controller(tree).processing,true);assert.ok(listeners.has('beforeunload'));e.navigation.request(()=>assert.fail('must not leave during processing'));
  resolve(new File(['image'],'car.png',{type:'image/png'}));await pending;tree=e.render();assert.equal(e.controller(tree).dirty,true);assert.ok(listeners.has('beforeunload'));e.h.unmount();assert.equal(listeners.size,0);
});
