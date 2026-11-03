/* Adaptador de interfaz: el motor lógico no depende del DOM. */
(() => {
  'use strict';
  const $ = id => document.getElementById(id), L = window.Logic;
  const clone = value => JSON.parse(JSON.stringify(value));
  let state = clone(window.EXAMPLES[0]), result = null, pages = new Map();
  function el(tag, className, text) { const e = document.createElement(tag); if (className) e.className = className; if (text !== undefined) e.textContent = text; return e; }
  function button(text, action, className = 'small-button') { const b = el('button', className, text); b.type = 'button'; b.addEventListener('click', action); return b; }
  function notice(message) { $('notice').textContent = message; $('notice').hidden = !message; }
  function errorText(error) { return `${error.code || 'ERROR'} · ${error.message}${Number.isInteger(error.position) ? ` (posición ${error.position + 1})` : ''}`; }
  function domainReady() { if ($('domainInput').value.split(',').map(x => x.trim()).join('\u0000') !== state.model.domain.join('\u0000')) throw new L.LogicError('DOMINIO', 'Hay cambios pendientes en D. Pulsa Aplicar antes de continuar.'); }
  function resetResult() {
    result = null;
    $('resultBanner').className = 'result-banner'; $('resultBanner').replaceChildren(el('span','result-icon','⊨'));
    const box = el('div'); box.append(el('p','eyebrow','ESTADO DEL EVALUADOR'), el('h3', '', 'Listo para comprobar.'), el('p','','Ejecuta la fórmula para actualizar el resultado.')); $('resultBanner').append(box);
    $('runInfo').textContent = 'SIN EVALUAR'; $('view-trace').replaceChildren(el('p','empty-text','La traza aparecerá después de una evaluación válida.')); $('exploreResults').replaceChildren();
  }
  function modelStatus() {
    try { domainReady(); L.validateModel(state.model); $('modelStatus').textContent = 'Interpretación válida · funciones totales'; $('modelStatus').parentElement.classList.remove('invalid'); }
    catch (error) { $('modelStatus').textContent = error.message; $('modelStatus').parentElement.classList.add('invalid'); }
  }
  function changed(reanalyze = true) { resetResult(); notice(''); modelStatus(); if (reanalyze) analyze(); }
  function selectDomain(value, onChange, label) {
    const select = el('select'); select.setAttribute('aria-label', label);
    const empty = el('option','','Seleccionar…'); empty.value = ''; select.append(empty);
    for (const a of state.model.domain) { const option = el('option','',a); option.value = a; select.append(option); }
    select.value = value ?? ''; select.addEventListener('change', () => onChange(select.value)); return select;
  }
  function renderModel() {
    $('domainInput').value = state.model.domain.join(', ');
    $('domainChips').replaceChildren(...state.model.domain.map(a => el('span','chip',a)));
    $('symbolCount').textContent = `${state.model.symbols.length} símbolos`;
    $('symbolList').replaceChildren(...state.model.symbols.map((s, i) => symbolCard(s, i)));
    modelStatus();
  }
  function symbolCard(s, index) {
    const card = el('details','symbol-card'), summary = el('summary');
    summary.append(el('strong','',s.name), el('span','',`${s.kind === 'predicate' ? 'Predicado' : s.arity === 0 ? 'Constante' : 'Función'} / aridad ${s.arity}`)); card.append(summary);
    const body = el('div','symbol-editor');
    body.append(el('p','hint',s.kind === 'predicate' ? 'Marca las tuplas que pertenecen a la relación. Al menos una debe estar marcada.' : 'Selecciona exactamente una salida de D por entrada. Todas son obligatorias.'));
    const tools = el('div','symbol-tools');
    const count = el('span','hint');
    function updateCount() { count.textContent = s.kind === 'predicate' ? `${s.tuples.length} tuplas incluidas` : `${s.entries.filter(x => state.model.domain.includes(x.value)).length} salidas asignadas`; }
    updateCount(); tools.append(count, button('Eliminar símbolo', () => { state.model.symbols.splice(index, 1); pages.delete(s.name); renderModel(); changed(); }, 'danger'));
    body.append(tools);
    let combinations;
    try { combinations = L.product(state.model.domain, s.arity); }
    catch (error) { body.append(el('p','inline-error',error.message)); card.append(body); return card; }
    const tableWrap = el('div','tuples-wrap');
    const footer = el('div','pager');
    function drawTable() {
      const pageCount = Math.max(1, Math.ceil(combinations.length / 32)), page = Math.min(pages.get(s.name) || 0, pageCount - 1);
      pages.set(s.name, page);
      const table = el('table'); const head = el('thead'), tr = el('tr');
      tr.append(el('th','','Entrada en D' + (s.arity === 0 ? '⁰' : `^${s.arity}`)), el('th','', s.kind === 'predicate' ? 'Pertenece' : 'Salida en D')); head.append(tr); table.append(head);
      const tbody = el('tbody');
      for (const args of combinations.slice(page * 32, page * 32 + 32)) {
        const row = el('tr'), label = `${s.name}(${args.join(', ')})`; row.append(el('td','',args.length ? `(${args.join(', ')})` : '()'));
        const cell = el('td');
        if (s.kind === 'predicate') {
          const checkbox = el('input'); checkbox.type = 'checkbox'; checkbox.checked = s.tuples.some(t => L.key(t) === L.key(args)); checkbox.setAttribute('aria-label', `${label} pertenece a la relación`);
          checkbox.addEventListener('change', () => { s.tuples = s.tuples.filter(t => L.key(t) !== L.key(args)); if (checkbox.checked) s.tuples.push([...args]); updateCount(); changed(); }); cell.append(checkbox);
        } else {
          const entry = s.entries.find(x => L.key(x.args) === L.key(args));
          cell.append(selectDomain(entry?.value, value => { s.entries = s.entries.filter(x => L.key(x.args) !== L.key(args)); if (value) s.entries.push({ args: [...args], value }); updateCount(); changed(); }, `Salida de ${label}`));
        }
        row.append(cell); tbody.append(row);
      }
      table.append(tbody); tableWrap.replaceChildren(table);
      const prev = button('←', () => { pages.set(s.name, page - 1); drawTable(); }), next = button('→', () => { pages.set(s.name, page + 1); drawTable(); });
      prev.disabled = page === 0; next.disabled = page + 1 === pageCount; prev.setAttribute('aria-label', `Página anterior de ${s.name}`); next.setAttribute('aria-label', `Página siguiente de ${s.name}`);
      footer.replaceChildren(prev, el('span','',`${page + 1} / ${pageCount} · ${combinations.length} entradas`), next); footer.hidden = pageCount <= 1;
    }
    drawTable(); body.append(tableWrap, footer); card.append(body); return card;
  }
  function astNode(n) {
    const names = { forall: '∀ / universal', exists: '∃ / existencial', and: '∧ / conjunción', or: '∨ / disyunción', not: '¬ / negación', implies: '→ / implicación', iff: '↔ / equivalencia', equal: '= / igualdad', unequal: '≠ / desigualdad', predicate: 'predicado', call: 'función / constante', var: 'variable' };
    const node = el('div','ast-node'); node.append(el('span','',`${names[n.type]}${n.name ? ` · ${n.name}` : ''}${n.variable ? ` · ${n.variable}` : ''}`));
    for (const child of [n.child, n.left, n.right, ...(n.args || [])]) if (child) node.append(astNode(child)); return node;
  }
  function analyze() {
    state.formula = $('formulaInput').value;
    try {
      const ast = L.parse(state.formula, state.model.symbols), free = L.freeVariables(ast);
      $('analysisError').hidden = true;
      $('formulaKind').textContent = free.length ? 'FÓRMULA ABIERTA' : 'ENUNCIADO CERRADO'; $('freeCount').textContent = `${free.length} variables libres`;
      // Solo el entorno de las variables libres es necesario para decidir la fórmula.
      state.environment = Object.fromEntries(free.filter(v => Object.hasOwn(state.environment, v)).map(v => [v, state.environment[v]]));
      const fields = free.map(v => {
        const label = el('label','',`${v} ↦`);
        label.append(selectDomain(state.environment[v], value => { if (value) state.environment = { ...state.environment, [v]: value }; else delete state.environment[v]; changed(false); }, `Valor de la variable libre ${v}`)); return label;
      });
      $('environmentFields').replaceChildren(...(fields.length ? fields : [el('p','','Sin variables libres. La elección del entorno es irrelevante.')]));
      const note = el('p','hint ast-note','Lectura sin ambigüedad: '); note.append(el('code','',L.format(ast)));
      $('view-ast').replaceChildren(note, astNode(ast));
      return ast;
    } catch (error) {
      $('analysisError').textContent = errorText(error); $('analysisError').hidden = false; $('formulaKind').textContent = 'REVISAR SINTAXIS'; $('freeCount').textContent = '—';
      $('environmentFields').replaceChildren(el('p','','Corrige la fórmula para identificar las variables libres.')); $('view-ast').replaceChildren(el('p','empty-text','No se puede construir el árbol hasta corregir la entrada.')); return null;
    }
  }
  function traceNode(trace, depth = 0) {
    const node = el('details','trace-node'); node.open = depth < 2; const summary = el('summary');
    if (trace.assignment) summary.append(el('span','assignment',trace.assignment));
    summary.append(el('code','',trace.formula), el('span',`truth-badge${trace.value ? '' : ' false'}`,trace.value ? 'V' : 'F')); node.append(summary);
    node.append(el('p','trace-reason',trace.reason));
    if (trace.terms.length) node.append(el('p','terms',[...new Set(trace.terms)].join('  ·  ')));
    if (trace.total !== undefined) node.append(el('p','trace-meta',`${trace.checked} / ${trace.total} elementos comprobados${trace.complete ? ' · recorrido completo' : ' · resultado decidido; no se necesitan más casos'}`));
    if (trace.children.length) {
      // Descendientes diferidos: el usuario puede abrir toda la prueba sin bloquear la interfaz.
      const children = el('div','trace-children'); let built = false;
      const build = () => { if (!built && node.open) { built = true; children.replaceChildren(...trace.children.map(child => traceNode(child, depth + 1))); } };
      node.addEventListener('toggle', build); node.append(children); build();
    }
    return node;
  }
  function banner(kind, title, message, symbol) {
    $('resultBanner').className = `result-banner ${kind}`; const text = el('div');
    text.append(el('p','eyebrow',kind === 'error' ? 'ENTRADA RECHAZADA / SIN VALOR DE VERDAD' : 'RESULTADO EN LA INTERPRETACIÓN ACTUAL'), el('h3','',title), el('p','',message));
    $('resultBanner').replaceChildren(el('span','result-icon',symbol), text);
  }
  function run() {
    resetResult(); notice(''); state.formula = $('formulaInput').value;
    try {
      domainReady(); const start = performance.now(); result = L.evaluate(state.formula, state.model, state.environment);
      const duration = performance.now() - start;
      banner(result.value ? 'true' : 'false', result.value ? 'Verdadero' : 'Falso', result.trace.reason, result.value ? '✓' : '×');
      $('runInfo').textContent = `${result.steps} PASOS · ${duration.toFixed(1)} ms`;
      $('view-trace').replaceChildren(traceNode(result.trace));
    } catch (error) {
      banner('error','Revisa la entrada',errorText(error),'!'); $('runInfo').textContent = 'EVALUACIÓN DETENIDA';
      $('view-trace').replaceChildren(el('p','empty-text','No se produjo un resultado semántico. Corrige el error e intenta de nuevo.'));
      if (Number.isInteger(error.position)) { $('formulaInput').focus(); $('formulaInput').setSelectionRange(error.position, error.position + 1); }
    }
    modelStatus();
  }
  function selectTab(name) {
    for (const tab of document.querySelectorAll('[data-tab]')) { const active = tab.dataset.tab === name; tab.setAttribute('aria-selected', String(active)); tab.tabIndex = active ? 0 : -1; $(`view-${tab.dataset.tab}`).hidden = !active; }
  }
  function loadExample(index) {
    state = clone(window.EXAMPLES[index]); pages.clear(); $('formulaInput').value = state.formula; $('exampleDescription').textContent = state.description; renderModel(); changed(); run();
  }
  $('exampleSelect').append(...window.EXAMPLES.map((example, i) => { const option = el('option','',example.title); option.value = i; return option; }));
  $('exampleSelect').addEventListener('change', event => loadExample(Number(event.target.value)));
  $('applyDomain').addEventListener('click', () => {
    try {
      const domain = $('domainInput').value.split(',').map(x => x.trim());
      L.validateModel({ domain, symbols: [] });
      for (const s of state.model.symbols) L.product(domain, s.arity);
      state.model.domain = domain;
      for (const s of state.model.symbols) {
        if (s.kind === 'predicate') s.tuples = s.tuples.filter(t => t.every(a => domain.includes(a)));
        else s.entries = s.entries.filter(e => e.args.every(a => domain.includes(a)) && domain.includes(e.value));
      }
      state.environment = Object.fromEntries(Object.entries(state.environment).filter(([, a]) => domain.includes(a)));
      pages.clear(); renderModel(); changed(); notice('Dominio actualizado. Revisa las tablas: las funciones deben cubrir todas las nuevas entradas y las relaciones deben conservar al menos una tupla.');
    } catch (error) { resetResult(); notice(errorText(error)); modelStatus(); }
  });
  $('domainInput').addEventListener('input', () => changed(false));
  $('symbolForm').addEventListener('submit', event => {
    event.preventDefault();
    try {
      domainReady(); const name = $('symbolName').value.trim(), kind = $('symbolKind').value, arity = Number($('symbolArity').value);
      const s = { name, kind, arity, ...(kind === 'predicate' ? { tuples: [] } : { entries: [] }) };
      L.language([...state.model.symbols, s]); L.product(state.model.domain, arity); state.model.symbols.push(s);
      $('symbolName').value = ''; renderModel(); changed(); $('symbolList').lastElementChild.open = true;
    } catch (error) { notice(errorText(error)); }
  });
  const operators = [['¬','Negación'],['∧','Conjunción'],['∨','Disyunción'],['→','Implicación'],['↔','Equivalencia'],['∀','Universal'],['∃','Existencial'],['(','Abrir paréntesis'],[')','Cerrar paréntesis'],['=','Igualdad'],['≠','Desigualdad']];
  for (const [symbol, title] of operators) {
    const b = button(symbol, () => {
      const input = $('formulaInput'); const start = input.selectionStart, end = input.selectionEnd; input.setRangeText(symbol, start, end, 'end'); input.focus(); changed();
    }, 'operator'); b.title = title; b.setAttribute('aria-label',`Insertar ${title.toLowerCase()}`);
    b.addEventListener('mousedown', event => event.preventDefault()); $('operatorBar').append(b);
  }
  $('formulaInput').addEventListener('input', () => { $('exampleDescription').textContent = 'Caso personalizado · edita, evalúa y compara.'; changed(); });
  $('formulaInput').addEventListener('keydown', event => { if (event.key === 'Enter' && (event.ctrlKey || event.metaKey)) { event.preventDefault(); run(); } });
  $('evaluateButton').addEventListener('click', run);
  for (const tab of document.querySelectorAll('[data-tab]')) {
    tab.addEventListener('click', () => selectTab(tab.dataset.tab));
    tab.addEventListener('keydown', event => {
      const tabs = [...document.querySelectorAll('[data-tab]')], i = tabs.indexOf(tab);
      if (['ArrowRight','ArrowLeft','Home','End'].includes(event.key)) { event.preventDefault(); const index = event.key === 'Home' ? 0 : event.key === 'End' ? tabs.length - 1 : (i + (event.key === 'ArrowRight' ? 1 : -1) + tabs.length) % tabs.length; selectTab(tabs[index].dataset.tab); tabs[index].focus(); }
    });
  }
  $('exploreButton').addEventListener('click', () => {
    try {
      domainReady(); const exploration = L.explore($('formulaInput').value, state.model);
      const summary = el('p','hint explore-summary',`${exploration.trueCount} de ${exploration.rows.length} entornos hacen verdadera la fórmula en esta interpretación. Esto no determina su validez lógica global.`);
      const table = el('table','explore-table'), head = el('thead'), tr = el('tr');
      for (const v of exploration.free) tr.append(el('th','',v)); tr.append(el('th','','Valor'),el('th','','Detalle')); head.append(tr); table.append(head);
      const body = el('tbody');
      for (const r of exploration.rows) {
        const row = el('tr'); for (const v of exploration.free) row.append(el('td','',r.environment[v])); row.append(el('td','',r.value ? 'Verdadero' : 'Falso'));
        const action = el('td'); action.append(button('Ver traza', () => { state.environment = { ...r.environment }; analyze(); run(); selectTab('trace'); })); row.append(action); body.append(row);
      }
      table.append(body); $('exploreResults').replaceChildren(summary,table);
    } catch (error) { $('exploreResults').replaceChildren(el('p','inline-error',errorText(error))); }
  });
  $('helpButton').addEventListener('click', () => $('helpDialog').showModal()); $('closeHelp').addEventListener('click', () => $('helpDialog').close());
  $('exportButton').addEventListener('click', () => {
    try {
      domainReady(); L.evaluate($('formulaInput').value, state.model, state.environment);
      const data = { version: 1, model: state.model, formula: $('formulaInput').value, environment: state.environment };
      const blob = new Blob([JSON.stringify(data,null,2)], { type: 'application/json' }), url = URL.createObjectURL(blob), a = el('a'); a.href = url; a.download = 'semantic-lab-caso.json'; document.body.append(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(url), 1000); notice('Caso válido exportado. El archivo contiene el lenguaje, la interpretación, la fórmula y el entorno.');
    } catch (error) { notice(`Completa un caso válido antes de exportarlo. ${errorText(error)}`); }
  });
  $('importButton').addEventListener('click', () => $('importFile').click());
  $('importFile').addEventListener('change', async () => {
    const file = $('importFile').files[0]; if (!file) return;
    try {
      if (file.size > 2000000) throw new Error('El archivo supera 2 MB.');
      const data = JSON.parse(await file.text());
      if (!data || data.version !== 1) throw new Error('Formato no compatible; se requiere version: 1.');
      L.evaluate(data.formula, data.model, data.environment);
      state = { model: data.model, formula: data.formula, environment: data.environment }; pages.clear(); $('formulaInput').value = state.formula; $('exampleDescription').textContent = `Caso importado · ${file.name}`; $('exampleSelect').selectedIndex = -1;
      renderModel(); changed(); run(); notice('Caso importado y validado correctamente.');
    } catch (error) { notice(`No se importó el archivo. Se conservó el caso actual. ${errorText(error)}`); }
    $('importFile').value = '';
  });
  loadExample(0);
})();
