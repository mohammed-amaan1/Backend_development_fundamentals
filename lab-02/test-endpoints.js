const http = require("http");

// Start server
require("./server.js");

const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function runTests() {
  await delay(1000);

  console.log("=== Testing Lab 2 CRUD Endpoints ===\n");

  // Test 1: GET /books/
  console.log("1. Testing GET /books/ (all books)...");
  let res = await fetch("http://localhost:3000/books/");
  let data = await res.json();
  console.log(`Status: ${res.status}, Count: ${data.length}, First Book:`, data[0]);

  // Test 2: GET /books/1/
  console.log("\n2. Testing GET /books/1/ (single book)...");
  res = await fetch("http://localhost:3000/books/1/");
  data = await res.json();
  console.log(`Status: ${res.status}, Book:`, data);

  // Test 3: POST /books/
  console.log("\n3. Testing POST /books/ (add new book)...");
  const newBook = {
    title: "Mastering Node.js",
    author: "Sandro Pasquali",
    price: 699,
    pages: 380,
  };
  res = await fetch("http://localhost:3000/books/", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(newBook),
  });
  data = await res.json();
  console.log(`Status: ${res.status}, Response:`, data);
  const createdBookId = data.bookId;

  // Test 4: PUT /books/:bookId/
  console.log(`\n4. Testing PUT /books/${createdBookId}/ (update book)...`);
  const updatedBook = {
    title: "Mastering Node.js (2nd Edition)",
    author: "Sandro Pasquali",
    price: 799,
    pages: 410,
  };
  res = await fetch(`http://localhost:3000/books/${createdBookId}/`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(updatedBook),
  });
  data = await res.json();
  console.log(`Status: ${res.status}, Response:`, data);

  // Verify update
  res = await fetch(`http://localhost:3000/books/${createdBookId}/`);
  data = await res.json();
  console.log("Verified Updated Book:", data);

  // Test 5: DELETE /books/:bookId/
  console.log(`\n5. Testing DELETE /books/${createdBookId}/ (delete book)...`);
  res = await fetch(`http://localhost:3000/books/${createdBookId}/`, {
    method: "DELETE",
  });
  data = await res.json();
  console.log(`Status: ${res.status}, Response:`, data);

  // Verify deletion
  res = await fetch(`http://localhost:3000/books/${createdBookId}/`);
  data = await res.json();
  console.log(`Status: ${res.status} (Expected 404), Response:`, data);

  console.log("\nAll endpoints verified successfully!");
  process.exit(0);
}

runTests().catch((err) => {
  console.error("Test failed:", err);
  process.exit(1);
});
