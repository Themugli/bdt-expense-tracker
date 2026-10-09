const fs = require('fs');
let content = fs.readFileSync('src/pages/DailyLedger.tsx', 'utf-8');

const oldMonthlyChildren = `<div className="relative h-[190px] w-[190px] shrink-0">
                <ResponsiveContainer width="100%" height="100%"><PieChart><Pie data={pieData} dataKey="value" nameKey="name" innerRadius={58} outerRadius={82} paddingAngle={3} stroke="none" cornerRadius={4}>{pieData.map((entry) => <Cell key={entry.name} fill={colorForCategory(entry.name, categories)} />)}</Pie><ChartTooltip content={chartTip} /></PieChart></ResponsiveContainer>
                <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center"><strong data-testid="text-category-spend-total" className="font-display text-[19px] font-bold text-[#315548]">{fmtMoney(spent)}</strong><span className="text-[10px] text-[#8a9990]">total spent</span></div>
              </div>
              <div className="flex-1 space-y-3 min-w-[50%]">`;

const newMonthlyChildren = `<div className="col-span-1 flex justify-center">
                <div className="relative h-[190px] w-[190px]">
                  <ResponsiveContainer width="100%" height="100%"><PieChart><Pie data={pieData} dataKey="value" nameKey="name" innerRadius={58} outerRadius={82} paddingAngle={3} stroke="none" cornerRadius={4}>{pieData.map((entry) => <Cell key={entry.name} fill={colorForCategory(entry.name, categories)} />)}</Pie><ChartTooltip content={chartTip} /></PieChart></ResponsiveContainer>
                  <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center"><strong data-testid="text-category-spend-total" className="font-display text-[19px] font-bold text-[#315548]">{fmtMoney(spent)}</strong><span className="text-[10px] text-[#8a9990]">total spent</span></div>
                </div>
              </div>
              <div className="col-span-1 w-full space-y-3">`;

content = content.replace(oldMonthlyChildren, newMonthlyChildren);

// Wait, the prompt also says:
// Ensure the pie chart graphic is in col-span-1 and the legend ul/div is in the other col-span-1 w-full.
// Let's double check if my oldMonthlyChildren matched anything.
// Notice that in my grep output above, the Monthly pie chart text was:
// <strong ... text-[#315548]">{fmtMoney(spent)}</strong><span ...>total spent</span>
// No dark mode classes! Wait, `text-[#315548] dark:text-[#d1dbd6]` is missing in the grep output?
// grep output: `<strong data-testid="text-category-spend-total" className="font-display text-[19px] font-bold text-[#315548]">{fmtMoney(spent)}</strong><span className="text-[10px] text-[#8a9990]">total spent</span>`
// Yes! It doesn't have the dark mode classes. That's why it didn't match my previous script.

fs.writeFileSync('src/pages/DailyLedger.tsx', content);
