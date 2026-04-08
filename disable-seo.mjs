#!/usr/bin/env node
import fs from 'fs';
import path from 'path';

/**
 * Post-build script: Ensure our custom sitemap.xml and robots.txt
 * are preserved in the dist/public folder for production serving.
 * 
 * Previously this script was DELETING these files, which caused
 * Manus platform to generate its own minimal versions.
 * Now it COPIES our custom files from server/static/ to dist/public/.
 */

const distPublicPath = path.resolve('./dist/public');
const serverStaticPath = path.resolve('./server/static');

console.log('\n📋 Ensuring custom SEO files are in production build...\n');

// Ensure dist/public exists
if (!fs.existsSync(distPublicPath)) {
  fs.mkdirSync(distPublicPath, { recursive: true });
}

// Copy our custom sitemap.xml and robots.txt to dist/public
const seoFiles = ['sitemap.xml', 'robots.txt'];
let copiedCount = 0;

seoFiles.forEach(fileName => {
  const sourcePath = path.join(serverStaticPath, fileName);
  const destPath = path.join(distPublicPath, fileName);
  
  if (fs.existsSync(sourcePath)) {
    fs.copyFileSync(sourcePath, destPath);
    const stats = fs.statSync(destPath);
    console.log(`✓ Copied: server/static/${fileName} → dist/public/${fileName} (${stats.size} bytes)`);
    copiedCount++;
  } else {
    console.log(`⚠ Source not found: server/static/${fileName}`);
  }
});

console.log('\n' + '='.repeat(50));
console.log(`✅ ${copiedCount} custom SEO file(s) copied to production build`);
console.log('✅ Custom sitemap.xml and robots.txt will be served in production');
console.log('='.repeat(50) + '\n');
