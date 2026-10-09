const fs = require('fs');

// 1. ConfirmModal.tsx fix
let confirmModalContent = fs.readFileSync('src/components/ui/ConfirmModal.tsx', 'utf-8');
confirmModalContent = confirmModalContent.replace(
  'className="flex-1 rounded-lg bg-slate-100 py-3 text-sm font-semibold text-slate-900 dark:text-slate-100 hover:bg-slate-200 transition"',
  'className="bg-white text-slate-900 hover:bg-slate-100 rounded-lg px-4 py-3 flex-1 text-sm font-semibold transition"'
);
fs.writeFileSync('src/components/ui/ConfirmModal.tsx', confirmModalContent);

// 2. LoanTracker.tsx typography fix
let loanTrackerContent = fs.readFileSync('src/pages/LoanTracker.tsx', 'utf-8');
const oldLoanHeader = `          <div>
            <h1 className="font-display text-[32px] font-extrabold tracking-[-.045em] text-[#24483c] dark:text-[#e4e9e7]">
              Loan Tracker
            </h1>
            <p className="text-sm text-[#597369] dark:text-[#9bb0a6] mt-2">Manage your payables and receivables</p>
          </div>`;
const newLoanHeader = `          <div>
            <p className="text-sm text-slate-400 mb-1">Manage your payables</p>
            <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight text-[#294d40] dark:text-white">
              Loan <span className="text-[#d78967]">Tracker.</span>
            </h1>
          </div>`;
loanTrackerContent = loanTrackerContent.replace(oldLoanHeader, newLoanHeader);
fs.writeFileSync('src/pages/LoanTracker.tsx', loanTrackerContent);

// 3. DailyLedger.tsx pie chart fix
let dailyLedgerContent = fs.readFileSync('src/pages/DailyLedger.tsx', 'utf-8');

// The pie chart wrapper currently looks like this (from previous patch):
// <div className="grid grid-cols-2 gap-8 items-center w-full">
//   <div className="col-span-1 flex justify-center">

// We need to replace it with:
// className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center w-full"
// for the parent. Wait, the previous patch already did `<div className="grid grid-cols-2 gap-8 items-center w-full">`
// Let's just replace `grid-cols-2` with `grid-cols-1 md:grid-cols-2` on the main wrapper.

dailyLedgerContent = dailyLedgerContent.replaceAll(
  '<div className="grid grid-cols-2 gap-8 items-center w-full">',
  '<div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center w-full">'
);

// Wait, the prompt also says:
// "Remove any max-w-sm or fixed widths that are preventing the legend from stretching across the right side of the card."
// Let's check if there are any max-w-sm or fixed widths on the legend.
// In the old code it was:
// `<div className="col-span-1 w-full space-y-3">`
// Is there a max-w-sm anywhere?
// Let's remove any max-w-sm from the card itself.
// `<div className="rounded-2xl bg-[#f4f5ef] dark:bg-[#23312c]/80 p-5 mt-4">` -> it doesn't have max-w-sm.
// Let's just make sure we did it right.

fs.writeFileSync('src/pages/DailyLedger.tsx', dailyLedgerContent);
