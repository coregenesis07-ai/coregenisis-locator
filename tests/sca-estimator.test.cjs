// Regression tests for the actual browser calculator without network calls.
// Run: node --test tests/sca-estimator.test.cjs
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const source = fs.readFileSync('public/app.js','utf8');
const begin = source.indexOf('function calculateScaEstimate(e){');
const end = source.indexOf('function esc(v){',begin);
assert.ok(begin >= 0 && end > begin, 'SCA estimator function exists');
const functionSource = source.slice(begin,end);

function calculate(release, months, lang='en') {
  const elements = {
    '#scaReleaseDate': {value: release},
    '#scaMonths': {value: String(months)},
    '#scaEstimatorResult': {textContent: ''}
  };
  const ctx = {Date, Number, String, state:{lang}, $: key=>elements[key]};
  vm.createContext(ctx);
  vm.runInContext(functionSource,ctx,{timeout:1000});
  let prevented = false;
  ctx.calculateScaEstimate({preventDefault(){prevented=true;}});
  assert.ok(prevented);
  return elements['#scaEstimatorResult'].textContent;
}

test('leap year: March 31 minus one month',()=>{
  const result=calculate('2028-03-31',1);
  assert.match(result,/February 29, 2028/);
  assert.match(result,/Not an approval or guarantee/);
});
test('non-leap year: August 31 minus six months',()=>{
  assert.match(calculate('2027-08-31',6),/February 28, 2027/);
});
test('year boundary: January 31 minus one month',()=>{
  assert.match(calculate('2027-01-31',1),/December 31, 2026/);
});
test('12 month ceiling: leap-day subtraction',()=>{
  assert.match(calculate('2028-02-29',12),/February 28, 2027/);
});
test('Spanish result and disclaimer',()=>{
  const result=calculate('2028-03-31',1,'es');
  assert.match(result,/29 de febrero de 2028/);
  assert.match(result,/No es una aprobación ni garantía/);
});
test('rejects 0, 13 and fractional months',()=>{
  for (const m of [0,13,1.5]) assert.match(calculate('2028-03-31',m),/Enter a valid date/);
});
test('rejects malformed and impossible dates',()=>{
  for(const d of ['2027-02-29','2028-13-01','not-a-date']) {
    assert.match(calculate(d,1),/Invalid date|Enter a valid date/);
  }
});
test('production source includes bilingual form, live binding and safety disclaimer',()=>{
  assert.match(source,/id="scaEstimatorForm"/);
  assert.match(source,/scaForm\.addEventListener\('submit',calculateScaEstimate\)/);
  assert.match(source,/Home confinement has separate limits/);
});
