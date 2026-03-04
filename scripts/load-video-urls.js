/**
 * One-shot script: carga videoUrl de ejercicios desde PITU.xlsx a MongoDB.
 *
 * Uso:
 *   node scripts/load-video-urls.js path/to/PITU.xlsx
 *
 * El Excel debe tener una columna con nombres de ejercicios que contengan
 * hyperlinks a YouTube. El script extrae el map nombre→URL y actualiza
 * los ejercicios que matcheen (case-insensitive) en la colección
 * strengthcircuits de producción.
 */

const XLSX = require('xlsx');
const { MongoClient } = require('mongodb');

const MONGO_URI =
  process.env.MONGODB_URI ||
  'mongodb+srv://manfrediez_db_user:miPassword123@cluster0.viyecgm.mongodb.net/ogas-web?appName=Cluster0';

async function main() {
  const xlsxPath = process.argv[2];
  if (!xlsxPath) {
    console.error('Uso: node scripts/load-video-urls.js <path-to-PITU.xlsx>');
    process.exit(1);
  }

  // 1. Leer Excel y extraer mapa ejercicio → videoUrl
  const workbook = XLSX.readFile(xlsxPath);
  const videoMap = new Map(); // nombre lowercase → url

  for (const sheetName of workbook.SheetNames) {
    const sheet = workbook.Sheets[sheetName];
    if (!sheet) continue;

    const range = XLSX.utils.decode_range(sheet['!ref'] || 'A1');
    for (let row = range.s.r; row <= range.e.r; row++) {
      for (let col = range.s.c; col <= range.e.c; col++) {
        const addr = XLSX.utils.encode_cell({ r: row, c: col });
        const cell = sheet[addr];
        if (!cell) continue;

        // Buscar celdas con hyperlink que apunten a youtube
        const link = cell.l?.Target || '';
        if (link && link.includes('youtube')) {
          const name = String(cell.v || '').trim();
          if (name) {
            videoMap.set(name.toLowerCase(), link);
          }
        }
      }
    }
  }

  console.log(`Encontrados ${videoMap.size} ejercicios con video en el Excel:`);
  for (const [name, url] of videoMap) {
    console.log(`  - ${name} → ${url}`);
  }

  if (videoMap.size === 0) {
    console.log('No se encontraron ejercicios con links de YouTube. Saliendo.');
    process.exit(0);
  }

  // 2. Conectar a MongoDB y actualizar
  const client = new MongoClient(MONGO_URI);
  await client.connect();
  const db = client.db();
  const collection = db.collection('strengthcircuits');

  const circuits = await collection.find({}).toArray();
  console.log(`\nCircuitos en la DB: ${circuits.length}`);

  let updated = 0;
  for (const circuit of circuits) {
    let changed = false;
    for (const ex of circuit.exercises || []) {
      const key = (ex.name || '').trim().toLowerCase();
      if (videoMap.has(key) && !ex.videoUrl) {
        ex.videoUrl = videoMap.get(key);
        changed = true;
        updated++;
        console.log(`  ✓ ${ex.name} → ${ex.videoUrl}`);
      }
    }
    if (changed) {
      await collection.updateOne(
        { _id: circuit._id },
        { $set: { exercises: circuit.exercises } },
      );
    }
  }

  console.log(`\nEjercicios actualizados: ${updated}`);
  await client.close();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
