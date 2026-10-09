import os
import re

# Mapping of hardcoded hex values to dark equivalents
hex_mapping = {
    # Backgrounds
    "bg-[#f4f4ec]": "bg-[#f4f4ec] dark:bg-[#121b18]",
    "bg-[#fcfcf9]": "bg-[#fcfcf9] dark:bg-[#1a2622]",
    "bg-[#fffdf8]": "bg-[#fffdf8] dark:bg-[#1e2a26]",
    "bg-[#edf1e8]": "bg-[#edf1e8] dark:bg-[#253630]",
    "bg-[#edf2e9]": "bg-[#edf2e9] dark:bg-[#253630]",
    "bg-[#f4f5ef]": "bg-[#f4f5ef] dark:bg-[#23312c]",
    "bg-[#fbfaf5]": "bg-[#fbfaf5] dark:bg-[#1a2622]",
    "bg-[#f3f4ed]": "bg-[#f3f4ed] dark:bg-[#1d2a25]",
    "bg-[#e6ebe3]": "bg-[#e6ebe3] dark:bg-[#2c3f38]",
    "bg-[#dce9dc]": "bg-[#dce9dc] dark:bg-[#344c43]",
    "bg-[#fae9e4]": "bg-[#fae9e4] dark:bg-[#3a221f]",
    "bg-[#fae5df]": "bg-[#fae5df] dark:bg-[#3a221f]",
    "bg-[#f6edcf]": "bg-[#f6edcf] dark:bg-[#3a331c]",
    "bg-[#e1eee2]": "bg-[#e1eee2] dark:bg-[#1c382a]",
    "bg-white": "bg-white dark:bg-[#1a2622]",
    "bg-[#fffaf0]": "bg-[#fffaf0] dark:bg-[#1a2622]",
    "bg-[#f8f7f2]": "bg-[#f8f7f2] dark:bg-[#1a2622]",
    "bg-[#24483c]/20": "bg-[#24483c]/20 dark:bg-black/40",

    # Text Colors
    "text-[#24483c]": "text-[#24483c] dark:text-[#e4e9e7]",
    "text-[#315548]": "text-[#315548] dark:text-[#d1dbd6]",
    "text-[#355a4d]": "text-[#355a4d] dark:text-[#d1dbd6]",
    "text-[#4d6c5e]": "text-[#4d6c5e] dark:text-[#aabcb3]",
    "text-[#597369]": "text-[#597369] dark:text-[#9bb0a6]",
    "text-[#789086]": "text-[#789086] dark:text-[#88a096]",
    "text-[#819087]": "text-[#819087] dark:text-[#88a096]",
    "text-[#8a9990]": "text-[#8a9990] dark:text-[#88a096]",
    "text-[#71857a]": "text-[#71857a] dark:text-[#88a096]",
    "text-[#768980]": "text-[#768980] dark:text-[#88a096]",
    "text-[#86968c]": "text-[#86968c] dark:text-[#88a096]",
    "text-[#93a097]": "text-[#93a097] dark:text-[#7b9087]",
    "text-[#a6b1a9]": "text-[#a6b1a9] dark:text-[#6a7f76]",
    "text-[#7f9086]": "text-[#7f9086] dark:text-[#88a096]",
    "text-slate-500": "text-slate-500 dark:text-slate-400",
    "text-slate-900": "text-slate-900 dark:text-slate-100",

    # Borders
    "border-[#dce5dc]": "border-[#dce5dc] dark:border-[#384f46]",
    "border-[#cbdace]": "border-[#cbdace] dark:border-[#384f46]",
    "border-white/80": "border-white/80 dark:border-white/10",
    "border-white/70": "border-white/70 dark:border-white/10",
    "border-[#edf0e9]": "border-[#edf0e9] dark:border-[#2a3c35]",

    # Hover States
    "hover:bg-[#edf2e9]": "hover:bg-[#edf2e9] dark:hover:bg-[#344a42]",
    "hover:bg-[#edf1e8]": "hover:bg-[#edf1e8] dark:hover:bg-[#344a42]",
    "hover:bg-[#f4f5ef]": "hover:bg-[#f4f5ef] dark:hover:bg-[#2a3c35]",
    "hover:bg-[#fae9e4]": "hover:bg-[#fae9e4] dark:hover:bg-[#4a2b27]",
}

def process_file(filepath):
    with open(filepath, 'r') as f:
        content = f.read()

    new_content = content
    for old, new in hex_mapping.items():
        # Using a regex to replace exact class matches (avoiding double replacing)
        # We need to ensure we don't replace things that already have dark: prefix
        # Wait, simple replace is okay if we do it carefully, but let's just use string replace.
        new_content = new_content.replace(old, new)
        
    # Fix double replaces if script is run twice or if "bg-white" matched inside "hover:bg-white"
    new_content = new_content.replace("hover:bg-white dark:bg-[#1a2622]", "hover:bg-white dark:hover:bg-[#1a2622]")
    new_content = new_content.replace("bg-white dark:bg-[#1a2622]/", "bg-white/") # fix alpha transparency on white
    new_content = new_content.replace("dark:bg-[#1a2622] dark:bg-[#1a2622]", "dark:bg-[#1a2622]")

    if content != new_content:
        with open(filepath, 'w') as f:
            f.write(new_content)
        print(f"Updated {filepath}")

for root, _, files in os.walk('src'):
    for file in files:
        if file.endswith('.tsx'):
            process_file(os.path.join(root, file))
