const express = require("express");
const path = require("path");
const { open } = require("sqlite");
const sqlite3 = require("sqlite3");

const app = express();
app.use(express.json());

const PORT = process.env.PORT || 3000;
const dbPath = path.join(__dirname, "books.db");
let db = null;

// Initialize Database connection and start the server
const initializeDBAndServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });

    app.listen(PORT, () => {
      console.log(`Server running at http://localhost:${PORT}/`);
    });
  } catch (error) {
    console.log(`Database Error: ${error.message}`);
    process.exit(1);
  }
};

initializeDBAndServer();

// Root route
app.get("/", (request, response) => {
  response.send("Lab 3: REST API with Query Parameters and Validation is running live!");
});

// 1. GET /books/ - Search, Filter by Price, Sort, and Paginate
app.get("/books/", async (request, response) => {
  try {
    const {
      search_q = "",
      order_by = "id",
      order = "ASC",
      limit = 10,
      offset = 0,
      min_price,
      max_price,
    } = request.query;

    // Allowed columns to prevent SQL injection
    const allowedColumns = ["id", "title", "author", "price", "pages"];
    const validOrderBy = allowedColumns.includes(order_by.toLowerCase())
      ? order_by.toLowerCase()
      : "id";

    const validOrder = order.toUpperCase() === "DESC" ? "DESC" : "ASC";
    const validLimit = Math.max(1, parseInt(limit, 10) || 10);
    const validOffset = Math.max(0, parseInt(offset, 10) || 0);

    let queryConditions = ["title LIKE ?"];
    let queryParams = [`%${search_q}%`];

    // Price range filtering with BETWEEN or comparison operators
    if (min_price !== undefined && max_price !== undefined) {
      const min = Number(min_price);
      const max = Number(max_price);
      if (!isNaN(min) && !isNaN(max)) {
        queryConditions.push("price BETWEEN ? AND ?");
        queryParams.push(min, max);
      }
    } else if (min_price !== undefined) {
      const min = Number(min_price);
      if (!isNaN(min)) {
        queryConditions.push("price >= ?");
        queryParams.push(min);
      }
    } else if (max_price !== undefined) {
      const max = Number(max_price);
      if (!isNaN(max)) {
        queryConditions.push("price <= ?");
        queryParams.push(max);
      }
    }

    const whereClause = `WHERE ${queryConditions.join(" AND ")}`;
    const getBooksQuery = `
      SELECT *
      FROM book
      ${whereClause}
      ORDER BY ${validOrderBy} ${validOrder}
      LIMIT ? OFFSET ?;
    `;
    queryParams.push(validLimit, validOffset);

    const books = await db.all(getBooksQuery, queryParams);
    response.status(200).json(books);
  } catch (error) {
    response.status(500).json({ message: error.message });
  }
});

// 2. GET /books/:bookId/ - Fetch a single book by ID
app.get("/books/:bookId/", async (request, response) => {
  try {
    const { bookId } = request.params;
    const getBookQuery = `SELECT * FROM book WHERE id = ?;`;
    const book = await db.get(getBookQuery, [bookId]);

    if (!book) {
      return response.status(404).json({ message: "Book Not Found" });
    }
    response.status(200).json(book);
  } catch (error) {
    response.status(500).json({ message: error.message });
  }
});

// 3. POST /books/ - Add a new book with input validation
app.post("/books/", async (request, response) => {
  try {
    const { title, author, price, pages } = request.body;

    // Validation
    if (!title || typeof title !== "string" || title.trim() === "") {
      return response.status(400).json({
        message: "Invalid or missing 'title'. A non-empty string is required.",
      });
    }
    if (!author || typeof author !== "string" || author.trim() === "") {
      return response.status(400).json({
        message: "Invalid or missing 'author'. A non-empty string is required.",
      });
    }
    if (price === undefined || typeof price !== "number" || isNaN(price) || price <= 0) {
      return response.status(400).json({
        message: "Invalid or missing 'price'. A positive number is required.",
      });
    }
    if (pages === undefined || typeof pages !== "number" || isNaN(pages) || pages <= 0) {
      return response.status(400).json({
        message: "Invalid or missing 'pages'. A positive number is required.",
      });
    }

    const addBookQuery = `
      INSERT INTO book (title, author, price, pages)
      VALUES (?, ?, ?, ?);
    `;
    const dbResponse = await db.run(addBookQuery, [
      title.trim(),
      author.trim(),
      price,
      pages,
    ]);

    response.status(201).json({
      message: "Book Added Successfully",
      bookId: dbResponse.lastID,
    });
  } catch (error) {
    response.status(500).json({ message: error.message });
  }
});

// 4. PUT /books/:bookId/ - Update an existing book with validation
app.put("/books/:bookId/", async (request, response) => {
  try {
    const { bookId } = request.params;
    const { title, author, price, pages } = request.body;

    const checkBookQuery = `SELECT * FROM book WHERE id = ?;`;
    const existingBook = await db.get(checkBookQuery, [bookId]);
    if (!existingBook) {
      return response.status(404).json({ message: "Book Not Found" });
    }

    if (!title || typeof title !== "string" || title.trim() === "") {
      return response.status(400).json({
        message: "Invalid or missing 'title'. A non-empty string is required.",
      });
    }
    if (!author || typeof author !== "string" || author.trim() === "") {
      return response.status(400).json({
        message: "Invalid or missing 'author'. A non-empty string is required.",
      });
    }
    if (price === undefined || typeof price !== "number" || isNaN(price) || price <= 0) {
      return response.status(400).json({
        message: "Invalid or missing 'price'. A positive number is required.",
      });
    }
    if (pages === undefined || typeof pages !== "number" || isNaN(pages) || pages <= 0) {
      return response.status(400).json({
        message: "Invalid or missing 'pages'. A positive number is required.",
      });
    }

    const updateBookQuery = `
      UPDATE book
      SET title = ?, author = ?, price = ?, pages = ?
      WHERE id = ?;
    `;
    await db.run(updateBookQuery, [
      title.trim(),
      author.trim(),
      price,
      pages,
      bookId,
    ]);

    response.status(200).json({ message: "Book Details Updated Successfully" });
  } catch (error) {
    response.status(500).json({ message: error.message });
  }
});

// 5. DELETE /books/:bookId/ - Remove a book
app.delete("/books/:bookId/", async (request, response) => {
  try {
    const { bookId } = request.params;

    const checkBookQuery = `SELECT * FROM book WHERE id = ?;`;
    const existingBook = await db.get(checkBookQuery, [bookId]);
    if (!existingBook) {
      return response.status(404).json({ message: "Book Not Found" });
    }

    const deleteBookQuery = `DELETE FROM book WHERE id = ?;`;
    await db.run(deleteBookQuery, [bookId]);

    response.status(200).json({ message: "Book Deleted Successfully" });
  } catch (error) {
    response.status(500).json({ message: error.message });
  }
});

module.exports = app;
