const assert = require('node:assert/strict');
const fs = require('node:fs');
const html = fs.readFileSync('public/first-step-act-calculator/index.html', 'utf8');
assert.doesNotMatch(html, /<\/script>\\n<script/, 'Literal backslash-n appears between script tags');
assert.match(html, /<script src="\.\/calculator-lang\.js\?v=20261115-1" defer><\/script>\s*<script src="\.\/calculator\.js\?v=20260928-0915" defer><\/script>/, 'Calculator scripts or cache key changed unexpectedly');
assert.equal((html.match(/calculator-lang\.js\?v=/g)||[]).length, 1, 'Language script should load once');
assert.equal((html.match(/calculator\.js\?v=/g)||[]).length, 1, 'Calculator script should load once');
console.log('Scoped mobile HTML regression checks passed; browser QA remains required.');
