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

function hookHarness(relative, name, extra = {}) {
  const cells=[];let cursor=0;const effects=[];const events=[];
  const hooks={...React,
    useState(initial){const i=cursor++;if(!cells[i])cells[i]={value:typeof initial==='function'?initial():initial};return [cells[i].value,next=>{cells[i].value=typeof next==='function'?next(cells[i].value):next;}];},
    useRef(initial){const i=cursor++;if(!cells[i])cells[i]={current:initial};return cells[i];},
    useEffect(fn,deps){const i=cursor++;const old=cells[i];if(!old||!deps||deps.some((d,j)=>d!==old.deps?.[j]))effects.push(()=>{old?.cleanup?.();const cleanup=fn();cells[i]={deps,cleanup};});},
    useCallback(fn,deps){return this.useMemo(()=>fn,deps);},
    useMemo(fn,deps){const i=cursor++;const old=cells[i];if(!old||deps.some((d,j)=>d!==old.deps[j]))cells[i]={deps,value:fn()};return cells[i].value;},
    useTransition(){return [false,fn=>fn()];},
  };
  // Hook functions are invoked as imported functions, without a receiver.
  hooks.useCallback=(fn,deps)=>hooks.useMemo(()=>fn,deps);
  const router={refresh(){events.push('refresh');},push(url){events.push(url);}};
  const loaded=load(relative, {'react':hooks,'next/navigation':{useRouter:()=>router,useSearchParams:()=>new URLSearchParams()},...extra});
  return {events,render(props){cursor=0;const tree=loaded[name](props);while(effects.length)effects.shift()();return tree;},unmount(){for(const cell of cells)cell?.cleanup?.();}};
}
function nodes(tree) { if(!tree||typeof tree!=='object')return [];if(Array.isArray(tree))return tree.flatMap(nodes);return [tree,...nodes(tree.props?.children)]; }
function find(tree,predicate){const result=nodes(tree).find(predicate);assert.ok(result,'Expected element');return result;}
function textOf(tree){if(typeof tree==='string'||typeof tree==='number')return String(tree);if(!tree)return '';if(Array.isArray(tree))return tree.map(textOf).join('');return textOf(tree.props?.children);}
module.exports={load,hookHarness,nodes,find,textOf,React,renderToStaticMarkup};
