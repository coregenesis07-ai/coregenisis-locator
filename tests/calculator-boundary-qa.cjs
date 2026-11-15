// Non-production regression probes for PR #26. Run: node tests/calculator-boundary-qa.cjs
// These tests document current behavior; they do not certify BOP/legal correctness.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const src = fs.readFileSync('public/first-step-act-calculator/calculator.js', 'utf8');
const start = src.indexOf('function gctForMonths(');
const end = src.indexOf('function statusTag(', start);
assert(start >= 0 && end > start, 'Calculator functions not found');
const context = {Math, Date};
vm.createContext(context);
vm.runInContext(src.slice(start, end), context);
const gct = (months, lost=0) => vm.runInContext(`gctForMonths(${months},${lost})`,context);
const ftc = (periods, rate) => vm.runInContext(`estimateFtc(${periods},${rate})`,context);
assert.equal(gct(12), 0, 'Current 12-month boundary changed; review statutory threshold');
assert.equal(gct(13), 58, 'Current 13-month estimate changed; review partial-year rounding');
assert.equal(gct(24), 108);
assert.equal(gct(60), 270);
assert.equal(gct(60,30), 240);
assert.equal(ftc(20,10), 200);
assert.equal(ftc(20,15), 300);
assert.equal(ftc(-1,10), 0);

// Safety notice must remain visible in both supported languages until day-precision modeling is validated.
const html = fs.readFileSync('public/first-step-act-calculator/index.html', 'utf8');
const translations = fs.readFileSync('public/first-step-act-calculator/calculator-lang.js', 'utf8');
assert.match(html, /id="sentencePrecisionNotice"/);
assert.match(html, /id="sentenceExtraDays"/);
assert.match(html, /id="fsa2026RuleNotice"/);
assert.match(html, /2026-08-31\/html\/2026-17752\.htm/);
assert.match(translations, /Regla del BOP de 2026/);
assert.match(html, /estimates with additional days are paused/);
assert.match(translations, /Días adicionales de condena/);
assert.match(translations, /The current calculation model supports whole-month sentences only/);
assert.match(src, /if\(extraDays>0\)/);
assert.match(src, /Some of those credits may not yet have been earned/);
assert.match(translations, /Es posible que algunos de esos créditos todavía no se hayan obtenido/);
assert.match(src, /This best-case scenario assumes qualifying participation continuously/);
assert.match(translations, /Este escenario optimista supone participación continua/);
assert.match(src, /window\.FCG_CALC_LANG\?\.\(\)==='es'/);
assert.match(src, /Las estimaciones de condenas con días adicionales están suspendidas/);
assert.match(src, /Los días adicionales deben ser un número entero/);
console.log('Baseline boundary probes passed. REVIEW REQUIRED: month-only input cannot express 12 months + 1 day; partial-year GCT rounding and FTC application eligibility are not validated by these tests.');
