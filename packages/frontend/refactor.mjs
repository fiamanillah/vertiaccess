import fs from 'fs';
import path from 'path';

const dirPath = './src/components';

const colorMap = {
  '\\[#0047FF\\]': 'blue-600',
  '\\[#0038CC\\]': 'blue-700',
  '\\[#111827\\]': 'slate-900',
  '\\[#1E293B\\]': 'slate-800',
  '\\[#334155\\]': 'slate-700',
  '\\[#475569\\]': 'slate-600',
  '\\[#64748B\\]': 'slate-500',
  '\\[#6B7280\\]': 'slate-500',
  '\\[#94A3B8\\]': 'slate-400',
  '\\[#CBD5E1\\]': 'slate-300',
  '\\[#E2E8F0\\]': 'slate-200',
  '\\[#E6ECF5\\]': 'slate-200',
  '\\[#F1F5F9\\]': 'slate-100',
  '\\[#F8FAFC\\]': 'slate-50',
  '\\[#FFFFFF\\]': 'white',
  '\\[#fdfdff\\]': 'white',
  '\\[#f8fbff\\]': 'slate-50',
  '\\[#f5f7fb\\]': 'slate-50',
  '\\[#fbfdff\\]': 'slate-50',
  '\\[#fff9f9fc\\]': 'slate-50',
};

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

      for (const [hex, stringReplacement] of Object.entries(colorMap)) {
        // We match prefixes like bg-, text-, border-, ring-, outline-, fill-, shadow-
        const regex = new RegExp(`(bg-|text-|border-|ring-|outline-|fill-|shadow-|from-|via-|to-|hover:border-|hover:bg-|hover:text-)${hex}`, 'g');
        content = content.replace(regex, `$1${stringReplacement}`);
      }

      if (content !== originalContent) {
        fs.writeFileSync(fullPath, content, 'utf8');
        console.log(`Updated: ${fullPath}`);
      }
    }
  }
}

processDirectory(dirPath);
console.log('Done refactoring colors!');
