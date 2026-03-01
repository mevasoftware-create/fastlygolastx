#!/usr/bin/env node
import fs from 'fs';
import path from 'path';

/**
 * This script completely disables Manus auto-generated SEO features
 * Run after build to ensure no SEO files are included in production
 */

const distPublicPath = path.resolve('./dist/public');
const distPath = path.resolve('./dist');

console.log('\n🚫 Disabling Manus SEO features...\n');

// 1. Remove all SEO-related files
const seoFiles = [
  path.join(distPublicPath, 'sitemap.xml'),
  path.join(distPublicPath, 'robots.txt'),
  path.join(distPath, 'sitemap.xml'),
  path.join(distPath, 'robots.txt'),
];

let removedCount = 0;
seoFiles.forEach(filePath => {
  if (fs.existsSync(filePath)) {
    fs.unlinkSync(filePath);
    console.log(`✓ Removed: ${path.relative('.', filePath)}`);
    removedCount++;
  }
});

// 2. Scan for any remaining SEO files in dist
function scanDirectory(dir, pattern) {
  const found = [];
  if (!fs.existsSync(dir)) return found;
  
  const files = fs.readdirSync(dir, { withFileTypes: true });
  for (const file of files) {
    const fullPath = path.join(dir, file.name);
    if (file.isDirectory()) {
      found.push(...scanDirectory(fullPath, pattern));
    } else if (pattern.test(file.name)) {
      found.push(fullPath);
    }
  }
  return found;
}

const seoPattern = /^(sitemap.*\.xml|robots\.txt)$/i;
const foundFiles = scanDirectory(distPath, seoPattern);

foundFiles.forEach(filePath => {
  if (fs.existsSync(filePath)) {
    fs.unlinkSync(filePath);
    console.log(`✓ Removed (scan): ${path.relative('.', filePath)}`);
    removedCount++;
  }
});

// 3. Summary
console.log('\n' + '='.repeat(50));
if (removedCount === 0) {
  console.log('✅ No SEO files found - Build is clean!');
} else {
  console.log(`✅ Successfully removed ${removedCount} SEO file(s)`);
}
console.log('✅ Manus SEO features are now disabled');
console.log('='.repeat(50) + '\n');
