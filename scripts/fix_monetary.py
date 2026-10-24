import os
import re

directories = ['src/pages', 'src/components']

muddy_greens = ['text-[#355a4d]', 'text-[#294d40]', 'text-[#315548]', 'text-[#24483c]']

def process_file(filepath):
    with open(filepath, 'r') as f:
        content = f.read()

    original_content = content
    
    # 1. We want to find any JSX tag that formats money: `fmtMoney(...)` or `৳`
    # We can do this line by line or by tags.
    # It's easier to just match the entire className string if the line contains fmtMoney or ৳
    
    lines = content.split('\n')
    for i, line in enumerate(lines):
        if 'fmtMoney' in line or '৳' in line or 'activeIncome' in line or 'usage}%' in line or 'todayUsage' in line:
            # check if it has a muddy green text
            for mg in muddy_greens:
                if mg in line:
                    # Replace existing dark:text-[...] if it exists
                    line = re.sub(r'dark:text-\[[^\]]+\]', 'dark:text-emerald-500', line)
                    # If it didn't have a dark:text-..., we add it after the muddy green
                    if 'dark:text-emerald-500' not in line:
                        line = line.replace(mg, f'{mg} dark:text-emerald-500')
                    lines[i] = line
                    
            # Also check for text-emerald-800 or text-emerald-900 or text-green-800
            for dg in ['text-emerald-800', 'text-emerald-900', 'text-green-800', 'text-green-900']:
                if dg in line:
                    line = re.sub(r'dark:text-\[[^\]]+\]', 'dark:text-emerald-500', line)
                    if 'dark:text-emerald-500' not in line:
                        line = line.replace(dg, f'{dg} dark:text-emerald-500')
                    lines[i] = line

    content = '\n'.join(lines)
    
    # Let's also do a blanket replacement for specific known monetary test ids
    test_ids = [
        'text-detail-income', 'text-detail-spent', 'text-year-total', 'text-year-average',
        'text-detail-daily-income', 'text-detail-daily-spent', 'text-category-spend-total',
        'text-donut-amount-', 'text-expense-amount-', 'text-monthly-allowance', 'text-monthly-spent'
    ]
    for tid in test_ids:
        # Regex to find className inside the tag that has this testid
        # Note: this is a bit tricky with python regex, let's just do it manually
        pass
        
    if original_content != content:
        with open(filepath, 'w') as f:
            f.write(content)
        print(f"Updated {filepath}")

for root, _, files in os.walk('src'):
    for file in files:
        if file.endswith('.tsx') or file.endswith('.ts'):
            process_file(os.path.join(root, file))
