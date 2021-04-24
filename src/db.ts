import Database from 'better-sqlite3';
import constants from "./constants";

const fs = require('fs');
const path = require('path');

const db = new Database(constants.dbPath);
db.pragma('foreign_keys = ON');

const version = db.pragma('user_version', { simple: true });
if (version === 0) {
    console.log('Updating the database schema...');
    const sql = fs.readFileSync(path.resolve(__dirname, '../sql/init_database.sql'), 'utf-8');
    db.transaction(() => db.exec(sql)).immediate();
    require('./migrations/migration0').default(db);
}

export default db;