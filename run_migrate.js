const Database = require('better-sqlite3');
const fs = require('fs');
try {
  const db = new Database('/data/gym.db');
  console.log('Connected to /data/gym.db');
  const sql = fs.readFileSync('/app/init.sql', 'utf8');
  db.exec(sql);
  console.log('Migration successfully executed!');
} catch (e) {
  console.error('Migration failed:', e);
  process.exit(1);
}
