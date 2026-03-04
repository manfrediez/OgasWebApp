const XLSX = require('xlsx');
const wb = XLSX.readFile('/Users/eze/Downloads/PITU.xlsx');

for (const name of wb.SheetNames) {
  const sheet = wb.Sheets[name];
  const json = XLSX.utils.sheet_to_json(sheet, { header: 1 });

  let hasYoutube = false;

  // Check cell values
  for (let r = 0; r < json.length; r++) {
    const row = json[r];
    if (!row) continue;
    for (let c = 0; c < row.length; c++) {
      const cell = row[c];
      if (cell && typeof cell === 'string' && (cell.includes('youtube') || cell.includes('youtu.be'))) {
        if (!hasYoutube) {
          console.log('\n=== Sheet:', name, '===');
          hasYoutube = true;
        }
        console.log(`  Row ${r}, Col ${c}: ${cell.substring(0, 150)}`);
      }
    }
  }

  // Check hyperlinks
  for (const cellRef in sheet) {
    if (cellRef[0] === '!') continue;
    const cell = sheet[cellRef];
    if (cell && cell.l && cell.l.Target) {
      const target = cell.l.Target;
      if (target.includes('youtube') || target.includes('youtu.be')) {
        if (!hasYoutube) {
          console.log('\n=== Sheet:', name, '===');
          hasYoutube = true;
        }
        console.log(`  Hyperlink ${cellRef}: "${cell.v}" -> ${target}`);
      }
    }
  }
}
