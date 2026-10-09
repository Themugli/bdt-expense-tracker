const fs = require('fs');
let dailyLedgerContent = fs.readFileSync('src/pages/DailyLedger.tsx', 'utf-8');

// The Monthly pie chart wrapper issue:
// <div className="mb-5 grid gap-5 lg:grid-cols-[.9fr_1.1fr]">
//   {editModal}
//   <section className="glass-card rounded-[24px] p-5 sm:p-6">
// ...
// </div>
// It should just be:
// {editModal}
// <section className="glass-card mb-5 rounded-[24px] p-5 sm:p-6">

const oldMonthlyWrapper = `<div className="mb-5 grid gap-5 lg:grid-cols-[.9fr_1.1fr]">
          {editModal}

          <section className="glass-card rounded-[24px] p-5 sm:p-6">`;

const newMonthlyWrapper = `{editModal}

          <section className="glass-card mb-5 rounded-[24px] p-5 sm:p-6">`;

dailyLedgerContent = dailyLedgerContent.replace(oldMonthlyWrapper, newMonthlyWrapper);

// We also need to remove the closing </div> of that grid wrapper.
// Let's find where the grid ends in the Monthly view.
// It ends after the section.
//           </section>
//         </div>
//       </div>
//     );

// It's probably easier to just replace that specific `</div>` by looking at the context.
// Let's do a more precise replacement for the closing tag.
