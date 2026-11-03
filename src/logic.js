/* Núcleo independiente de la interfaz. Utilizable en navegador y en Node.js. */
(function (root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.Logic = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';
  const LIMITS = Object.freeze({ domain: 20, arity: 6, tuples: 4096, symbols: 32, tokens: 512, depth: 100, steps: 12000, environments: 256 });
  const reserved = new Set(['forall', 'exists', 'not', 'and', 'or']);
  const identifier = /^[A-Za-z_][A-Za-z0-9_]*$/;
  const own = (obj, key) => Object.prototype.hasOwnProperty.call(obj, key);
  class LogicError extends Error {
    constructor(code, message, position = null) { super(message); this.name = 'LogicError'; this.code = code; this.position = position; }
  }
  function fail(code, message, position) { throw new LogicError(code, message, position); }
  function validName(name) { return typeof name === 'string' && identifier.test(name) && !reserved.has(name); }
  const key = args => JSON.stringify(args);
  function product(domain, arity) {
    if (!Number.isInteger(arity) || arity < 0 || arity > LIMITS.arity) fail('LIMITE', `La aridad debe estar entre 0 y ${LIMITS.arity}.`);
    if (domain.length ** arity > LIMITS.tuples) fail('LIMITE', `La tabla supera ${LIMITS.tuples} tuplas. Reduce el dominio o la aridad.`);
    let rows = [[]];
    for (let i = 0; i < arity; i++) rows = rows.flatMap(row => domain.map(a => [...row, a]));
    return rows;
  }
  function language(symbols) {
    if (!Array.isArray(symbols)) fail('LENGUAJE', 'La lista de símbolos es inválida.');
    if (symbols.length > LIMITS.symbols) fail('LIMITE', `Máximo ${LIMITS.symbols} símbolos.`);
    const result = new Map();
    for (const s of symbols) {
      if (!s || !validName(s.name)) fail('SIMBOLO', 'Los nombres deben comenzar con letra ASCII o _ y contener letras, números o _. No uses palabras reservadas.');
      if (result.has(s.name)) fail('SIMBOLO', `El símbolo ${s.name} está declarado más de una vez.`);
      if (!['function', 'predicate'].includes(s.kind)) fail('SIMBOLO', `Tipo inválido para ${s.name}.`);
      if (!Number.isInteger(s.arity) || s.arity < 0 || s.arity > LIMITS.arity) fail('ARIDAD', `La aridad de ${s.name} debe ser un entero entre 0 y ${LIMITS.arity}.`);
      result.set(s.name, s);
    }
    return result;
  }
  function validateModel(model) {
    if (!model || typeof model !== 'object') fail('DOMINIO', 'Falta la interpretación.');
    const d = model.domain;
    if (!Array.isArray(d) || !d.length) fail('DOMINIO', 'El dominio debe ser finito y no vacío.');
    if (d.length > LIMITS.domain) fail('LIMITE', `Máximo ${LIMITS.domain} elementos en el dominio.`);
    if (d.some(a => typeof a !== 'string' || !a.trim() || a !== a.trim() || a.length > 40 || /[,\u0000-\u001f]/u.test(a))) fail('DOMINIO', 'Cada elemento debe ser una etiqueta no vacía, sin comas, caracteres de control ni espacios en los extremos y de hasta 40 caracteres.');
    if (new Set(d).size !== d.length) fail('DOMINIO', 'El dominio contiene elementos repetidos.');
    const symbols = language(model.symbols), functions = new Map(), predicates = new Map();
    for (const s of symbols.values()) {
      const expected = product(d, s.arity).length;
      const rows = s.kind === 'function' ? s.entries : s.tuples;
      if (!Array.isArray(rows) || !rows.length) fail('INTERPRETACION', `${s.name}: no se admiten funciones ni relaciones vacías.`);
      const map = new Map();
      for (const row of rows) {
        const args = s.kind === 'function' ? row?.args : row;
        if (!Array.isArray(args) || args.length !== s.arity) fail('TUPLA', `${s.name}: cada tupla debe tener ${s.arity} componentes.`);
        if (args.some(a => !d.includes(a))) fail('TUPLA', `${s.name}: una tupla contiene elementos fuera de D.`);
        if (map.has(key(args))) fail('TUPLA', `${s.name}: tupla duplicada ${key(args)}.`);
        if (s.kind === 'function' && !d.includes(row.value)) fail('FUNCION', `${s.name}${key(args)}: falta una salida válida en D.`);
        map.set(key(args), s.kind === 'function' ? row.value : true);
      }
      if (s.kind === 'function' && map.size !== expected) fail('FUNCION', `${s.name} debe ser total: tiene ${map.size} de ${expected} asignaciones de D^${s.arity}.`);
      (s.kind === 'function' ? functions : predicates).set(s.name, map);
    }
    return { domain: [...d], symbols, functions, predicates };
  }
  function tokenize(source) {
    if (typeof source !== 'string' || source.length > 5000) fail('LIMITE', 'La fórmula debe ser texto de hasta 5000 caracteres.');
    const tokens = []; let i = 0;
    const aliases = { '<->': '↔', '<=>': '↔', '->': '→', '=>': '→', '!=': '≠', '&&': '∧', '||': '∨', '!': '¬', '~': '¬', '&': '∧', '|': '∨', forall: '∀', exists: '∃', not: '¬', and: '∧', or: '∨' };
    while (i < source.length) {
      if (/\s/u.test(source[i])) { i++; continue; }
      const rest = source.slice(i);
      const match = rest.match(/^(<->|<=>|->|=>|!=|&&|\|\||[¬∧∨→↔∀∃=≠(),.!~&|]|[A-Za-z_][A-Za-z0-9_]*)/);
      if (!match) fail('SINTAXIS', `Carácter no permitido «${source[i]}». Los elementos de D se referencian mediante variables o constantes declaradas.`, i);
      const raw = match[0], value = own(aliases, raw) ? aliases[raw] : raw;
      tokens.push({ type: identifier.test(value) ? 'id' : value, value, pos: i });
      i += raw.length;
      if (tokens.length > LIMITS.tokens) fail('LIMITE', `Máximo ${LIMITS.tokens} tokens por fórmula.`);
    }
    tokens.push({ type: 'eof', value: '', pos: i }); return tokens;
  }
  function parse(source, declarations) {
    const symbols = language(declarations), tokens = tokenize(source); let cursor = 0, depth = 0;
    const peek = () => tokens[cursor];
    function take(type) { if (peek().type === type) return tokens[cursor++]; return null; }
    function need(type, message) { const t = take(type); if (!t) fail('SINTAXIS', message || `Se esperaba «${type}».`, peek().pos); return t; }
    function guard(fn) { if (++depth > LIMITS.depth) fail('LIMITE', 'La fórmula tiene demasiados niveles de anidación.', peek().pos); const value = fn(); depth--; return value; }
    function args() {
      need('('); const result = [];
      if (!take(')')) { do { result.push(term()); } while (take(',')); need(')', 'Falta cerrar los argumentos con ).'); }
      return result;
    }
    function term() { return guard(() => {
      const t = need('id', 'Se esperaba una variable, constante o función.');
      const s = symbols.get(t.value);
      if (peek().type === '(') {
        if (!s) fail('SIMBOLO', `Función no declarada: ${t.value}.`, t.pos);
        if (s.kind !== 'function') fail('SIMBOLO', `${t.value} es un predicado; no puede ser un término.`, t.pos);
        const a = args(); if (a.length !== s.arity) fail('ARIDAD', `${s.name} espera ${s.arity} argumentos; recibió ${a.length}.`, t.pos);
        return { type: 'call', name: t.value, args: a };
      }
      if (s) {
        if (s.kind !== 'function' || s.arity !== 0) fail('SIMBOLO', `${s.name} no es una variable ni una constante.`, t.pos);
        return { type: 'call', name: t.value, args: [] };
      }
      return { type: 'var', name: t.value };
    }); }
    function unary() { return guard(() => {
      if (take('¬')) return { type: 'not', child: unary() };
      const q = take('∀') || take('∃');
      if (q) {
        const v = need('id', 'El cuantificador requiere una variable.');
        if (symbols.has(v.value)) fail('SIMBOLO', `${v.value} ya es un símbolo del lenguaje y no puede ligarse como variable.`, v.pos);
        take('.');
        return { type: q.type === '∀' ? 'forall' : 'exists', variable: v.value, child: unary() };
      }
      if (take('(')) { const result = iff(); need(')', 'Falta un paréntesis de cierre.'); return result; }
      if (peek().type === 'id' && symbols.get(peek().value)?.kind === 'predicate') {
        const t = tokens[cursor++], s = symbols.get(t.value);
        const a = peek().type === '(' ? args() : [];
        if (a.length !== s.arity) fail('ARIDAD', `${s.name} espera ${s.arity} argumentos; recibió ${a.length}.`, t.pos);
        return { type: 'predicate', name: t.value, args: a };
      }
      const start = peek(), left = term(), eq = take('=') || take('≠');
      if (!eq) fail('SIMBOLO', `Se esperaba igualdad o un predicado declarado; revisa «${start.value}».`, start.pos);
      return { type: eq.type === '=' ? 'equal' : 'unequal', left, right: term() };
    }); }
    function and() { let left = unary(); while (take('∧')) left = { type: 'and', left, right: unary() }; return left; }
    function or() { let left = and(); while (take('∨')) left = { type: 'or', left, right: and() }; return left; }
    function implies() { return guard(() => { const left = or(); return take('→') ? { type: 'implies', left, right: implies() } : left; }); }
    function iff() { let left = implies(); while (take('↔')) left = { type: 'iff', left, right: implies() }; return left; }
    if (peek().type === 'eof') fail('SINTAXIS', 'Escribe una fórmula para comenzar.', 0);
    const ast = iff(); need('eof', 'Hay texto sobrante; revisa los operadores y paréntesis.');
    return ast;
  }
  function freeVariables(ast) {
    const free = new Set();
    function visit(n, bound) {
      if (n.type === 'var') { if (!bound.has(n.name)) free.add(n.name); return; }
      if (n.type === 'forall' || n.type === 'exists') { visit(n.child, new Set([...bound, n.variable])); return; }
      for (const child of [n.child, n.left, n.right, ...(n.args || [])]) if (child) visit(child, bound);
    }
    visit(ast, new Set()); return [...free].sort();
  }
  function format(n) {
    const op = { and: '∧', or: '∨', implies: '→', iff: '↔', equal: '=', unequal: '≠' };
    if (n.type === 'var') return n.name;
    if (n.type === 'call' || n.type === 'predicate') return n.name + (n.args.length ? `(${n.args.map(format).join(', ')})` : '');
    if (n.type === 'not') return `¬${format(n.child)}`;
    if (n.type === 'forall' || n.type === 'exists') return `${n.type === 'forall' ? '∀' : '∃'}${n.variable} (${format(n.child)})`;
    return `(${format(n.left)} ${op[n.type]} ${format(n.right)})`;
  }
  function validateEnvironment(ast, model, env) {
    if (!env || typeof env !== 'object' || Array.isArray(env)) fail('ENTORNO', 'El entorno debe ser una tabla de asignaciones.');
    for (const [name, value] of Object.entries(env)) {
      if (!validName(name) || model.symbols.has(name)) fail('ENTORNO', `Nombre de variable inválido: ${name}.`);
      if (!model.domain.includes(value)) fail('ENTORNO', `La asignación de ${name} debe pertenecer a D.`);
    }
    for (const name of freeVariables(ast)) if (!own(env, name)) fail('ENTORNO', `Falta asignar la variable libre ${name}.`);
  }
  function evaluateAst(ast, model, env, options = {}) {
    validateEnvironment(ast, model, env);
    let steps = 0; const maxSteps = options.maxSteps ?? LIMITS.steps;
    function tick() { if (++steps > maxSteps) fail('LIMITE', `Se alcanzó el límite de ${maxSteps} pasos. Simplifica la fórmula o reduce D. No se asignó un valor de verdad.`); }
    const label = v => v ? 'verdadero' : 'falso';
    function term(n, local, notes) {
      tick();
      if (n.type === 'var') { notes.push(`${n.name} ↦ ${local[n.name]}`); return local[n.name]; }
      const args = n.args.map(a => term(a, local, notes));
      const value = model.functions.get(n.name).get(key(args));
      notes.push(`${n.name}(${args.join(', ')}) = ${value}`); return value;
    }
    function visit(n, local) {
      tick(); const trace = { formula: format(n), type: n.type, environment: { ...local }, children: [], terms: [] };
      if (n.type === 'predicate') {
        const args = n.args.map(a => term(a, local, trace.terms));
        trace.value = model.predicates.get(n.name).has(key(args));
        trace.reason = `(${args.join(', ')}) ${trace.value ? 'pertenece' : 'no pertenece'} a ${n.name}ℐ.`;
      } else if (n.type === 'equal' || n.type === 'unequal') {
        const a = term(n.left, local, trace.terms), b = term(n.right, local, trace.terms);
        trace.value = n.type === 'equal' ? a === b : a !== b;
        trace.reason = `${a} ${n.type === 'equal' ? '=' : '≠'} ${b} es ${label(trace.value)} (identidad en D).`;
      } else if (n.type === 'forall' || n.type === 'exists') {
        const universal = n.type === 'forall'; trace.value = universal;
        // Copiar el entorno implementa l[x ↦ a] sin modificar los ámbitos exteriores.
        for (const a of model.domain) {
          const child = visit(n.child, { ...local, [n.variable]: a });
          child.assignment = `${n.variable} = ${a}`; trace.children.push(child);
          if (child.value !== universal) {
            trace.value = !universal; trace.decisive = { variable: n.variable, value: a };
            trace.reason = `${universal ? 'Contraejemplo' : 'Testigo'}: ${n.variable} = ${a}; el cuerpo es ${label(child.value)}.`;
            break;
          }
        }
        trace.checked = trace.children.length; trace.total = model.domain.length;
        trace.complete = trace.checked === trace.total;
        if (!trace.reason) trace.reason = `Comprobación completa: para los ${trace.total} elementos de D, el cuerpo es ${label(universal)}.${universal ? '' : ' No existe un testigo.'}`;
      } else if (n.type === 'not') {
        const child = visit(n.child, local); trace.children.push(child); trace.value = !child.value;
        trace.reason = `La negación invierte ${label(child.value)} a ${label(trace.value)}.`;
      } else {
        // Ambos operandos se explican; la validación ya se hizo para toda la entrada.
        const a = visit(n.left, local), b = visit(n.right, local); trace.children.push(a, b);
        switch (n.type) {
          case 'and': trace.value = a.value && b.value; trace.reason = trace.value ? 'Ambos operandos son verdaderos.' : 'Al menos un operando es falso.'; break;
          case 'or': trace.value = a.value || b.value; trace.reason = trace.value ? 'Al menos un operando es verdadero.' : 'Ambos operandos son falsos.'; break;
          case 'implies': trace.value = !a.value || b.value; trace.reason = !a.value ? 'El antecedente es falso; la implicación es verdadera.' : b.value ? 'Antecedente y consecuente verdaderos.' : 'Antecedente verdadero y consecuente falso: la implicación es falsa.'; break;
          case 'iff': trace.value = a.value === b.value; trace.reason = trace.value ? 'Los operandos tienen el mismo valor de verdad.' : 'Los operandos tienen distintos valores de verdad.'; break;
          default: fail('INTERNO', 'Nodo no reconocido.');
        }
      }
      return trace;
    }
    const trace = visit(ast, { ...env }); return { value: trace.value, trace, steps };
  }
  function evaluate(formula, interpretation, environment = {}) {
    // Nunca decidir verdad antes de validar incluso símbolos no usados en la fórmula.
    const model = validateModel(interpretation), ast = parse(formula, interpretation.symbols);
    return { ...evaluateAst(ast, model, environment), ast, normalized: format(ast), free: freeVariables(ast) };
  }
  function explore(formula, interpretation) {
    const model = validateModel(interpretation), ast = parse(formula, interpretation.symbols), free = freeVariables(ast);
    const count = model.domain.length ** free.length;
    if (count > LIMITS.environments) fail('LIMITE', `La exploración requiere ${count} entornos; el máximo es ${LIMITS.environments}.`);
    let rows = [{}], budget = 100000;
    for (const v of free) rows = rows.flatMap(row => model.domain.map(a => ({ ...row, [v]: a })));
    const results = rows.map(environment => {
      const result = evaluateAst(ast, model, environment, { maxSteps: Math.min(LIMITS.steps, budget) }); budget -= result.steps;
      return { environment, value: result.value };
    });
    return { free, rows: results, trueCount: results.filter(r => r.value).length };
  }
  return { LIMITS, LogicError, validName, key, product, language, validateModel, tokenize, parse, freeVariables, format, evaluateAst, evaluate, explore };
});
