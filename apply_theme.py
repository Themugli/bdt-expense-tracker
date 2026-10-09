import re
import os
import glob

def process_file(filepath):
    with open(filepath, 'r') as f:
        content = f.read()

    # 4. Unify the Accent Colors
    # Primary buttons and CTAs -> bg-emerald-600 hover:bg-emerald-700 dark:hover:bg-emerald-500 text-white
    content = content.replace('bg-[#d78967]', 'bg-emerald-600')
    content = content.replace('bg-[#c2795a]', 'bg-emerald-700')
    content = content.replace('hover:bg-[#c2795a]', 'hover:bg-emerald-700 dark:hover:bg-emerald-500')
    content = content.replace('text-[#d78967]', 'text-emerald-600 dark:text-emerald-500')
    
    # Existing sage greens
    content = content.replace('bg-[#347d68]', 'bg-emerald-600')
    content = content.replace('hover:bg-[#2d705d]', 'hover:bg-emerald-700 dark:hover:bg-emerald-500')
    content = content.replace('text-[#347d68]', 'text-emerald-600 dark:text-emerald-500')

    # Global Canvas logic (for index.html and root divs, we can do some manually, but let's replace common body classes)
    content = content.replace('bg-[#0e1116]', 'bg-[#F5F5F7] dark:bg-black')
    content = content.replace('bg-[#f3f4ed]', 'bg-[#F5F5F7] dark:bg-black')
    # Actually, the user asked for:
    # Global Canvas: bg-[#F5F5F7] text-zinc-900 dark:bg-black dark:text-[#F5F5F7]
    # Surface Frames: bg-white border-zinc-200 dark:bg-[#0a0a0a] dark:border-white/10
    # Inner Cards: bg-white shadow-sm border-zinc-100 dark:bg-[#1C1C1E] dark:border-white/10 dark:shadow-none
    # Inputs: bg-zinc-50 border-zinc-200 text-zinc-900 dark:bg-[#09090b] dark:border-white/10 dark:text-[#F5F5F7]

    # Replacing some common existing colors with new classes:
    
    # Inputs
    content = content.replace('bg-[#fffdf8]', 'bg-zinc-50')
    content = content.replace('dark:bg-[#1e2a26]/75', 'dark:bg-[#09090b]')
    content = content.replace('border-[#dce5dc]', 'border-zinc-200')
    content = content.replace('dark:border-[#384f46]', 'dark:border-white/10')
    content = content.replace('text-[#4d6c5e]', 'text-zinc-900')
    content = content.replace('dark:text-[#aabcb3]', 'dark:text-[#F5F5F7]')

    # Surface Frames (often these were glass-cards, etc.)
    # Let's replace "glass-card" and others
    content = content.replace('bg-white/95', 'bg-white dark:bg-[#0a0a0a]')
    
    # Inner Cards
    content = content.replace('bg-[#fbfaf5]/80', 'bg-white shadow-sm border border-zinc-100 dark:bg-[#1C1C1E] dark:border-white/10 dark:shadow-none')
    content = content.replace('bg-[#f4f5ef]', 'bg-white shadow-sm border-zinc-100 dark:bg-[#1C1C1E] dark:border-white/10 dark:shadow-none')
    content = content.replace('dark:bg-[#23312c]/80', 'dark:bg-[#1C1C1E] dark:border-white/10 dark:shadow-none')
    
    with open(filepath, 'w') as f:
        f.write(content)

for filepath in glob.glob('src/**/*.tsx', recursive=True):
    process_file(filepath)
