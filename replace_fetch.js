const fs = require('fs');
const path = require('path');

function getFiles(dir, files = []) {
  const list = fs.readdirSync(dir);
  for (const file of list) {
    const fullPath = path.join(dir, file);
    if (fs.statSync(fullPath).isDirectory()) {
      getFiles(fullPath, files);
    } else if (fullPath.endsWith('.js') || fullPath.endsWith('.jsx')) {
      files.push(fullPath);
    }
  }
  return files;
}

const allFiles = getFiles('e:/SaaS Inventory  Project/SaaS Inventory Client/src/app');
allFiles.push(...getFiles('e:/SaaS Inventory  Project/SaaS Inventory Client/src/components'));

let filesToUpdate = [];
for (const file of allFiles) {
  const content = fs.readFileSync(file, 'utf8');
  if (content.includes('fetch(') && content.includes('NEXT_PUBLIC_API_URL')) {
    filesToUpdate.push(file);
  }
}

console.log('Files to update:', filesToUpdate.length);

for (const file of filesToUpdate) {
  let content = fs.readFileSync(file, 'utf8');
  
  // Check if already updated
  if (content.includes('import { apiFetch }')) {
    console.log(`Skipping ${path.basename(file)} (already has apiFetch)`);
    continue;
  }
  
  const fileDir = path.dirname(file);
  const libDir = path.resolve('e:/SaaS Inventory  Project/SaaS Inventory Client/src/lib');
  let relativePath = path.relative(fileDir, libDir).replace(/\\/g, '/');
  if (!relativePath.startsWith('.')) relativePath = './' + relativePath;
  const importStatement = `import { apiFetch } from "${relativePath}/apiFetch";\n`;
  
  // Find a good place to insert the import
  let lines = content.split('\n');
  let lastImportIndex = -1;
  for (let i = 0; i < lines.length; i++) {
    if (lines[i].trim().startsWith('import ')) {
      lastImportIndex = i;
    }
  }
  
  if (lastImportIndex !== -1) {
    lines.splice(lastImportIndex + 1, 0, importStatement.trim());
  } else {
    // If there is "use client"; put it after that
    if (lines[0].includes('use client')) {
       lines.splice(1, 0, '', importStatement.trim());
    } else {
       lines.unshift(importStatement.trim());
    }
  }
  
  content = lines.join('\n');
  
  // Replace fetch( with apiFetch(
  content = content.replace(/\bfetch\(/g, 'apiFetch(');
  
  fs.writeFileSync(file, content);
  console.log(`Updated ${path.basename(file)}`);
}
