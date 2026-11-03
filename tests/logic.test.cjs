'use strict';
const { test } = require('node:test');
const assert = require('node:assert/strict');
const L = require('../src/logic.js');
const examples = require('../src/examples.js');
const copy = x => JSON.parse(JSON.stringify(x));
const base = () => copy(examples[0].model);
const bad = (fn, code) => assert.throws(fn, e => e instanceof L.LogicError && e.code === code);

for (const [i, expected] of [true,false,true,false,true,true].entries()) {
  test(`Ejemplo ${i + 1}: resultado y explicación`, () => {
    const e = examples[i], r = L.evaluate(e.formula,e.model,e.environment);
    assert.equal(r.value, expected); assert.ok(r.trace.reason.length); assert.ok(r.steps > 0);
  });
}
test('Tablas de verdad completas de los cinco conectivos', () => {
  for (const a of [false,true]) for (const b of [false,true]) {
    const model = { domain: ['a','b','spare'], symbols: [
      {name:'P',kind:'predicate',arity:1,tuples:[['spare'],...(a ? [['a']] : []),...(b ? [['b']] : [])]},
      {name:'c',kind:'function',arity:0,entries:[{args:[],value:'a'}]},
      {name:'d',kind:'function',arity:0,entries:[{args:[],value:'b'}]}
    ]};
    for (const [op, expected] of [['∧',a && b],['∨',a || b],['→',!a || b],['↔',a === b]]) assert.equal(L.evaluate(`P(c) ${op} P(d)`,model).value, expected);
    assert.equal(L.evaluate('¬P(c)',model).value,!a);
  }
});
test('Cuantificadores: contraste exhaustivo con bucles independientes en dominio binario', () => {
  const domain = ['a','b'], pairs = [['a','a'],['a','b'],['b','a'],['b','b']];
  for (let pm = 1; pm < 4; pm++) for (let rm = 1; rm < 16; rm++) {
    const p = domain.filter((_,i) => pm & (1 << i)), r = pairs.filter((_,i) => rm & (1 << i));
    const model = { domain, symbols: [{name:'P',kind:'predicate',arity:1,tuples:p.map(a=>[a])},{name:'R',kind:'predicate',arity:2,tuples:r}] };
    const rel = (x,y) => r.some(t => t[0] === x && t[1] === y);
    for (const [formula, expected] of [
      ['∀x (∃y R(x,y))', domain.every(x=>domain.some(y=>rel(x,y)))],
      ['∃y (∀x R(x,y))', domain.some(y=>domain.every(x=>rel(x,y)))],
      ['∀x (∀y (R(x,y) → P(x)))', domain.every(x=>domain.every(y=>!rel(x,y)||p.includes(x)))],
      ['∃x (∃y (R(x,y) ∧ ¬P(y)))', domain.some(x=>domain.some(y=>rel(x,y)&&!p.includes(y)))],
      ['∀x (P(x) ↔ ∃y R(y,x))', domain.every(x=>p.includes(x)===domain.some(y=>rel(y,x)))],
      ['¬∀x P(x) ↔ ∃x ¬P(x)', true],
      ['¬∃x P(x) ↔ ∀x ¬P(x)', true],
      ['∀x (∃y (R(x,y) ∨ x = y))', true]
    ]) assert.equal(L.evaluate(formula,model).value,expected,`${pm}/${rm}: ${formula}`);
  }
});
test('Testigo existencial: detención con la asignación decisiva', () => {
  const r = L.evaluate('∃x P(x)',base()); assert.equal(r.trace.decisive.value,'1'); assert.equal(r.trace.checked,1); assert.equal(r.trace.complete,false);
});
test('Contraejemplo universal y comprobación completa del universal verdadero', () => {
  const r = L.evaluate('∀x P(x)',base()); assert.equal(r.value,false); assert.equal(r.trace.decisive.value,'3');
  const t = L.evaluate('∀x (P(x) ∨ ¬P(x))',base()); assert.equal(t.trace.checked,3); assert.equal(t.trace.complete,true); assert.equal(t.trace.children.length,3);
});
test('Existencial falso recorre todos los elementos y explica cada caso', () => {
  const r = L.evaluate('∃x (P(x) ∧ ¬P(x))',base()); assert.equal(r.value,false); assert.equal(r.trace.children.length,3); assert.equal(r.trace.complete,true); assert.match(r.trace.reason,/No existe un testigo/);
});
test('Entorno local: sombreado de variable y restauración al salir', () => {
  const env = {x:'3'}, r = L.evaluate('(∃x P(x)) ∧ ¬P(x)',base(),env);
  assert.equal(r.value,true); assert.deepEqual(env,{x:'3'}); assert.deepEqual(r.free,['x']);
  assert.equal(L.evaluate('∀x (P(x) → (∃x ¬P(x)))',base()).value,true);
});
test('Variables libres por ámbito, no por simple resta de nombres', () => {
  assert.deepEqual(L.freeVariables(L.parse('(∀x R(x,y)) ∧ P(x)',base().symbols)),['x','y']);
});
test('Funciones binarias, constantes y términos anidados', () => {
  const model = {domain:['a','b'],symbols:[{name:'c',kind:'function',arity:0,entries:[{args:[],value:'a'}]},{name:'f',kind:'function',arity:2,entries:L.product(['a','b'],2).map(args=>({args,value:args[0]}))}]};
  assert.equal(L.evaluate('∀x (f(x, f(c,x)) = x)',model).value,true);
  assert.equal(L.evaluate('c = c()',model).value,true);
});
test('Aridad cero: D^0 contiene exactamente la tupla vacía', () => {
  assert.deepEqual(L.product(['a'],0),[[]]);
  const model={domain:['a'],symbols:[{name:'p',kind:'predicate',arity:0,tuples:[[]]}]};
  assert.equal(L.evaluate('p ∧ p()',model).value,true);
  model.symbols[0].tuples=[]; bad(()=>L.evaluate('p',model),'INTERPRETACION');
});
test('Precedencia, implicación a la derecha y alcance unario de cuantificadores', () => {
  const ast=L.parse('P(x) → P(y) → P(z)',base().symbols); assert.equal(ast.right.type,'implies');
  assert.equal(L.parse('P(x) ∨ P(y) ∧ P(z)',base().symbols).right.type,'and');
  assert.deepEqual(L.freeVariables(L.parse('∀x P(x) → P(x)',base().symbols)),['x']);
  assert.deepEqual(L.freeVariables(L.parse('∀x (P(x) → P(x))',base().symbols)),[]);
});
test('Alternativas ASCII y notación con punto', () => {
  for (const f of ['forall x. (P(x) or not P(x))','forall x (P(x) | !P(x))','∀x (P(x) ∨ ~P(x))','forall x (P(x) <-> P(x))','forall x (P(x) => P(x))']) assert.equal(L.evaluate(f,base()).value,true);
  assert.equal(L.evaluate('exists x (P(x) && (x != y))',base(),{y:'3'}).value,true);
});
test('Normalización conserva la semántica de todos los ejemplos',()=>{
  for(const e of examples){ const r=L.evaluate(e.formula,e.model,e.environment); assert.equal(L.evaluate(r.normalized,e.model,e.environment).value,r.value); }
});
for(const [formula,code] of [['','SINTAXIS'],['P(','SINTAXIS'],['P(x','SINTAXIS'],['P(x))','SINTAXIS'],['∀ P(x)','SIMBOLO'],['P(x,y)','ARIDAD'],['R(x)','ARIDAD'],['Z(x)','SIMBOLO'],['P(g(x))','SIMBOLO'],['P(P(x))','SIMBOLO'],['P(1)','SINTAXIS'],['P(x) # P(x)','SINTAXIS'],['P(x) P(x)','SINTAXIS'],['∀x','SINTAXIS'],['∀P P(x)','SIMBOLO']]){
  test(`Rechazo de fórmula: ${formula || '(vacía)'}`,()=>bad(()=>L.evaluate(formula,base()),code));
}
test('No se omiten errores en una rama lógicamente innecesaria',()=>bad(()=>L.evaluate('∃x P(x) ∨ Z(x)',base()),'SIMBOLO'));
test('Falta una asignación libre',()=>bad(()=>L.evaluate('P(x)',base()),'ENTORNO'));
test('Asignación fuera de dominio',()=>bad(()=>L.evaluate('P(x)',base(),{x:'9'}),'ENTORNO'));
test('El entorno no puede usar nombres de símbolos',()=>bad(()=>L.evaluate('∀x P(x)',base(),{P:'1'}),'ENTORNO'));
test('Dominio vacío, repetido y etiqueta vacía',()=>{
  for(const domain of [[],['a','a'],[''],[1],[' a'],['a,b'],['a\u0000b']]) bad(()=>L.validateModel({domain,symbols:[]}),'DOMINIO');
});
test('Relación vacía, incluso si no se utiliza',()=>{const m=base();m.symbols[0].tuples=[];bad(()=>L.evaluate('∀x R(x,x)',m),'INTERPRETACION');});
test('Tuplas fuera del dominio, con aridad incorrecta o duplicadas',()=>{
  for(const tuples of [[['9']],[['1','2']],[['1'],['1']]]){const m=base();m.symbols[0].tuples=tuples;bad(()=>L.validateModel(m),'TUPLA');}
});
test('Funciones vacías, parciales, multivaluadas y fuera del dominio',()=>{
  const model=copy(examples[4].model);
  for(const [entries,code] of [[[],'INTERPRETACION'],[[{args:['a'],value:'a'}],'FUNCION'],[[{args:['a'],value:'a'},{args:['a'],value:'b'}],'TUPLA'],[[{args:['a'],value:'c'}],'FUNCION']]){
    model.symbols[1].entries=entries;bad(()=>L.validateModel(model),code);
  }
});
test('Lenguaje: símbolos repetidos, aridad inválida y palabra reservada',()=>{
  const m=base();bad(()=>L.language([...m.symbols,m.symbols[0]]),'SIMBOLO');
  for(const arity of [-1,1.5,'1',7]) bad(()=>L.language([{name:'P',kind:'predicate',arity}]),'ARIDAD');
  bad(()=>L.language([{name:'forall',kind:'predicate',arity:1}]),'SIMBOLO');
});
test('Explorador exhaustivo de entornos de la diapositiva 8',()=>{
  const e=examples[2],r=L.explore(e.formula,e.model);assert.equal(r.rows.length,9);assert.equal(r.trueCount,3);assert.deepEqual(r.free,['x','y']);
});
test('Fórmula cerrada: exactamente un entorno vacío',()=>{const r=L.explore('∀x P(x)',base());assert.equal(r.rows.length,1);assert.deepEqual(r.rows[0].environment,{});});
test('Límites rechazan entradas sin resultados parciales',()=>{
  bad(()=>L.product(Array.from({length:20},(_,i)=>String(i)),6),'LIMITE');
  bad(()=>L.explore('P(a) ∧ P(b) ∧ P(c) ∧ P(d) ∧ P(e) ∧ P(f)',base()),'LIMITE');
  const m=L.validateModel(base()),a=L.parse('∀x P(x)',base().symbols);bad(()=>L.evaluateAst(a,m,{}, {maxSteps:1}),'LIMITE');
  bad(()=>L.parse('¬'.repeat(110)+'P(x)',base().symbols),'LIMITE');
});
test('Nombres similares a propiedades de Object no alteran el analizador',()=>{
  const m={domain:['a'],symbols:[{name:'constructor',kind:'predicate',arity:1,tuples:[['a']]}]};
  assert.equal(L.evaluate('constructor(__proto__)',m,JSON.parse('{"__proto__":"a"}')).value,true);
});
test('No se interpreta código JavaScript como fórmula',()=>bad(()=>L.evaluate('alert("hola")',base()),'SINTAXIS'));
