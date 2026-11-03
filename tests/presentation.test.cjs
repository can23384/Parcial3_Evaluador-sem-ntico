'use strict';
const {test} = require('node:test');
const assert = require('node:assert/strict');
const L = require('../src/logic.js');
const P = require('../src/presentation.js');
const examples = require('../src/examples.js');

test('Notación: dominio, relación unaria y tuplas binarias',()=>{
  const rows=P.notation(examples[0].model);
  assert.equal(rows[0].expression,'D = { 1, 2, 3 }');
  assert.ok(rows.some(r=>r.expression==='Pℐ = { 1, 2 }'));
  assert.ok(rows.some(r=>r.expression==='Rℐ = { (1, 3), (2, 1), (3, 2) }'));
});
test('Notación: constantes y gráfico de funciones, sin alterar el modelo',()=>{
  const model=JSON.parse(JSON.stringify(examples[4].model)),before=JSON.stringify(model),rows=P.notation(model);
  assert.ok(rows.some(r=>r.expression==='cℐ = a'));
  assert.ok(rows.some(r=>r.expression==='fℐ = { (a, b), (b, a) }'));
  assert.equal(JSON.stringify(model),before);
});
test('Notación de una función binaria preserva entrada y salida separadas',()=>{
  const model={domain:['a','b'],symbols:[{name:'f',kind:'function',arity:2,entries:[{args:['a','b'],value:'a'}]}]};
  const row=P.notation(model).at(-1);assert.equal(row.expression,'fℐ = { ((a, b), a) }');assert.match(row.note,/1 de 4/);
});
test('Notación permite mostrar borradores vacíos y etiquetas con delimitadores',()=>{
  const rows=P.notation({domain:['a)','{b}'],symbols:[{name:'P',kind:'predicate',arity:1,tuples:[]},{name:'c',kind:'function',arity:0,entries:[]}]});
  assert.equal(rows[0].expression,'D = { "a)", "{b}" }');
  assert.match(rows[2].note,/Relación vacía/);assert.equal(rows[3].expression,'cℐ = sin asignar');
});
test('Árbol binario: raíz completa, antecedente a la izquierda y consecuente a la derecha',()=>{
  const ast=L.parse('P(x) → ¬P(y)',examples[0].model.symbols),tree=P.layoutTree(ast),root=tree.nodes[0];
  assert.equal(root.formula,'(P(x) → ¬P(y))');assert.equal(root.children.length,2);
  assert.ok(root.children[0].x<root.x);assert.ok(root.children[1].x>root.x);
  assert.equal(root.children[0].formula,'P(x)');assert.equal(root.children[1].formula,'¬P(y)');
  assert.equal(tree.edges.length,tree.nodes.length-1);
});
test('Unarios, términos y constantes forman sus propias ramas',()=>{
  const ast=L.parse('∀x (f(f(x)) = c)',examples[4].model.symbols),tree=P.layoutTree(ast);
  assert.equal(tree.nodes[0].children.length,1);
  assert.equal(tree.nodes[0].children[0].x,tree.nodes[0].x);
  assert.equal(tree.nodes.filter(n=>n.type==='call').length,3);
  assert.equal(tree.nodes.filter(n=>n.type==='var').length,1);
});
test('Conexiones y cajas no se solapan y caben en el lienzo para árboles anchos y profundos',()=>{
  const declarations=examples[0].model.symbols;
  const formulas=[...examples.map(e=>({formula:e.formula,symbols:e.model.symbols})),
    {formula:'P(x) ∧ (P(y) ∨ (R(x,y) → (P(z) ↔ P(w))))',symbols:declarations},
    {formula:Array.from({length:25},(_,i)=>`P(x${i})`).join(' ∧ '),symbols:declarations},
    {formula:'¬'.repeat(35)+'P(x)',symbols:declarations}];
  for(const f of formulas){
    const ast=L.parse(f.formula,f.symbols),before=JSON.stringify(ast),tree=P.layoutTree(ast);
    assert.equal(JSON.stringify(ast),before);
    for(const n of tree.nodes){
      assert.ok(n.x-n.width/2>=0 && n.x+n.width/2<=tree.width);
      assert.ok(n.y>=0 && n.y+n.height<=tree.height);
      assert.equal(n.lines.join(''),n.formula);
      for(const other of tree.nodes.filter(o=>o.id>n.id && o.depth===n.depth)){
        assert.ok(n.x+n.width/2<=other.x-other.width/2 || other.x+other.width/2<=n.x-n.width/2);
      }
    }
    for(const edge of tree.edges){
      const parent=tree.nodes[edge.parent],child=tree.nodes[edge.child];
      assert.equal(child.depth,parent.depth+1);assert.equal(edge.x1,parent.x);assert.equal(edge.y1,parent.y+parent.height);
      assert.equal(edge.x2,child.x);assert.equal(edge.y2,child.y);assert.ok(edge.middle>edge.y1 && edge.middle<edge.y2);
    }
  }
});
test('La escritura libre no convierte valores ajenos al dominio en resultados lógicos',()=>{
  for(const value of ['contenido libre','<b>hola</b>',' 0','9']) assert.throws(()=>L.evaluate('P(x,y)',examples[2].model,{x:value,y:'2'}),e=>e.code==='ENTORNO');
  assert.equal(L.evaluate('P(x,y)',examples[2].model,{x:'0',y:'2'}).value,true);
});
