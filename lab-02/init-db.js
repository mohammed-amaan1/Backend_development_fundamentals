const sqlite3 = require("sqlite3").verbose();
const path = require("path");

const dbPath = path.join(__dirname, "books.db");
const db = new sqlite3.Database(dbPath);

const sampleBooks = [
  { title: "Clean Code", author: "Robert C. Martin", price: 650, pages: 464 },
  { title: "The Pragmatic Programmer", author: "Andrew Hunt", price: 720, pages: 352 },
  { title: "JavaScript: The Good Parts", author: "Douglas Crockford", price: 450, pages: 176 },
  { title: "You Don't Know JS", author: "Kyle Simpson", price: 380, pages: 98 },
  { title: "Design Patterns", author: "Erich Gamma", price: 890, pages: 395 },
  { title: "Introduction to Algorithms", author: "Thomas H. Cormen", price: 1250, pages: 1312 },
  { title: "Designing Data-Intensive Applications", author: "Martin Kleppmann", price: 950, pages: 616 },
  { title: "Node.js Design Patterns", author: "Mario Casciaro", price: 820, pages: 536 },
  { title: "Refactoring", author: "Martin Fowler", price: 780, pages: 448 },
  { title: "Fluent Python", author: "Luciano Ramalho", price: 870, pages: 792 }
];

db.serialize(() => {
  db.run("DROP TABLE IF EXISTS book");
  db.run(`
    CREATE TABLE book (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      author TEXT NOT NULL,
      price INTEGER NOT NULL,
      pages INTEGER NOT NULL
    )
  `);

  const stmt = db.prepare("INSERT INTO book (title, author, price, pages) VALUES (?, ?, ?, ?)");
  for (const book of sampleBooks) {
    stmt.run(book.title, book.author, book.price, book.pages);
  }
  stmt.finalize(() => {
    console.log("Database initialized with 10 sample books.");
  });
});

db.close();
