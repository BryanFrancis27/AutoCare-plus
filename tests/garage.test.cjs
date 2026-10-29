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
const model = load('src/lib/vehicles/garage-model.ts');
const vehicle = (id, overrides = {}) => ({ id, make: 'Toyota', model: 'Corolla', year: 2024, plate_number: 'ABC 123', current_mileage: 12000, vehicle_type: 'sedan', powertrain: 'gasoline', created_at: '2026-10-01T00:00:00Z', ...overrides });
const fleet = [
  vehicle('toyota'),
  vehicle('honda', { make: 'Honda', model: 'CR-V', year: 2020, plate_number: 'XYZ 456', vehicle_type: 'suv', current_mileage: 50000, created_at: '2026-10-20T00:00:00Z' }),
  vehicle('ford', { make: 'Ford', model: 'Ranger', year: 2022, plate_number: null, vehicle_type: 'pickup', current_mileage: 0, created_at: '2026-10-10T00:00:00Z' }),
  vehicle('unknown', { make: '', model: '', year: null, plate_number: null, vehicle_type: null, current_mileage: null, created_at: null }),
];
const ids = rows => rows.map(row => row.id);

test('search matches make, model, year and plate without case sensitivity', () => {
  for (const [term, expected] of [['hONDa', 'honda'], ['corolla', 'toyota'], ['2022', 'ford'], ['xYz 456', 'honda'], ['  Toyota 2024  ', 'toyota']]) {
    assert.deepEqual(ids(model.selectGarageVehicles(fleet, term, 'all', 'name-asc')), [expected]);
  }
  assert.equal(model.selectGarageVehicles(fleet, '    ', 'all', 'name-asc').length, 4);
});

test('search, type and sort compose, including genuinely empty matches', () => {
  const data = [...fleet, vehicle('older-toyota', { year: 2018, current_mileage: 80000 })];
  assert.deepEqual(ids(model.selectGarageVehicles(data, 'toyota', 'sedan', 'year-oldest')), ['older-toyota', 'toyota']);
  assert.deepEqual(ids(model.selectGarageVehicles(data, 'toyota', 'suv', 'name-asc')), []);
  assert.deepEqual(ids(model.selectGarageVehicles(data, 'not-a-vehicle', 'all', 'name-asc')), []);
  assert.deepEqual(ids(model.selectGarageVehicles(data, '', 'unspecified', 'name-asc')), ['unknown']);
});

test('all six required sorts put missing values last and keep real zero mileage', () => {
  const expected = {
    'name-asc': ['ford', 'honda', 'toyota', 'unknown'],
    'name-desc': ['toyota', 'honda', 'ford', 'unknown'],
    'year-newest': ['toyota', 'ford', 'honda', 'unknown'],
    'year-oldest': ['honda', 'ford', 'toyota', 'unknown'],
    'mileage-highest': ['honda', 'toyota', 'ford', 'unknown'],
    'mileage-lowest': ['ford', 'toyota', 'honda', 'unknown'],
  };
  for (const [sort, result] of Object.entries(expected)) assert.deepEqual(ids(model.selectGarageVehicles(fleet, '', 'all', sort)), result);
});

test('recent sorting is offered only with valid timestamps and falls back safely otherwise', () => {
  const known = fleet.slice(0, 3);
  assert.equal(model.hasReliableTimestamps(known), true);
  assert.deepEqual(ids(model.selectGarageVehicles(known, '', 'all', 'recent')), ['honda', 'ford', 'toyota']);
  assert.equal(model.hasReliableTimestamps(fleet), false);
  assert.equal(model.hasReliableTimestamps([]), false);
  assert.equal(model.hasReliableTimestamps([vehicle('bad-date', { created_at: 'invalid' })]), false);
  assert.deepEqual(ids(model.selectGarageVehicles(fleet, '', 'all', 'recent')), ids(model.selectGarageVehicles(fleet, '', 'all', 'name-asc')));
});

test('sort ties are stable and array/records are not mutated', () => {
  const data = [vehicle('z'), vehicle('a')];
  const before = JSON.stringify(data);
  for (const { value } of model.GARAGE_SORTS) assert.deepEqual(ids(model.selectGarageVehicles(data, '', 'all', value)), ['a', 'z']);
  assert.equal(JSON.stringify(data), before);
  assert.deepEqual(model.selectGarageVehicles([], '', 'all', 'name-asc'), []);
});

test('types are derived from actual records, normalized and deduplicated', () => {
  const options = model.garageTypeOptions([...fleet, vehicle('same-type', { vehicle_type: ' SUV ' })]);
  assert.equal(options.filter(option => option.value === 'suv').length, 1);
  assert.equal(options.find(option => option.value === 'suv').label, 'SUV');
  assert.ok(options.some(option => option.value === 'unspecified'));
  assert.equal(model.classificationLabel('electric'), 'Electric');
  assert.equal(model.classificationLabel(null), 'Not recorded');
});

test('mileage formatting uses shared km conventions without converting or mutating numbers', () => {
  for (const [value, expected] of [[0, '0 km'], [12000, '12,000 km'], [123.45, '123.45 km']]) assert.equal(model.formatRecordedMileage(value), expected);
  for (const value of [null, undefined, NaN, Infinity]) assert.equal(model.formatRecordedMileage(value), 'Mileage not recorded');
  const original = vehicle('same', { current_mileage: 6213.7 });
  model.formatRecordedMileage(original.current_mileage);
  assert.equal(original.current_mileage, 6213.7);
});

test('normalization preserves image aliases, timestamps, zero and raw stored mileage', () => {
  for (const field of ['image_url', 'photo_url', 'image']) {
    const normalized = model.normalizeGarageVehicle(vehicle('photo', { [field]: 'https://example.test/car.jpg', current_mileage: 6213.7 }));
    assert.equal(normalized.image_url, 'https://example.test/car.jpg');
    assert.equal(normalized.current_mileage, 6213.7);
    assert.equal(normalized.created_at, '2026-10-01T00:00:00Z');
  }
  assert.equal(model.normalizeGarageVehicle(vehicle('zero', { current_mileage: 0 })).current_mileage, 0);
});

test('missing/malformed photos fall back while valid uploaded and local URLs remain intact', () => {
  for (const source of ['', null, 'not-a-url', '//example.test/car.jpg', 'javascript:alert(1)']) assert.equal(model.usableVehiclePhoto(source), null);
  assert.equal(model.usableVehiclePhoto('https://example.test/car.jpg'), 'https://example.test/car.jpg');
  assert.equal(model.usableVehiclePhoto('/vehicle.jpg'), '/vehicle.jpg');
});

test('existing monthly/yearly expense summaries retain their calendar boundaries', () => {
  const entries = [
    { id: 'a', serviceDate: '2026-10-01', cost: 100 },
    { id: 'b', serviceDate: '2026-09-30', cost: 200 },
    { id: 'c', serviceDate: '2025-10-01', cost: 400 },
    { id: 'd', serviceDate: 'invalid', cost: 1000 },
  ];
  assert.deepEqual(model.summarizeGarageExpenses(entries, new Date(2026, 9, 29)), { monthlyTotal: 100, yearlyTotal: 300 });
});

const { GarageVehicleCard } = load('src/components/vehicles/GarageVehicleCard.tsx');
const { VehicleImage } = load('src/components/vehicles/VehicleImage.tsx');
const { GarageToolbar } = load('src/components/vehicles/GarageToolbar.tsx');
const noop = () => {};
const handlers = { onView: noop, onEdit: noop, onDelete: noop, onLogMaintenance: noop, onServiceHistory: noop };

test('vehicle card renders genuine identity, km, classification and all five accessible actions', () => {
  const html = renderToStaticMarkup(React.createElement(GarageVehicleCard, { vehicle: vehicle('card'), ...handlers }));
  for (const value of ['Toyota Corolla', '2024', 'ABC 123', '12,000 km', 'Sedan', 'Gasoline', 'View Vehicle', 'Edit Vehicle', 'Delete Vehicle', 'Log Maintenance', 'Service &amp; Expenses']) assert.ok(html.includes(value), value);
  assert.match(html, /aria-label="Delete vehicle: 2024 Toyota Corolla"/);
  assert.doesNotMatch(html, /Active|healthy|generate reminders| miles|health score/i);
});

function buttons(element, output = []) {
  if (!React.isValidElement(element)) return output;
  if (element.type === 'button') output.push(element);
  React.Children.forEach(element.props.children, child => buttons(child, output));
  return output;
}
test('card actions dispatch their exact vehicle to existing workflow callbacks, without deleting directly', () => {
  const received = [];
  const target = vehicle('action-target');
  const callbacks = Object.fromEntries(Object.keys(handlers).map(name => [name, value => received.push([name, value.id])]));
  const tree = GarageVehicleCard({ vehicle: target, ...callbacks });
  const controls = buttons(tree);
  assert.equal(controls.length, 5);
  controls.forEach(control => control.props.onClick());
  assert.deepEqual(received, [['onView', target.id], ['onLogMaintenance', target.id], ['onServiceHistory', target.id], ['onEdit', target.id], ['onDelete', target.id]]);
});

test('vehicle photos render existing uploads, with placeholders for missing or malformed URLs', () => {
  const render = src => renderToStaticMarkup(React.createElement(VehicleImage, { src, name: 'Test vehicle' }));
  assert.ok(render('https://example.test/car.jpg').includes('src="https://example.test/car.jpg"'));
  assert.match(render(null), /No photo added yet/);
  assert.match(render('invalid'), /Photo unavailable/);
  assert.doesNotMatch(render('invalid'), /<img/);
});

test('toolbar exposes labeled controls, matching count and conditional recently-added option', () => {
  const props = { query: '', vehicleType: 'all', sort: 'name-asc', types: model.garageTypeOptions(fleet), canSortRecent: false, matchingCount: 2, total: 4, onQuery: noop, onType: noop, onSort: noop, onReset: noop };
  const render = extra => renderToStaticMarkup(React.createElement(GarageToolbar, { ...props, ...extra }));
  const html = render({});
  assert.match(html, /for="garage-search"/);
  assert.match(html, /for="garage-type"/);
  assert.match(html, /for="garage-sort"/);
  assert.match(html, /Showing 2 of 4 vehicles/);
  assert.match(html, /Reset Filters/);
  assert.doesNotMatch(html, /Recently added/);
  assert.match(render({ canSortRecent: true }), /Recently added/);
});

function renderGarage(vehicles, error = null) {
  const hook = () => ({
    localVehicles: vehicles, isAddModalOpen: false, setIsAddModalOpen: noop, vehicleToView: null, setVehicleToView: noop,
    vehicleToEdit: null, setVehicleToEdit: noop, vehicleToDelete: null, beginDelete: noop, closeDelete: noop,
    vehicleToLogMaintenance: null, setVehicleToLogMaintenance: noop, historyVehicle: null, historyEntries: [],
    isHistoryLoading: false, historyError: null, isDeleting: false, actionError: null, feedback: '', expenseSummary: { monthlyTotal: 0, yearlyTotal: 0 },
    upsertLocalVehicle: noop, handleDeleteVehicle: noop, openServiceHistory: noop, closeServiceHistory: noop, maintenanceSaved: noop,
  });
  const { VehiclesListClient } = load('src/components/vehicles/VehiclesListClient.tsx', {
    'next/navigation': { useRouter: () => ({ refresh: noop }) },
    '@/lib/vehicles/use-vehicle-garage': { useVehicleGarage: hook },
    '@/components/vehicles/AddVehicleModal': { AddVehicleModal: () => null },
    '@/components/maintenance/LogMaintenanceModal': { LogMaintenanceModal: () => null },
    '@/components/ui': { Dialog: () => null, LoadingState: () => null },
    '@/lib/maintenance': load('src/lib/maintenance/reminderCalculations.ts'),
  });
  return renderToStaticMarkup(React.createElement(VehiclesListClient, { vehicles, error }));
}
test('garage distinguishes an empty account from a database failure', () => {
  assert.match(renderGarage([]), /Your garage starts here/);
  const error = renderGarage([], 'Vehicle query failed');
  assert.match(error, /role="alert"/);
  assert.match(error, /Vehicle query failed/);
  assert.doesNotMatch(error, /Your garage starts here|Showing 0 of 0/);
});
test('one and multiple vehicles remain present in the rendered garage', () => {
  for (const count of [1, 3]) {
    const html = renderGarage(Array.from({ length: count }, (_, i) => vehicle('render-' + i)));
    assert.equal((html.match(/<article /g) || []).length, count);
    assert.match(html, new RegExp('Showing ' + count + ' of ' + count));
  }
});
