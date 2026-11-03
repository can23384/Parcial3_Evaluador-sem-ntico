(function (root) {
  'use strict';
  const examples = [
    { title: '01 / Relaciones cíclicas', description: 'Interpretaciones · diapositiva 5. Cada elemento tiene un sucesor en R.', formula: '∀x (∃y R(x, y))', environment: {}, model: { domain: ['1','2','3'], symbols: [
      { name: 'P', kind: 'predicate', arity: 1, tuples: [['1'],['2']] },
      { name: 'R', kind: 'predicate', arity: 2, tuples: [['1','3'],['2','1'],['3','2']] }
    ] } },
    { title: '02 / Un contraejemplo', description: 'Interpretaciones · diapositiva 5. El elemento 3 no pertenece a P.', formula: '∀x P(x)', environment: {}, model: { domain: ['1','2','3'], symbols: [
      { name: 'P', kind: 'predicate', arity: 1, tuples: [['1'],['2']] }
    ] } },
    { title: '03 / Fórmula abierta', description: 'Entornos · diapositiva 8. Cambia x e y para observar el efecto del entorno.', formula: 'P(x, y)', environment: { x: '0', y: '2' }, model: { domain: ['0','1','2'], symbols: [
      { name: 'P', kind: 'predicate', arity: 2, tuples: [['0','1'],['0','2'],['1','2']] }
    ] } },
    { title: '04 / No existe testigo', description: 'Entornos · diapositiva 8. Ningún elemento se relaciona con todos.', formula: '∃x (∀y P(x, y))', environment: {}, model: { domain: ['0','1','2'], symbols: [
      { name: 'P', kind: 'predicate', arity: 2, tuples: [['0','1'],['0','2'],['1','2']] }
    ] } },
    { title: '05 / Funciones y constantes', description: 'Ejemplo adicional finito: f intercambia a y b; aplicarla dos veces devuelve el original.', formula: '(∀x (f(f(x)) = x)) ∧ (f(c) ≠ c)', environment: {}, model: { domain: ['a','b'], symbols: [
      { name: 'c', kind: 'function', arity: 0, entries: [{ args: [], value: 'a' }] },
      { name: 'f', kind: 'function', arity: 1, entries: [{ args: ['a'], value: 'b' }, { args: ['b'], value: 'a' }] }
    ] } },
    { title: '06 / Constante y relaciones', description: 'Interpretaciones · diapositiva 7. La constante i representa el elemento a.', formula: '(∃y Q(i, y)) ∧ ¬R(i)', environment: {}, model: { domain: ['a','b','c'], symbols: [
      { name: 'i', kind: 'function', arity: 0, entries: [{ args: [], value: 'a' }] },
      { name: 'R', kind: 'predicate', arity: 1, tuples: [['b'],['c']] },
      { name: 'Q', kind: 'predicate', arity: 2, tuples: [['a','a'],['a','b'],['a','c'],['b','c'],['c','c']] }
    ] } }
  ];
  if (typeof module === 'object' && module.exports) module.exports = examples;
  else root.EXAMPLES = examples;
})(typeof globalThis !== 'undefined' ? globalThis : this);
