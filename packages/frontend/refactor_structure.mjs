import fs from 'fs';
import path from 'path';

const dirPath = './src/components';

const mappings = [
  // Text sizes
  { regex: /text-\[11px\]/g, replacement: 'text-xs' },
  { regex: /text-\[12px\]/g, replacement: 'text-xs' },
  { regex: /text-\[13px\]/g, replacement: 'text-sm' },
  { regex: /text-\[14px\]/g, replacement: 'text-sm' },
  { regex: /text-\[15px\]/g, replacement: 'text-base' },
  { regex: /text-\[16px\]/g, replacement: 'text-base' },
  { regex: /text-\[18px\]/g, replacement: 'text-lg' },
  { regex: /text-\[20px\]/g, replacement: 'text-xl' },
  { regex: /text-\[24px\]/g, replacement: 'text-2xl' },
  { regex: /text-\[30px\]/g, replacement: 'text-3xl' },
  { regex: /text-\[32px\]/g, replacement: 'text-3xl' },
  { regex: /text-\[36px\]/g, replacement: 'text-4xl' },
  // Tracking
  { regex: /tracking-\[0\.2em\]/g, replacement: 'tracking-widest' },
  // Border Radius
  { regex: /rounded-\[2px\]/g, replacement: 'rounded-sm' },
  { regex: /rounded-\[3px\]/g, replacement: 'rounded-sm' },
  { regex: /rounded-\[4px\]/g, replacement: 'rounded-sm' },
  { regex: /rounded-\[6px\]/g, replacement: 'rounded-md' },
  { regex: /rounded-\[8px\]/g, replacement: 'rounded-lg' },
  { regex: /rounded-\[10px\]/g, replacement: 'rounded-lg' },
  { regex: /rounded-\[12px\]/g, replacement: 'rounded-xl' },
  { regex: /rounded-\[16px\]/g, replacement: 'rounded-2xl' },
  { regex: /rounded-\[20px\]/g, replacement: 'rounded-3xl' },
  { regex: /rounded-\[24px\]/g, replacement: 'rounded-3xl' },
  { regex: /rounded-\[32px\]/g, replacement: 'rounded-3xl' },
];

function processDirectory(directory) {
  const files = fs.readdirSync(directory);
  for (const file of files) {
    const fullPath = path.join(directory, file);
    const stat = fs.statSync(fullPath);
    if (stat.isDirectory()) {
      processDirectory(fullPath);
    } else if (fullPath.endsWith('.tsx') || fullPath.endsWith('.ts')) {
      let content = fs.readFileSync(fullPath, 'utf8');
      let originalContent = content;
      for (const { regex, replacement } of mappings) {
        content = content.replace(regex, replacement);
      }
      if (content !== originalContent) {
        fs.writeFileSync(fullPath, content, 'utf8');
        console.log(`Updated: ${fullPath}`);
      }
    }
  }
}

processDirectory(dirPath);
console.log('Done refactoring structure!');
