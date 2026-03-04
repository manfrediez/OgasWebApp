const XLSX = require('xlsx');
const wb = XLSX.readFile('/Users/eze/Downloads/PITU.xlsx');

const map = new Map(); // name -> url (deduped, last wins)

for (const sheetName of wb.SheetNames) {
  const sheet = wb.Sheets[sheetName];
  for (const cellRef in sheet) {
    if (cellRef[0] === '!') continue;
    const cell = sheet[cellRef];
    if (cell && cell.l && cell.l.Target) {
      const target = cell.l.Target;
      if (target.includes('youtube') || target.includes('youtu.be')) {
        const name = (cell.v || '').toString().trim().toUpperCase();
        if (name && name.length > 1) {
          // Skip generic entries like "15/12/10/8", "RIR: 2", "20 TOTAL", timer formats
          if (/^\d/.test(name) || name.startsWith('RIR') || name.includes('TIMER') || name.includes('VUELTAS') || name.includes('X')) continue;
          map.set(name, target);
        }
      }
    }
  }
}

// Sort and print
const entries = [...map.entries()].sort((a, b) => a[0].localeCompare(b[0]));
console.log(`Unique exercises with YouTube links: ${entries.length}\n`);
for (const [name, url] of entries) {
  console.log(`${name} -> ${url}`);
}
