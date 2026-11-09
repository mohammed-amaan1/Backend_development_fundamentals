// ==============================================================================
// LensLab Studio - Camera Rental API
// Group: LG-5 (JP-GAI2B-G05) | Section: CSE-GEN-AI 2B
//
// Member Contributions:
// - Mohammed Amaan (9098): Task 1 (Server Setup & Routing) & Task 5 (Twist Rule: Double Booking Prevention)
// - Pavan Kumar (9099):    Task 2 (Database Schema) & Task 3 (REST CRUD & JOIN Endpoint)
// - Chandu (9100):         Task 4 (Validation & Query Parameter Filtering)
// - Rakshit (9087):        Task 6 (Testing, Postman Guide & Documentation)
// ==============================================================================

const express = require("express");
const path = require("path");
const { open } = require("sqlite");
const sqlite3 = require("sqlite3");

const app = express();
app.use(express.json());

const PORT = process.env.PORT || 3000;
const dbPath = path.join(__dirname, "lenslab.db");
let db = null;

// ==============================================================================
// TASK 1 & 2: Server Initialization & Database Connection
// ==============================================================================
const initializeDBAndServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });

    app.listen(PORT, () => {
      console.log(`LensLab Studio Server running at http://localhost:${PORT}/`);
    });
  } catch (error) {
    console.error(`Database initialization error: ${error.message}`);
    process.exit(1);
  }
};

initializeDBAndServer();

// ==============================================================================
// TASK 1: Base & Health Routes (Mohammed Amaan - 9098)
// ==============================================================================
app.get("/", (req, res) => {
  res.json({
    message: "Welcome to LensLab Studio Camera Rental API",
    group: "LG-5 (JP-GAI2B-G05)",
    theme: "Camera Rental System",
    problem_solved: "Prevents double-booking conflicts when photographers rent cameras.",
    endpoints: {
      cameras: "/cameras",
      filter_cameras: "/cameras?kind=DSLR",
      photographers: "/photographers",
      rentals_join: "/rentals",
      rent_camera: "POST /rentals",
      return_camera: "PUT /rentals/return/:cameraId"
    }
  });
});

// ==============================================================================
// TASK 3 & 4: Cameras CRUD & Search Filter (Pavan Kumar - 9099 & Chandu - 9100)
// ==============================================================================

// 1. GET /cameras - List all cameras or filter by ?kind=
app.get("/cameras", async (req, res) => {
  try {
    const { kind } = req.query;

    if (kind) {
      // Task 4: Filter by query parameter (e.g. ?kind=DSLR or ?kind=Mirrorless)
      const cameras = await db.all(
        "SELECT * FROM cameras WHERE LOWER(kind) = LOWER(?)",
        [kind]
      );
      return res.status(200).json(cameras);
    }

    // List all cameras
    const cameras = await db.all("SELECT * FROM cameras ORDER BY id ASC");
    res.status(200).json(cameras);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 2. GET /cameras/:id - Get a single camera by ID
app.get("/cameras/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const camera = await db.get("SELECT * FROM cameras WHERE id = ?", [id]);

    if (!camera) {
      return res.status(404).json({ error: `Camera with ID ${id} not found` });
    }

    res.status(200).json(camera);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 3. POST /cameras - Add a new camera with validation
app.post("/cameras", async (req, res) => {
  try {
    const { name, kind } = req.body;

    // Task 4: Validation - name and kind are required
    if (!name || typeof name !== "string" || name.trim() === "") {
      return res.status(400).json({ error: "Camera name is required and cannot be empty" });
    }
    if (!kind || typeof kind !== "string" || kind.trim() === "") {
      return res.status(400).json({ error: "Camera kind is required (e.g. DSLR, Mirrorless, Cinema)" });
    }

    const result = await db.run(
      "INSERT INTO cameras (name, kind) VALUES (?, ?)",
      [name.trim(), kind.trim()]
    );

    res.status(201).json({
      message: "Camera added successfully",
      camera: {
        id: result.lastID,
        name: name.trim(),
        kind: kind.trim()
      }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 4. PUT /cameras/:id - Update camera details
app.put("/cameras/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { name, kind } = req.body;

    // Validation
    if (!name || typeof name !== "string" || name.trim() === "") {
      return res.status(400).json({ error: "Camera name is required and cannot be empty" });
    }
    if (!kind || typeof kind !== "string" || kind.trim() === "") {
      return res.status(400).json({ error: "Camera kind is required" });
    }

    const existingCamera = await db.get("SELECT * FROM cameras WHERE id = ?", [id]);
    if (!existingCamera) {
      return res.status(404).json({ error: `Camera with ID ${id} not found` });
    }

    await db.run(
      "UPDATE cameras SET name = ?, kind = ? WHERE id = ?",
      [name.trim(), kind.trim(), id]
    );

    res.status(200).json({
      message: `Camera ${id} updated successfully`,
      camera: { id: Number(id), name: name.trim(), kind: kind.trim() }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 5. DELETE /cameras/:id - Remove a camera
app.delete("/cameras/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const existingCamera = await db.get("SELECT * FROM cameras WHERE id = ?", [id]);

    if (!existingCamera) {
      return res.status(404).json({ error: `Camera with ID ${id} not found` });
    }

    await db.run("DELETE FROM cameras WHERE id = ?", [id]);
    res.status(200).json({ message: `Camera ${id} deleted successfully` });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ==============================================================================
// Photographers Routes
// ==============================================================================

// GET /photographers - List photographers
app.get("/photographers", async (req, res) => {
  try {
    const photographers = await db.all("SELECT * FROM photographers ORDER BY id ASC");
    res.status(200).json(photographers);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST /photographers - Add photographer
app.post("/photographers", async (req, res) => {
  try {
    const { name, phone = "", email = "" } = req.body;
    if (!name || typeof name !== "string" || name.trim() === "") {
      return res.status(400).json({ error: "Photographer name is required" });
    }

    const result = await db.run(
      "INSERT INTO photographers (name, phone, email) VALUES (?, ?, ?)",
      [name.trim(), phone.trim(), email.trim()]
    );

    res.status(201).json({
      message: "Photographer added successfully",
      photographer: {
        id: result.lastID,
        name: name.trim(),
        phone: phone.trim(),
        email: email.trim()
      }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ==============================================================================
// TASK 3: JOIN Endpoint (Pavan Kumar - 9099)
// ==============================================================================
// GET /rentals - Returns rentals joined with camera and photographer details
app.get("/rentals", async (req, res) => {
  try {
    const query = `
      SELECT 
        rentals.id AS rental_id,
        rentals.camera_id,
        cameras.name AS camera_name,
        cameras.kind AS camera_kind,
        rentals.photographer_id,
        photographers.name AS photographer_name,
        photographers.phone AS photographer_phone,
        photographers.email AS photographer_email,
        rentals.status,
        rentals.rental_date,
        rentals.return_date
      FROM rentals
      JOIN cameras ON rentals.camera_id = cameras.id
      JOIN photographers ON rentals.photographer_id = photographers.id
      ORDER BY rentals.id DESC
    `;

    const rentals = await db.all(query);
    res.status(200).json(rentals);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ==============================================================================
// TASK 5: The Twist Rule - No Double Booking (Mohammed Amaan - 9098)
// Client Problem: "Two photographers turned up for the same camera on the same day."
// Rule:
// 1. A camera can NEVER be rented to two active photographers at once.
// 2. Second attempt refused with 409 Conflict: "Camera {id} is already rented".
// 3. Once returned, it can be rented again.
// ==============================================================================

// POST /rentals - Rent a camera to a photographer
app.post("/rentals", async (req, res) => {
  try {
    const { camera_id, photographer_id } = req.body;

    // 1. Input validation
    if (!camera_id || !photographer_id) {
      return res.status(400).json({
        error: "camera_id and photographer_id are both required"
      });
    }

    // 2. Verify camera exists
    const camera = await db.get("SELECT * FROM cameras WHERE id = ?", [camera_id]);
    if (!camera) {
      return res.status(404).json({ error: `Camera with ID ${camera_id} not found` });
    }

    // 3. Verify photographer exists
    const photographer = await db.get("SELECT * FROM photographers WHERE id = ?", [photographer_id]);
    if (!photographer) {
      return res.status(404).json({ error: `Photographer with ID ${photographer_id} not found` });
    }

    // 4. THE TWIST RULE: Check if camera is already actively rented
    const activeRental = await db.get(
      "SELECT * FROM rentals WHERE camera_id = ? AND status = 'active'",
      [camera_id]
    );

    if (activeRental) {
      // Must return 409 Conflict with exact client-specified format
      return res.status(409).json({
        message: `Camera ${camera_id} is already rented`
      });
    }

    // 5. If not rented, proceed with booking
    const rentalDate = new Date().toISOString();
    const result = await db.run(
      `INSERT INTO rentals (camera_id, photographer_id, status, rental_date)
       VALUES (?, ?, 'active', ?)`,
      [camera_id, photographer_id, rentalDate]
    );

    res.status(201).json({
      message: `Camera ${camera_id} rented successfully to ${photographer.name}`,
      rental: {
        id: result.lastID,
        camera_id: Number(camera_id),
        camera_name: camera.name,
        photographer_id: Number(photographer_id),
        photographer_name: photographer.name,
        status: "active",
        rental_date: rentalDate
      }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// PUT /rentals/return/:cameraId - Return a rented camera so it can be rented again
app.put("/rentals/return/:cameraId", async (req, res) => {
  try {
    const { cameraId } = req.params;

    // Check if there is an active rental for this camera
    const activeRental = await db.get(
      "SELECT * FROM rentals WHERE camera_id = ? AND status = 'active'",
      [cameraId]
    );

    if (!activeRental) {
      return res.status(404).json({
        error: `No active rental found for Camera ${cameraId}. It is already available in the studio.`
      });
    }

    const returnDate = new Date().toISOString();
    await db.run(
      "UPDATE rentals SET status = 'returned', return_date = ? WHERE id = ?",
      [returnDate, activeRental.id]
    );

    res.status(200).json({
      message: `Camera ${cameraId} has been returned successfully. It is now available for new bookings!`,
      rental_id: activeRental.id,
      camera_id: Number(cameraId),
      status: "returned",
      return_date: returnDate
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = app;
