const fs = require('fs');
const code = fs.readFileSync('artifacts/expense-tracker/src/App.tsx', 'utf-8');

let stack = [];
for (let i = 0; i < code.length; i++) {
  const char = code[i];
  if (char === '{') {
    stack.push(i);
  } else if (char === '}') {
    if (stack.length === 0) {
      console.log('Extra } at index', i);
    } else {
      stack.pop();
    }
  }
}

if (stack.length > 0) {
  console.log('Unclosed { at indices:', stack.map(i => {
    // get line number
    const line = code.substring(0, i).split('\n').length;
    return `Line ${line}`;
  }));
} else {
  console.log('Balanced!');
}
