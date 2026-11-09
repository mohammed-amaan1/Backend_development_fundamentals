// Task 2: Database schema & initial seeding - Assigned to Pavan Kumar (9099)
const sqlite3 = require("sqlite3").verbose();
const path = require("path");

const dbPath = path.join(__dirname, "lenslab.db");
const db = new sqlite3.Database(dbPath);

console.log("Initializing LensLab Studio database...");

db.serialize(() => {
  // 1. Drop existing tables if they exist to start fresh
  db.run("DROP TABLE IF EXISTS rentals");
  db.run("DROP TABLE IF EXISTS cameras");
  db.run("DROP TABLE IF EXISTS photographers");

  // 2. Create Photographers table
  db.run(`
    CREATE TABLE photographers (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      phone TEXT,
      email TEXT
    )
  `);

  // 3. Create Cameras table
  db.run(`
    CREATE TABLE cameras (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      kind TEXT NOT NULL
    )
  `);

  // 4. Create Rentals table (Twist requirement: track camera, photographer, and active status)
  db.run(`
    CREATE TABLE rentals (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      camera_id INTEGER NOT NULL,
      photographer_id INTEGER NOT NULL,
      status TEXT NOT NULL DEFAULT 'active',
      rental_date TEXT NOT NULL,
      return_date TEXT,
      FOREIGN KEY (camera_id) REFERENCES cameras (id),
      FOREIGN KEY (photographer_id) REFERENCES photographers (id)
    )
  `);

  // 5. Seed initial Photographers (Asha is ID 1, Ravi is ID 2 for the Twist Test cases)
  const photographerStmt = db.prepare(
    "INSERT INTO photographers (name, phone, email) VALUES (?, ?, ?)"
  );
  const photographers = [
    { name: "Asha", phone: "9876543210", email: "asha@lenslab.com" },
    { name: "Ravi", phone: "9876543211", email: "ravi@lenslab.com" },
    { name: "Neha", phone: "9876543212", email: "neha@lenslab.com" },
    { name: "Arjun", phone: "9876543213", email: "arjun@lenslab.com" },
  ];
  photographers.forEach((p) => photographerStmt.run(p.name, p.phone, p.email));
  photographerStmt.finalize();

  // 6. Seed initial Cameras (Camera 3 is Sony A7 IV for the Twist Test cases)
  const cameraStmt = db.prepare(
    "INSERT INTO cameras (name, kind) VALUES (?, ?)"
  );
  const cameras = [
    { name: "Canon EOS R5", kind: "Mirrorless" },       // ID 1
    { name: "Nikon D850", kind: "DSLR" },              // ID 2
    { name: "Sony A7 IV", kind: "Mirrorless" },         // ID 3 (Key test camera)
    { name: "Blackmagic Pocket 6K", kind: "Cinema" },   // ID 4
    { name: "Canon EOS 5D Mark IV", kind: "DSLR" },     // ID 5
    { name: "Fujifilm X-T4", kind: "Mirrorless" },      // ID 6
  ];
  cameras.forEach((c) => cameraStmt.run(c.name, c.kind));
  cameraStmt.finalize();

  // 7. Seed one past completed rental so GET /rentals shows data out of the box
  db.run(`
    INSERT INTO rentals (camera_id, photographer_id, status, rental_date, return_date)
    VALUES (1, 3, 'returned', '2026-11-01 10:00:00', '2026-11-02 18:00:00')
  `);

  console.log("Database initialized successfully!");
  console.log("- 4 Photographers added (Asha = ID 1, Ravi = ID 2)");
  console.log("- 6 Cameras added (Sony A7 IV = ID 3)");
  console.log("- 1 Past returned rental added (Camera 3 is currently free and ready for test cases)");
});

db.close();
