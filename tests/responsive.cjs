/* Prueba de herencia y equivalencia del CSS del editor con el renderizador PHP. */
const fs = require('node:fs');
const vm = require('node:vm');
const assert = require('node:assert/strict');
const source = fs.readFileSync(require('node:path').join(__dirname, '../assets/builder.js'), 'utf8');
function extraer(nombre) {
  const inicio = source.indexOf('  function ' + nombre + '(');
  assert(inicio >= 0, nombre);
  const fin = source.indexOf('\n  function ', inicio + 1);
  return source.slice(inicio, fin);
}
const contexto = vm.createContext({});
const funciones = ['respDefault', 'respGet', 'respHasOverride', 'respReset', 'respEnsureOverride', 'cssLength', 'paddingCss', 'backgroundCss', 'borderCss', 'gridTemplateColumnsCss', 'itemTypographySelector', 'typographyCssJs', 'variantCssJs', 'styleBlock', 'collectRules', 'buildResponsiveCss'];
vm.runInContext(funciones.map(extraer).join('\n'), contexto);
const valor = { desktop: '40px', laptop: '30px', tablet: null, mobile: null };
assert.equal(contexto.respGet(valor, 'mobile'), '30px');
assert.equal(contexto.respGet(valor, 'tablet'), '30px');
contexto.respReset(valor, 'laptop');
assert.equal(contexto.respGet(valor, 'tablet'), '40px');
assert.equal(contexto.respGet({ desktop: '12px', tablet: '8px' }, 'mobile'), '8px');
const datos = JSON.parse(fs.readFileSync(process.argv[2], 'utf8'));
const cssEditor = contexto.buildResponsiveCss(datos.layout);
const cssPhp = datos.html.match(/^<style>([\s\S]*?)<\/style>/)[1];
assert.equal(cssEditor, cssPhp);
console.log('Correcto: herencia, restablecer y CSS idéntico entre PHP y JavaScript.');
