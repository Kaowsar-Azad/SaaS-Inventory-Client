const fs = require('fs');

const filesToFix = [
  './src/app/dashboard/damages/page.js',
  './src/app/dashboard/page.js',
  './src/app/dashboard/pos/page.js',
  './src/app/dashboard/reports/financial/page.js',
  './src/app/dashboard/reports/page.js',
  './src/app/dashboard/reports/warehouses/page.js',
  './src/app/dashboard/returns/page.js'
];

for (const file of filesToFix) {
  let content = fs.readFileSync(file, 'utf8');
  
  // Extract the apiFetch import line
  const match = content.match(/import\s+{\s*apiFetch\s*}\s+from\s+['"][^'"]+apiFetch['"];\n?/);
  if (match) {
    const apiFetchImport = match[0];
    
    // Remove it from its current broken position
    content = content.replace(apiFetchImport, '');
    
    // Insert it safely at the top, just after "use client" if it exists
    if (content.includes('"use client";')) {
      content = content.replace('"use client";', '"use client";\n' + apiFetchImport);
    } else {
      content = apiFetchImport + content;
    }
    
    fs.writeFileSync(file, content);
    console.log(`Fixed ${file}`);
  } else {
    console.log(`Could not find apiFetch import in ${file}`);
  }
}
