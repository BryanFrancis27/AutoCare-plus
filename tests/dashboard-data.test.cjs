const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const Module = require('node:module');
const ts = require('typescript');

const { load } = require('./vehicle-test-helpers.cjs');
const loaded = { exports: load('src/services/dashboardService.ts') };
const { loadDashboard, loadServiceExpenses, monthWindow, relevantReminders, withDeadline, DashboardSessionError } = load('src/services/dashboardService.ts');
const now = new Date(2026, 9, 29, 12);
const signal = () => new AbortController().signal;
const vehicle = (id = 'car-1') => ({ id, make: 'Test', model: 'Vehicle', year: 2024, plate_number: 'TEST', current_mileage: 12000, created_at: '2026-10-01T12:00:00Z' });
const log = (id, cost, date = '2026-10-02', vehicle_id = 'car-1') => ({ id, cost, service_date: date, vehicle_id, service_type: 'Oil change', vehicles: vehicle(vehicle_id) });
const reminder = (id, date, extra = {}) => ({ id, title: 'Oil change', reminder_type: 'Oil change', due_date: date, due_mileage: null, status: 'upcoming', priority: 'medium', vehicle_id: 'car-1', vehicles: vehicle(), is_completed: false, ...extra });

function fakeClient(tables = {}, options = {}) {
  const calls = [];
  class Query {
    constructor(table) { this.table = table; this.filters = []; this.orders = []; this.fields = ''; calls.push(this); }
    select(fields, config) { this.fields = fields; this.counted = config?.count === 'exact'; return this; }
    eq(field, value) { this.filters.push(['eq', field, value]); return this; }
    gte(field, value) { this.filters.push(['gte', field, value]); return this; }
    lt(field, value) { this.filters.push(['lt', field, value]); return this; }
    order(field, config) { this.orders.push([field, config?.ascending !== false]); return this; }
    limit(size) { this.limitSize = size; return this; }
    range(from, to) { this.rangeBounds = [from, to]; return this; }
    abortSignal(signal) { this.signal = signal; return this; }
    then(resolve, reject) {
      return Promise.resolve().then(() => {
        this.signal?.throwIfAborted();
        const key = this.table === 'maintenance_logs' && this.fields === 'id, cost' ? 'expenses' : this.table;
        if (options.fail === key) return { data: null, count: null, error: { message: 'query failed' } };
        let rows = [...(tables[this.table] || [])].filter(row => this.filters.every(([op, field, value]) => op === 'eq' ? row[field] === value : op === 'gte' ? row[field] >= value : row[field] < value));
        const count = rows.length;
        rows.sort((a, b) => { for (const [field, ascending] of this.orders) { const result = String(a[field]).localeCompare(String(b[field])); if (result) return ascending ? result : -result; } return 0; });
        if (this.rangeBounds) rows = rows.slice(this.rangeBounds[0], this.rangeBounds[1] + 1);
        else rows = rows.slice(0, this.limitSize || 1000);
        return { data: rows, count: options.nullCount ? null : count, error: null };
      }).then(resolve, reject);
    }
  }
  const client = {
    auth: { getUser: async () => ({ data: { user: options.noUser ? null : { id: 'owner', email: 'owner@example.test', user_metadata: { full_name: 'Test Owner' } } }, error: options.authError || null }) },
    from: table => new Query(table),
  };
  // Fixture rows deliberately contain a foreign owner to verify every query is scoped.
  for (const rows of Object.values(tables)) for (const row of rows) row.user_id ??= 'owner';
  return { client, calls };
}

test('successful zero-vehicle result is distinct from an error', async () => {
  const { client } = fakeClient();
  const data = await loadDashboard(client, signal(), now);
  assert.equal(data.totalVehicles, 0);
  assert.equal(data.name, 'Test Owner');
  assert.deepEqual(data.vehicles, []);
  assert.deepEqual(data.reminders, []);
  assert.equal(data.monthlyExpenses, 0);
});

test('returning account uses owned records and maintenance costs, excluding other months/owners', async () => {
  const { client, calls } = fakeClient({ vehicles: [vehicle(), { ...vehicle('foreign'), user_id: 'other' }], maintenance_logs: [log('a', '1200.50'), log('b', 49.5), log('old', 9000, '2026-09-30'), log('future', 8000, '2026-11-01'), { ...log('foreign', 7000), user_id: 'other' }], reminders: [reminder('open', '2026-11-01'), reminder('done', '2026-10-01', { is_completed: true })] });
  const data = await loadDashboard(client, signal(), now);
  assert.equal(data.totalVehicles, 1);
  assert.equal(data.maintenanceRecords, 4);
  assert.equal(data.monthlyExpenses, 1250);
  assert.equal(data.activeReminders, 1);
  assert.equal(data.reminders[0].id, 'open');
  assert.ok(data.activities.some(row => row.description === 'Oil change recorded'));
  assert.ok(calls.every(query => query.filters.some(([op, field, value]) => op === 'eq' && field === 'user_id' && value === 'owner')));
  assert.ok(calls.every(query => query.signal));
});

test('multiple vehicles are counted completely while previews and activities are bounded', async () => {
  const { client } = fakeClient({ vehicles: Array.from({ length: 12 }, (_, i) => ({ ...vehicle(`car-${i}`), created_at: `2026-10-${String(i + 1).padStart(2, '0')}T00:00:00Z` })) });
  const data = await loadDashboard(client, signal(), now);
  assert.equal(data.totalVehicles, 12);
  assert.equal(data.vehicles.length, 5);
  assert.equal(data.vehicles[0].id, 'car-11');
  assert.equal(data.activities.length, 5);
});

test('cost and active reminder pagination include records beyond the default 1000-row cap', async () => {
  const { client, calls } = fakeClient({ vehicles: [vehicle()], maintenance_logs: Array.from({ length: 1205 }, (_, i) => log(String(i).padStart(4, '0'), '0.10')), reminders: Array.from({ length: 1205 }, (_, i) => reminder(String(i).padStart(4, '0'), i === 1204 ? '2026-01-01' : '2026-11-01')) });
  const data = await loadDashboard(client, signal(), now);
  assert.equal(data.monthlyExpenses, 120.5);
  assert.equal(data.maintenanceRecords, 1205);
  assert.equal(data.activeReminders, 1205);
  assert.equal(data.reminders[0].id, '1204');
  assert.ok(calls.some(query => query.rangeBounds?.[0] === 1000));
});

for (const table of ['vehicles', 'maintenance_logs', 'expenses', 'reminders']) {
  test(`failed ${table} query rejects rather than producing successful zero metrics`, async () => {
    const { client } = fakeClient({ vehicles: [vehicle()] }, { fail: table });
    await assert.rejects(loadDashboard(client, signal(), now), /Could not load/);
  });
}

test('missing exact counts are errors', async () => {
  const { client } = fakeClient({}, { nullCount: true });
  await assert.rejects(loadDashboard(client, signal(), now), /Could not count/);
});

test('invalid session prevents all database queries', async () => {
  for (const options of [{ noUser: true }, { authError: new Error('expired') }]) {
    const { client, calls } = fakeClient({}, options);
    await assert.rejects(loadDashboard(client, signal(), now), DashboardSessionError);
    assert.equal(calls.length, 0);
  }
});

test('local month boundaries include year rollover without UTC shifting', () => {
  assert.deepEqual(monthWindow(new Date(2026, 9, 1, 0)), { start: '2026-10-01', end: '2026-11-01' });
  assert.deepEqual(monthWindow(new Date(2026, 11, 31, 23)), { start: '2026-12-01', end: '2027-01-01' });
});

test('reminders prioritize overdue, retain today and mileage-only due details, and omit distant dates', () => {
  const rows = relevantReminders([reminder('later', '2026-12-30'), reminder('today', '2026-10-29'), reminder('overdue', '2026-10-28'), reminder('mileage', null, { due_mileage: 15000 }), reminder('status-overdue', '2026-12-01', { status: 'overdue' })], now);
  assert.equal(rows[0].id, 'overdue');
  assert.equal(rows[1].id, 'status-overdue');
  assert.equal(rows.find(row => row.id === 'today').overdue, false);
  assert.equal(rows.find(row => row.id === 'mileage').dueMileage, 15000);
  assert.equal(rows.some(row => row.id === 'later'), false);
  assert.deepEqual(relevantReminders([], now), []);
});

test('service expenses aggregate every page and maintain per-vehicle selection data', async () => {
  const { client } = fakeClient({ vehicles: [vehicle(), vehicle('car-2')], maintenance_logs: [...Array.from({ length: 1002 }, (_, i) => log(String(i), 1)), log('second', 20, '2026-10-15', 'car-2')] });
  const summaries = await loadServiceExpenses(client, signal());
  assert.equal(summaries.find(row => row.id === 'car-1').totalCost, 1002);
  assert.equal(summaries.find(row => row.id === 'car-1').totalRecords, 1002);
  assert.equal(summaries.find(row => row.id === 'car-1').recentServices.length, 5);
  assert.equal(summaries.find(row => row.id === 'car-2').lastService, '2026-10-15');
});

test('service expenses query failure rejects instead of showing an empty garage', async () => {
  const { client } = fakeClient({}, { fail: 'vehicles' });
  await assert.rejects(loadServiceExpenses(client, signal()), /Could not load/);
});

test('hung requests time out and signal cancellation; unmount cancellation also settles', async () => {
  let workSignal;
  await assert.rejects(withDeadline(signal => { workSignal = signal; return new Promise(() => {}); }, signal(), 10), /Loading took too long/);
  assert.equal(workSignal.aborted, true);
  const controller = new AbortController();
  const pending = withDeadline(() => new Promise(() => {}), controller.signal);
  controller.abort(new Error('unmounted'));
  await assert.rejects(pending, /unmounted/);
});

// Server rendering verifies real markup and route contracts, not browser interactions.
const React = require('react');
const { renderToStaticMarkup } = require('react-dom/server');
function dashboardComponent(name) {
  return load('src/components/dashboard/' + name + '.tsx')[name];
}

function renderComponent(name, props) {
  return renderToStaticMarkup(React.createElement(dashboardComponent(name), props));
}

test('onboarding renders the native first-vehicle action and future guidance without completed claims or metrics', () => {
  const html = renderComponent('DashboardOnboarding', { onAdd() {} });
  assert.match(html, /<button[^>]*type="button"[^>]*>.*Add Your First Vehicle/);
  assert.match(html, /Step 1/);
  assert.match(html, /Step 2/);
  assert.match(html, /Step 3/);
  assert.match(html, /Add a vehicle first to log maintenance or set a reminder/);
  assert.doesNotMatch(html, /Completed|Monthly expenses|Maintenance records/);
});

test('garage markup uses existing detail routes, escapes user text, and bounds the visible preview', () => {
  const vehicles = Array.from({ length: 8 }, (_, i) => ({ ...vehicle(`car-${i}`), model: i === 0 ? '<script>unsafe</script>' : 'Vehicle' }));
  const html = renderComponent('GarageOverview', { vehicles, total: 8 });
  assert.match(html, /href="\/vehicles\/car-0"/);
  assert.match(html, /href="\/vehicles"/);
  assert.match(html, /Showing 3 of 8/);
  assert.match(html, /&lt;script&gt;unsafe&lt;\/script&gt;/);
  assert.doesNotMatch(html, /href="\/vehicles\/car-3"|<script>unsafe/);
});

test('reminder markup communicates overdue status and mileage in text and links to the workflow', () => {
  const reminders = relevantReminders([reminder('old', '2026-10-01', { due_mileage: 15000 }), reminder('no-date', null)], now);
  const html = renderComponent('UpcomingReminders', { reminders });
  assert.match(html, /Overdue/);
  assert.match(html, /15,000 km/);
  assert.match(html, /No due date set/);
  assert.match(html, /href="\/reminders"/);
  const empty = renderComponent('UpcomingReminders', { reminders: [] });
  assert.match(empty, /No reminders in this preview/);
  assert.doesNotMatch(empty, /health score|100%|perfect condition/i);
});

test('activity markup identifies actual services and preserves the vehicle route', () => {
  const html = renderComponent('ActivityFeed', { activities: [{ id: 'service-1', description: 'Brake inspection recorded', date: '2026-10-20', vehicleName: 'Test Vehicle', vehicleId: 'car-1', type: 'maintenance' }] });
  assert.match(html, /Brake inspection recorded/);
  assert.match(html, /href="\/vehicles\/car-1"/);
  assert.match(html, /<time dateTime="2026-10-20"/);
  assert.match(renderComponent('ActivityFeed', { activities: [] }), /No recent activity yet/);
});

test('quick actions use native buttons for modals and a route link for reminders', () => {
  const Icon = () => null;
  const button = renderComponent('QuickActionButton', { label: 'Log Maintenance', description: 'Record a service', icon: Icon, onClick() {} });
  assert.match(button, /<button type="button"/);
  assert.doesNotMatch(button, /href=/);
  const link = renderComponent('QuickActionButton', { label: 'Set Reminder', description: 'Plan service', icon: Icon, href: '/reminders' });
  assert.match(link, /href="\/reminders"/);
});

test('activity ordering compares vehicle timestamps and local service dates consistently', () => {
  const rows = loaded.exports.buildActivities([{ ...vehicle(), created_at: new Date(2026, 9, 29, 12).toISOString() }], [log('same-day', 0, '2026-10-29')]);
  assert.equal(rows[0].type, 'vehicle_added');
  assert.equal(rows[1].type, 'maintenance');
});


test('dashboard photos preserve canonical and legacy uploaded image references', async () => {
  for (const fields of [
    { image_url: 'https://example.test/vehicle.jpg', photo_url: 'https://example.test/older.jpg' },
    { photo_url: 'https://example.test/vehicle.jpg' },
    { image: 'https://example.test/vehicle.jpg' },
    {},
  ]) {
    const { client } = fakeClient({ vehicles: [{ ...vehicle(), ...fields }] });
    const data = await loadDashboard(client, signal(), now);
    assert.equal(data.vehicles[0].image_url, Object.keys(fields).length ? 'https://example.test/vehicle.jpg' : null);
  }
});

test('one-vehicle preview displays its uploaded photo and retains identification and detail link', () => {
  const html = renderComponent('GarageOverview', { vehicles: [{ ...vehicle(), image_url: 'https://example.test/vehicle.jpg' }], total: 1 });
  assert.ok(html.includes('src="https://example.test/vehicle.jpg"'));
  assert.ok(html.includes('href="/vehicles/car-1"'));
  assert.match(html, /2024 Test Vehicle/);
  assert.match(html, /TEST/);
  assert.match(html, /12,000 km recorded/);
  assert.doesNotMatch(html, /No photo added/);
});

test('missing photos retain readable vehicle identification without a broken image element', () => {
  for (const count of [1, 2, 3]) {
    const html = renderComponent('GarageOverview', { vehicles: Array.from({ length: count }, (_, index) => vehicle('preview-' + index)), total: count });
    assert.equal(html.split('href="/vehicles/preview-').length - 1, count);
    assert.doesNotMatch(html, /<img/);
    assert.match(html, /TEST/);
    if (count === 1) assert.match(html, /No photo added/);
  }
});

function renderDashboard(state) {
  const file = path.resolve(__dirname, '../src/app/(protected)/dashboard/page.tsx');
  const code = ts.transpileModule(fs.readFileSync(file, 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020, jsx: ts.JsxEmit.ReactJSX, esModuleInterop: true },
  }).outputText;
  const pageModule = new Module(file, module);
  pageModule.filename = file;
  pageModule.paths = module.paths;
  const originalRequire = pageModule.require.bind(pageModule);
  pageModule.require = request => {
    if (request === '@/lib/dashboard/use-dashboard') return { useDashboard: () => ({ state, refresh() {} }) };
    if (request === '@/lib/currency') return { formatCurrencyPHP: value => 'PHP ' + value };
    if (request === '@/components/dashboard') return Object.fromEntries(['MetricCard', 'ActivityFeed', 'UpcomingReminders', 'QuickActionButton', 'ServiceExpensesModal'].map(name => [name, name === 'ServiceExpensesModal' ? () => null : dashboardComponent(name)]));
    if (request.endsWith('/DashboardOnboarding')) return { DashboardOnboarding: dashboardComponent('DashboardOnboarding') };
    if (request.endsWith('/GarageOverview')) return { GarageOverview: dashboardComponent('GarageOverview') };
    if (request.endsWith('/LogMaintenanceModal')) return { LogMaintenanceModal: () => null };
    if (request.endsWith('/AddVehicleModal')) return { AddVehicleModal: () => null };
    if (request === '@/components/ui') return { LoadingState: () => React.createElement('p', { role: 'status' }, 'Loading') };
    return originalRequire(request);
  };
  pageModule._compile(code, file);
  return renderToStaticMarkup(React.createElement(pageModule.exports.default));
}

test('first-service guidance uses one existing action only for a verified populated garage with no history', () => {
  const data = { name: 'Test Owner', vehicles: [vehicle()], totalVehicles: 1, maintenanceRecords: 0, activeReminders: 0, monthlyExpenses: 0, monthLabel: 'October 2026', activities: [], reminders: [] };
  const firstService = renderDashboard({ status: 'ready', data });
  assert.match(firstService, /Log your first service to start building its maintenance history/);
  assert.equal((firstService.match(/Log Your First Service/g) || []).length, 1);
  assert.doesNotMatch(firstService, />Log Maintenance</);
  const history = renderDashboard({ status: 'ready', data: { ...data, maintenanceRecords: 1 } });
  assert.match(history, />Log Maintenance</);
  assert.doesNotMatch(history, /Log Your First Service|Log your first service to start/);
  for (const state of [
    { status: 'loading' },
    { status: 'error', message: 'Query failed', sessionExpired: false },
    { status: 'ready', data: { ...data, totalVehicles: 0, vehicles: [] } },
  ]) {
    assert.doesNotMatch(renderDashboard(state), /Log Your First Service|Log your first service to start/);
  }
});
