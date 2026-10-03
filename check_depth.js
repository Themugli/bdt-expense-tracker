const fs = require('fs');
const code = fs.readFileSync('artifacts/expense-tracker/src/App.tsx', 'utf-8');
const lines = code.split('\n');
let depth = 0;
for (let i = 135; i <= 583; i++) {
  const line = lines[i] || '';
  for (const char of line) {
    if (char === '{') depth++;
    if (char === '}') depth--;
  }
  if (depth > 2 || depth < 1) {
     // log interesting changes
     // console.log(i+1, depth, line.trim());
  }
}
console.log('Final depth:', depth);
let d = 0;
for(let i=135; i<= 583; i++) {
  const line = lines[i] || '';
  let start = d;
  for (const char of line) {
    if (char === '{') d++;
    if (char === '}') d--;
  }
  if (d !== start) {
    console.log(i+1, d, line.substring(0, 50));
  }
}
