'use strict';
// Empaquetado sin dependencias: la fuente modular sigue siendo la referencia.
const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '..');
const L = require('../src/logic.js');
const examples = require('../src/examples.js');
let html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
const css = fs.readFileSync(path.join(root, 'styles.css'), 'utf8');
html = html.replace('<link rel="stylesheet" href="styles.css">', () => `<style>\n${css}\n</style>`);
html = html.replace(/<script defer src="src\/(logic|examples|presentation|app)\.js"><\/script>/g, '');
const scripts = ['logic.js','examples.js','presentation.js','app.js'].map(file => `<script>\n${fs.readFileSync(path.join(root, 'src',file),'utf8')}\n</script>`).join('\n');
html = html.replace('</body>', () => `${scripts}\n</body>`);
const destination = path.resolve(root, '..', 'Semantic-Lab.html');
fs.writeFileSync(destination, html, 'utf8');
fs.mkdirSync(path.join(root, 'examples'),{recursive:true});
examples.forEach((e,i)=>{
  L.evaluate(e.formula,e.model,e.environment);
  const data = {version:1,model:e.model,formula:e.formula,environment:e.environment};
  fs.writeFileSync(path.join(root,'examples',`0${i+1}-caso.json`),JSON.stringify(data,null,2)+'\n');
});
console.log('HTML autónomo generado y 6 casos JSON validados.');
