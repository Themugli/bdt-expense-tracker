const fs = require('fs');

let dailyLedgerContent = fs.readFileSync('src/pages/DailyLedger.tsx', 'utf-8');

const oldHeaderP = '<p className="mb-2 text-sm font-medium text-[#789086] dark:text-[#88a096]">A little more clarity, every day.</p>';
const newHeaderP = '<p className="text-sm text-slate-400 mb-1">A little more clarity, every day.</p>';

const oldHeaderH1 = '<h1 className="font-display text-[32px] font-bold leading-tight tracking-[-.055em] text-[#24483c] dark:text-[#e4e9e7] sm:text-[42px]">{activeTab === \'daily\' ? <>Your money, <span className="text-[#d78967]">today.</span></> : activeTab === \'monthly\' ? <>Your money, <span className="text-[#d78967]">this month.</span></> : <>A year in <span className="text-[#d78967]">perspective.</span></>}</h1>';
const newHeaderH1 = '<h1 className="text-4xl md:text-5xl font-extrabold tracking-tight text-[#294d40] dark:text-white">{activeTab === \'daily\' ? <>Your money, <span className="text-[#d78967]">today.</span></> : activeTab === \'monthly\' ? <>Your money, <span className="text-[#d78967]">this month.</span></> : <>A year in <span className="text-[#d78967]">perspective.</span></>}</h1>';

dailyLedgerContent = dailyLedgerContent.replace(oldHeaderP, newHeaderP);
dailyLedgerContent = dailyLedgerContent.replace(oldHeaderH1, newHeaderH1);

fs.writeFileSync('src/pages/DailyLedger.tsx', dailyLedgerContent);
