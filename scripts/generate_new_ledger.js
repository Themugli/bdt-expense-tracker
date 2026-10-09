const fs = require('fs');
let content = fs.readFileSync('src/pages/DailyLedger.tsx', 'utf-8');

const iifeStr = content.substring(content.indexOf('{(() => {\n            const formContent = ('), content.indexOf('})()}\n\n          <section className="glass-card rounded-[24px] p-5 sm:p-6">\n            <div className="mb-4 flex items-end justify-between"><div><p className="mb-1 text-xs font-semibold uppercase tracking-[.12em] text-[#9a8c77]">The shape of your spending</p>') + 5);

content = content.replace(iifeStr, "");

fs.writeFileSync('src/pages/DailyLedger_temp.tsx', content);
