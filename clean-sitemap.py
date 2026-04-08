#!/usr/bin/env python3
"""
Clean sitemap.xml: Remove duplicate ?lang= URL entries.
Keep only base URLs with their xhtml:link hreflang alternates.
Each page should appear once with hreflang links pointing to language variants.
"""
import re

sitemap_path = "/home/ubuntu/fastlygo/server/static/sitemap.xml"

with open(sitemap_path, "r", encoding="utf-8") as f:
    content = f.read()

# Split into individual <url>...</url> blocks
url_blocks = re.findall(r'  <url>.*?</url>', content, re.DOTALL)

# Filter: keep only blocks where <loc> does NOT contain ?lang=
clean_blocks = []
for block in url_blocks:
    loc_match = re.search(r'<loc>(.*?)</loc>', block)
    if loc_match:
        loc = loc_match.group(1)
        if '?lang=' not in loc:
            clean_blocks.append(block)

# Rebuild sitemap
header = '<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"\n        xmlns:xhtml="http://www.w3.org/1999/xhtml">\n'
footer = '\n</urlset>\n'

new_content = header + '\n'.join(clean_blocks) + footer

with open(sitemap_path, "w", encoding="utf-8") as f:
    f.write(new_content)

print(f"Original: {len(url_blocks)} URL entries")
print(f"Cleaned: {len(clean_blocks)} URL entries")
print(f"Removed: {len(url_blocks) - len(clean_blocks)} duplicate ?lang= entries")
