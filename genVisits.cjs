const {locationDatabase} = require('./src/data/locations.js');
const fs = require('fs');

const active = locationDatabase.filter(l => !l.city.includes('\u0645\u062a\u0648\u0642\u0641'));
const sids = ['sh-001','sh-002','sh-003','sh-004','sh-005','sh-006','sh-007','sh-008'];
const scns = ['\u062a\u0642\u064a\u064a\u0645 \u0634\u0627\u0645\u0644 \u0644\u0644\u0645\u0648\u0638\u0641','\u0627\u0633\u062a\u0641\u0633\u0627\u0631 \u0639\u0646 \u0627\u0644\u0639\u0631\u0648\u0636','\u062a\u0642\u064a\u064a\u0645 \u062c\u0648\u062f\u0629 \u0627\u0644\u062e\u062f\u0645\u0629','\u062a\u0642\u064a\u064a\u0645 \u0627\u0644\u0645\u0639\u0631\u0641\u0629 \u0628\u0627\u0644\u0645\u0646\u062a\u062c\u0627\u062a','\u062a\u0642\u064a\u064a\u0645 \u0645\u0647\u0627\u0631\u0627\u062a \u0627\u0644\u0628\u064a\u0639','\u0645\u062a\u0627\u0628\u0639\u0629 \u0646\u062a\u0627\u0626\u062c \u0627\u0644\u062a\u062f\u0631\u064a\u0628'];
const qK = ['fi_q1','fi_q2','fi_q3','cm_q1','cm_q2','cm_q3','pk_q1','pk_q2','pk_q3','ss_q1','ss_q2','ss_q3','bc_q1','bc_q2','bc_q3'];

function r(a) { return a[Math.floor(Math.random() * a.length)]; }
function ms() {
  const s = {};
  qK.forEach(k => { s[k] = Math.random() > 0.3 ? 1 : 0; });
  return s;
}

const lines = [
  '// Auto-generated visits from 195 Excel locations',
  'const today = new Date().toISOString().slice(0, 10)',
  '',
  'export const mockVisits = ['
];

active.forEach((loc, i) => {
  const st = i < active.length * 0.5 ? '\u0645\u0643\u062a\u0645\u0644\u0629' : i < active.length * 0.75 ? '\u0645\u0639\u0644\u0642\u0629' : '\u0642\u0627\u062f\u0645\u0629';
  const dd = Math.floor(Math.random() * 7);
  const sc = st === '\u0645\u0643\u062a\u0645\u0644\u0629' ? JSON.stringify(ms()) : '{}';
  const pts = st === '\u0645\u0643\u062a\u0645\u0644\u0629' ? Math.floor(Math.random() * 80 + 40) : 0;
  const n = st === '\u0645\u0643\u062a\u0645\u0644\u0629' ? '\u062a\u0645 \u0627\u0644\u062a\u0642\u064a\u064a\u0645 \u0628\u0646\u062c\u0627\u062d' : '';
  const id = 'v-' + String(i + 1).padStart(3, '0');
  const mid = 'CB-' + String(10001 + i);

  lines.push(`  {`);
  lines.push(`    id: '${id}', office_name: '${loc.name}', city: '${loc.city}', type: '${loc.brand}',`);
  lines.push(`    brand: '${loc.brand}', status: '${st}', scenario: '${r(scns)}',`);
  lines.push(`    membership_id: '${mid}', shopper_id: '${r(sids)}',`);
  lines.push(`    visit_date: new Date(Date.now() - ${dd} * 86400000).toISOString(),`);
  lines.push(`    scores: ${sc}, notes: '${n}',`);
  lines.push(`    points_earned: ${pts}, file_urls: [],`);
  lines.push(`  },`);
});

lines.push(']');

fs.writeFileSync('f:/Demo Dashboard chessboard/src/data/generatedVisits.js', lines.join('\n'));
console.log('Generated', active.length, 'visits');
