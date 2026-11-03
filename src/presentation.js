/* Proyecciones visuales del modelo y del AST; no modifican la semántica. */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory(require('./logic.js'));
  else root.Presentation = factory(root.Logic);
})(typeof globalThis !== 'undefined' ? globalThis : this, function (Logic) {
  'use strict';
  const set = values => `{ ${values.join(', ')} }`;
  // Citar etiquetas con puntuación evita confundirlas con delimitadores de tuplas.
  const atom = value => /^[\p{L}\p{N}_]+$/u.test(value) ? value : JSON.stringify(value);
  const tuple = values => `(${values.map(atom).join(', ')})`;
  function notation(model) {
    const constants = model.symbols.filter(s => s.kind === 'function' && s.arity === 0);
    const functions = model.symbols.filter(s => s.kind === 'function' && s.arity > 0);
    const predicates = model.symbols.filter(s => s.kind === 'predicate');
    const signature = group => set(group.map(s => `${s.name}/${s.arity}`));
    const rows = [
      { title: 'Dominio', expression: `D = ${set(model.domain.map(atom))}` },
      { title: 'Lenguaje', expression: `C = ${set(constants.map(s => s.name))}\nF = ${signature(functions)}\nP = ${signature(predicates)}`, note: 'nombre/aridad identifica cada símbolo; C contiene las constantes.' }
    ];
    for (const s of model.symbols) {
      if (s.kind === 'predicate') {
        rows.push({ title: `Predicado ${s.name} · aridad ${s.arity}`, expression: `${s.name}ℐ = ${set(s.tuples.map(t => s.arity === 1 ? atom(t[0]) : tuple(t)))}`, note: `${s.name}ℐ ⊆ D^${s.arity}${s.tuples.length ? '' : ' · Relación vacía: debes incluir al menos una tupla.'}` });
      } else if (s.arity === 0) {
        const value = s.entries.find(e => e.args.length === 0)?.value;
        rows.push({ title: `Constante ${s.name}`, expression: `${s.name}ℐ = ${value === undefined ? 'sin asignar' : atom(value)}`, note: `${s.name}ℐ ∈ D` });
      } else {
        const graph = s.entries.map(e => `(${s.arity === 1 ? atom(e.args[0]) : tuple(e.args)}, ${atom(e.value)})`);
        rows.push({ title: `Función ${s.name} · aridad ${s.arity}`, expression: `${s.name}ℐ = ${set(graph)}`, note: `${s.name}ℐ : D^${s.arity} → D · ${s.entries.length} de ${model.domain.length ** s.arity} entradas asignadas. Cada par representa (entrada, salida).` });
      }
    }
    return rows;
  }
  const names = { forall: '∀ · Universal', exists: '∃ · Existencial', and: '∧ · Conjunción', or: '∨ · Disyunción', not: '¬ · Negación', implies: '→ · Implicación', iff: '↔ · Equivalencia', equal: '= · Igualdad', unequal: '≠ · Desigualdad', predicate: 'Predicado', call: 'Función / constante', var: 'Variable' };
  function wrap(text, length) {
    const chars = Array.from(text), lines = [];
    for (let i = 0; i < chars.length; i += length) lines.push(chars.slice(i, i + length).join(''));
    return lines.length ? lines : [''];
  }
  function layoutTree(ast) {
    const gap = 28, padding = 28, levelGap = 64, levelHeights = [], nodes = [], edges = [];
    // Cada subárbol reserva su propio intervalo horizontal. Los hermanos nunca se solapan.
    function measure(n, depth) {
      const formula = Logic.format(n), lines = wrap(formula, depth === 0 ? 36 : 27);
      const node = { id: nodes.length, type: n.type, depth, formula, label: names[n.type], lines, width: depth === 0 ? 320 : 240, height: 48 + lines.length * 19, children: [] };
      nodes.push(node); levelHeights[depth] = Math.max(levelHeights[depth] || 0, node.height);
      node.children = [n.child, n.left, n.right, ...(n.args || [])].filter(Boolean).map(c => measure(c, depth + 1));
      const childrenWidth = node.children.reduce((sum,c) => sum + c.span, 0) + Math.max(0, node.children.length - 1) * gap;
      node.span = Math.max(node.width, childrenWidth); return node;
    }
    const root = measure(ast, 0), tops = [padding];
    for (let i = 1; i < levelHeights.length; i++) tops[i] = tops[i-1] + levelHeights[i-1] + levelGap;
    function place(node, left) {
      node.x = left + node.span / 2; node.y = tops[node.depth];
      const total = node.children.reduce((sum,c) => sum + c.span, 0) + Math.max(0, node.children.length - 1) * gap;
      let childLeft = node.x - total / 2;
      for (const child of node.children) {
        place(child, childLeft); childLeft += child.span + gap;
        edges.push({ parent: node.id, child: child.id, x1: node.x, y1: node.y + node.height, x2: child.x, y2: child.y, middle: child.y - levelGap / 2 });
      }
    }
    place(root, padding);
    return { nodes, edges, width: root.span + padding * 2, height: tops.at(-1) + levelHeights.at(-1) + padding };
  }
  return { notation, layoutTree };
});
