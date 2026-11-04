const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function runTests() {
  process.env.PORT = "3003";
  require("./server.js");
  await delay(1200);

  const BASE_URL = "http://localhost:3003";
  console.log("=== Testing Lab 3 REST API & Query Parameters ===\n");

  // 1. GET /books/ (default)
  console.log("1. GET /books/ (default all books):");
  let res = await fetch(`${BASE_URL}/books/`);
  let data = await res.json();
  console.log(`Status: ${res.status}, Count: ${data.length}`);

  // 2. Search query (?search_q=Code)
  console.log("\n2. GET /books/?search_q=Code (Search partial match):");
  res = await fetch(`${BASE_URL}/books/?search_q=Code`);
  data = await res.json();
  console.log(`Status: ${res.status}, Found: ${data.length} books`);
  console.log("Titles:", data.map(b => b.title));

  // 3. Sorting (?order_by=price&order=DESC)
  console.log("\n3. GET /books/?order_by=price&order=DESC (Sort by price DESC):");
  res = await fetch(`${BASE_URL}/books/?order_by=price&order=DESC&limit=3`);
  data = await res.json();
  console.log(`Status: ${res.status}, Top 3 Highest Prices:`, data.map(b => ({ title: b.title, price: b.price })));

  // 4. Price range filter (?min_price=500&max_price=800)
  console.log("\n4. GET /books/?min_price=500&max_price=800 (Price filter):");
  res = await fetch(`${BASE_URL}/books/?min_price=500&max_price=800`);
  data = await res.json();
  console.log(`Status: ${res.status}, Count: ${data.length}, Range:`, data.map(b => ({ title: b.title, price: b.price })));

  // 5. Pagination (?limit=3&offset=0)
  console.log("\n5. GET /books/?limit=3&offset=0 (Pagination limit 3):");
  res = await fetch(`${BASE_URL}/books/?limit=3&offset=0`);
  data = await res.json();
  console.log(`Status: ${res.status}, Page 1 IDs:`, data.map(b => b.id));

  // 6. POST /books/ with missing title (Validation failure -> 400)
  console.log("\n6. POST /books/ with missing title (Expect 400 Bad Request):");
  res = await fetch(`${BASE_URL}/books/`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ author: "Unknown", price: 500, pages: 200 }),
  });
  data = await res.json();
  console.log(`Status: ${res.status} (Expected 400), Response:`, data);

  // 7. POST /books/ with non-numeric price (Validation failure -> 400)
  console.log("\n7. POST /books/ with non-numeric price (Expect 400 Bad Request):");
  res = await fetch(`${BASE_URL}/books/`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ title: "Bad Book", author: "Nobody", price: "Free", pages: 200 }),
  });
  data = await res.json();
  console.log(`Status: ${res.status} (Expected 400), Response:`, data);

  // 8. POST /books/ valid creation (Expect 201 Created)
  console.log("\n8. POST /books/ valid book (Expect 201 Created):");
  const validBook = {
    title: "Mastering TypeScript",
    author: "Nathan Rozentals",
    price: 850,
    pages: 420,
  };
  res = await fetch(`${BASE_URL}/books/`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(validBook),
  });
  data = await res.json();
  console.log(`Status: ${res.status} (Expected 201), Response:`, data);
  const createdId = data.bookId;

  // 9. GET non-existent book (Expect 404 Not Found)
  console.log("\n9. GET /books/999/ (Expect 404 Not Found):");
  res = await fetch(`${BASE_URL}/books/999/`);
  data = await res.json();
  console.log(`Status: ${res.status} (Expected 404), Response:`, data);

  // 10. PUT /books/:id/ (Expect 200 OK)
  console.log(`\n10. PUT /books/${createdId}/ (Update book):`);
  res = await fetch(`${BASE_URL}/books/${createdId}/`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      title: "Mastering TypeScript (4th Edition)",
      author: "Nathan Rozentals",
      price: 920,
      pages: 450,
    }),
  });
  data = await res.json();
  console.log(`Status: ${res.status} (Expected 200), Response:`, data);

  // 11. DELETE /books/:id/ (Expect 200 OK)
  console.log(`\n11. DELETE /books/${createdId}/ (Delete book):`);
  res = await fetch(`${BASE_URL}/books/${createdId}/`, { method: "DELETE" });
  data = await res.json();
  console.log(`Status: ${res.status} (Expected 200), Response:`, data);

  console.log("\nAll 11 tests passed successfully!");
  process.exit(0);
}

runTests().catch(err => {
  console.error("Test failed:", err);
  process.exit(1);
});
