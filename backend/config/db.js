const sqlite3 = require("sqlite3").verbose();
const path = require("path");

const dbPath = path.join(__dirname, "../../storage/maqueti.db");

const db = new sqlite3.Database(dbPath);

db.serialize(() => {
  db.run(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY,
      name TEXT NOT NULL,
      email TEXT NOT NULL UNIQUE,
      password TEXT NOT NULL,
      googleSub TEXT
    )
  `);

  db.run(`ALTER TABLE users ADD COLUMN googleSub TEXT`, () => {});

  db.run(`
    CREATE TABLE IF NOT EXISTS products (
      id INTEGER PRIMARY KEY,
      title TEXT NOT NULL,
      price REAL NOT NULL,
      userId INTEGER,
      FOREIGN KEY(userId) REFERENCES users(id)
    )
  `);
 
  db.run(`ALTER TABLE products ADD COLUMN description TEXT`, () => {}); 
  db.run(`ALTER TABLE products ADD COLUMN condition TEXT`, () => {}); 
  db.run(`ALTER TABLE products ADD COLUMN category TEXT`, () => {}); 
  db.run(`ALTER TABLE products ADD COLUMN location TEXT`, () => {}); 
  db.run(`ALTER TABLE products ADD COLUMN imageUrl TEXT`, () => {}); 
  db.run(`ALTER TABLE products ADD COLUMN stock INTEGER`, () => {}); 
  db.run(`ALTER TABLE products ADD COLUMN sku TEXT`, () => {}); 
  db.run(`ALTER TABLE products ADD COLUMN createdAt INTEGER`, () => {}); 

  db.run(`
    CREATE TABLE IF NOT EXISTS passkeys (
      credentialId TEXT PRIMARY KEY,
      userId INTEGER NOT NULL,
      publicKey TEXT NOT NULL,
      counter INTEGER NOT NULL,
      transports TEXT,
      FOREIGN KEY(userId) REFERENCES users(id)
    )
  `);
});

module.exports = db;
