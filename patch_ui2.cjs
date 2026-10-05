const fs = require('fs');
let content = fs.readFileSync('src/pages/DailyLedger.tsx', 'utf-8');

// 1. Fix Available Budget in the Daily Detail Card
// We need to find the card that says "Available Budget" and replace `{fmtMoney(startOfDayBudget)}` with `{fmtMoney(remaining)}`
content = content.replace(
  '<p className="text-xs text-[#819087] dark:text-[#88a096]">Available Budget</p><p data-testid="text-detail-daily-income" className="mt-1 font-display text-xl font-bold text-[#355a4d] dark:text-[#d1dbd6]">{fmtMoney(startOfDayBudget)}</p>',
  '<p className="text-xs text-[#819087] dark:text-[#88a096]">Available Budget</p><p data-testid="text-detail-daily-income" className="mt-1 font-display text-xl font-bold text-[#355a4d] dark:text-[#d1dbd6]">{fmtMoney(remaining)}</p>'
);

// 2. Fix Pie Chart Layout (Grid Fix)
// The current pie chart wrapper is: `<div className="w-full flex flex-row items-center justify-between gap-4">`
// We need to replace it with `<div className="grid grid-cols-2 gap-8 items-center w-full">`
// Then the pie chart itself: `<div className="relative h-[190px] w-[190px] shrink-0">`
// needs to be wrapped in `<div className="col-span-1 flex justify-center"><div className="relative h-[190px] w-[190px]">...</div></div>`
// The legend: `<div className="flex-1 space-y-3 min-w-[50%]">`
// needs to be `<div className="col-span-1 w-full space-y-3">`

// Let's do this with standard string replacement since there are two instances (one in daily, one in monthly).

// Wait, the daily one has `todayPieData` and the monthly one has `pieData`.
// Daily pie chart wrapper:
const oldDailyPie = `<div className="w-full flex flex-row items-center justify-between gap-4">
              <div className="relative h-[190px] w-[190px] shrink-0">
                <ResponsiveContainer width="100%" height="100%"><PieChart><Pie data={todayPieData} dataKey="value" nameKey="name" innerRadius={58} outerRadius={82} paddingAngle={3} stroke="none" cornerRadius={4}>{todayPieData.map((entry) => <Cell key={entry.name} fill={colorForCategory(entry.name, categories)} />)}</Pie><ChartTooltip content={chartTip} /></PieChart></ResponsiveContainer>
                <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center"><strong data-testid="text-category-spend-total" className="font-display text-[19px] font-bold text-[#315548] dark:text-[#d1dbd6]">{fmtMoney(todaySpent)}</strong><span className="text-[10px] text-[#8a9990] dark:text-[#88a096]">total spent</span></div>
              </div>
              <div className="flex-1 space-y-3 min-w-[50%]">`;

const newDailyPie = `<div className="grid grid-cols-2 gap-8 items-center w-full">
              <div className="col-span-1 flex justify-center">
                <div className="relative h-[190px] w-[190px]">
                  <ResponsiveContainer width="100%" height="100%"><PieChart><Pie data={todayPieData} dataKey="value" nameKey="name" innerRadius={58} outerRadius={82} paddingAngle={3} stroke="none" cornerRadius={4}>{todayPieData.map((entry) => <Cell key={entry.name} fill={colorForCategory(entry.name, categories)} />)}</Pie><ChartTooltip content={chartTip} /></PieChart></ResponsiveContainer>
                  <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center"><strong data-testid="text-category-spend-total" className="font-display text-[19px] font-bold text-[#315548] dark:text-[#d1dbd6]">{fmtMoney(todaySpent)}</strong><span className="text-[10px] text-[#8a9990] dark:text-[#88a096]">total spent</span></div>
                </div>
              </div>
              <div className="col-span-1 w-full space-y-3">`;

content = content.replace(oldDailyPie, newDailyPie);

// Monthly pie chart wrapper:
const oldMonthlyPie = `<div className="w-full flex flex-row items-center justify-between gap-4">
              <div className="relative h-[190px] w-[190px] shrink-0">
                <ResponsiveContainer width="100%" height="100%"><PieChart><Pie data={pieData} dataKey="value" nameKey="name" innerRadius={58} outerRadius={82} paddingAngle={3} stroke="none" cornerRadius={4}>{pieData.map((entry) => <Cell key={entry.name} fill={colorForCategory(entry.name, categories)} />)}</Pie><ChartTooltip content={chartTip} /></PieChart></ResponsiveContainer>
                <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center"><strong data-testid="text-category-spend-total" className="font-display text-[19px] font-bold text-[#315548] dark:text-[#d1dbd6]">{fmtMoney(totalSpent)}</strong><span className="text-[10px] text-[#8a9990] dark:text-[#88a096]">total spent</span></div>
              </div>
              <div className="flex-1 space-y-3 min-w-[50%]">`;

const newMonthlyPie = `<div className="grid grid-cols-2 gap-8 items-center w-full">
              <div className="col-span-1 flex justify-center">
                <div className="relative h-[190px] w-[190px]">
                  <ResponsiveContainer width="100%" height="100%"><PieChart><Pie data={pieData} dataKey="value" nameKey="name" innerRadius={58} outerRadius={82} paddingAngle={3} stroke="none" cornerRadius={4}>{pieData.map((entry) => <Cell key={entry.name} fill={colorForCategory(entry.name, categories)} />)}</Pie><ChartTooltip content={chartTip} /></PieChart></ResponsiveContainer>
                  <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center"><strong data-testid="text-category-spend-total" className="font-display text-[19px] font-bold text-[#315548] dark:text-[#d1dbd6]">{fmtMoney(totalSpent)}</strong><span className="text-[10px] text-[#8a9990] dark:text-[#88a096]">total spent</span></div>
                </div>
              </div>
              <div className="col-span-1 w-full space-y-3">`;

content = content.replace(oldMonthlyPie, newMonthlyPie);

fs.writeFileSync('src/pages/DailyLedger.tsx', content);
