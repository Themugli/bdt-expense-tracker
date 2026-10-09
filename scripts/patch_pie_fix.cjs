const fs = require('fs');
let content = fs.readFileSync('src/pages/DailyLedger.tsx', 'utf-8');

// For the Monthly pie chart:
// In the current code (after patch_ui3.cjs), it looks like this:
// <div className="mb-5 grid gap-5 lg:grid-cols-[.9fr_1.1fr]">
//   {editModal}
//   <section className="glass-card rounded-[24px] p-5 sm:p-6">
// ...
// </div>
// We need to remove the `<div className="mb-5 grid gap-5 lg:grid-cols-[.9fr_1.1fr]">` and just leave the section (but still render editModal).
// AND we need to remove the closing `</div>` which is at line 800.

const oldMonthlyWrapperStart = `<div className="mb-5 grid gap-5 lg:grid-cols-[.9fr_1.1fr]">
          {editModal}

          <section className="glass-card rounded-[24px] p-5 sm:p-6">`;

const newMonthlyWrapperStart = `{editModal}

          <section className="glass-card mb-5 rounded-[24px] p-5 sm:p-6 w-full">`;

content = content.replace(oldMonthlyWrapperStart, newMonthlyWrapperStart);

// Now for the closing div. The Monthly pie chart section ends with:
//               </div>
//             </div>}
//         </div>
//         <section className="glass-card mb-5 rounded-[24px] p-5 sm:p-6">
// We need to remove that `</div>`.

const oldMonthlyWrapperEnd = `              </div>
            </div>}
        </div>

        <section className="glass-card mb-5 rounded-[24px] p-5 sm:p-6">
          <div className="mb-4 flex flex-wrap items-end justify-between gap-2"><div><p className="mb-1 text-xs font-semibold uppercase tracking-[.12em] text-[#9a8c77]">One day at a time</p><h2 className="font-display text-[21px] font-bold tracking-[-.04em] text-[#294d40]">Daily rhythm</h2></div>`;

const newMonthlyWrapperEnd = `              </div>
            </div>}
        </section>

        <section className="glass-card mb-5 rounded-[24px] p-5 sm:p-6">
          <div className="mb-4 flex flex-wrap items-end justify-between gap-2"><div><p className="mb-1 text-xs font-semibold uppercase tracking-[.12em] text-[#9a8c77]">One day at a time</p><h2 className="font-display text-[21px] font-bold tracking-[-.04em] text-[#294d40]">Daily rhythm</h2></div>`;

content = content.replace(oldMonthlyWrapperEnd, newMonthlyWrapperEnd);

// Finally, let's make sure the inner pie chart grid is correct for BOTH Daily and Monthly:
// It should be `<div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center w-full">`
// Let's check Daily view.
content = content.replaceAll(
  '<div className="w-full flex flex-row items-center justify-between gap-4">',
  '<div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center w-full">'
);

fs.writeFileSync('src/pages/DailyLedger.tsx', content);
