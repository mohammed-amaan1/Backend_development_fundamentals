// Group Assignment: LensLab Studio Camera Rental System
// Group: LG-5 (JP-GAI2B-G05) | Section: CSE-GEN-AI 2B
//
// Team Contributions:
// - Mohammed Amaan (9098): Task 1 (Server Setup) & Task 5 (Twist Rule: Double Booking Prevention)
// - Pavan Kumar (9099): Task 2 (Database Setup) & Task 3 (Cameras CRUD & JOIN Endpoint)
// - Chandu (9100): Task 4 (Input Validation & Query Parameter Search)
// - Rakshit (9087): Task 6 (Postman Testing & README Documentation)

const express = require("express");
const path = require("path");
const { open } = require("sqlite");
const sqlite3 = require("sqlite3");

const app = express();
app.use(express.json());

const dbPath = path.join(__dirname, "lenslab.db");
let db = null;

// Connect to SQLite Database and start server
const initializeDBAndServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });
    app.listen(3000, () => {
      console.log("Server running at http://localhost:3000/");
    });
  } catch (error) {
    console.log(`Database Error: ${error.message}`);
    process.exit(1);
  }
};

initializeDBAndServer();

// Welcome Route (Task 1 - Amaan)
app.get("/", (req, res) => {
  res.send("Welcome to LensLab Studio Camera Rental API");
});

// 1. GET /cameras - Get all cameras OR filter by ?kind= (Task 3 - Pavan & Task 4 - Chandu)
app.get("/cameras", async (req, res) => {
  try {
    const { kind } = req.query;

    if (kind) {
      // Filter by camera kind (e.g., ?kind=DSLR)
      const getFilteredCameras = `SELECT * FROM cameras WHERE kind = ?;`;
      const cameras = await db.all(getFilteredCameras, [kind]);
      return res.status(200).json(cameras);
    }

    // Get all cameras
    const getCamerasQuery = `SELECT * FROM cameras;`;
    const cameras = await db.all(getCamerasQuery);
    res.status(200).json(cameras);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 2. GET /cameras/:id - Get camera by ID (Task 3 - Pavan)
app.get("/cameras/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const getCameraQuery = `SELECT * FROM cameras WHERE id = ?;`;
    const camera = await db.get(getCameraQuery, [id]);

    if (!camera) {
      return res.status(404).json({ error: "Camera not found" });
    }

    res.status(200).json(camera);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 3. POST /cameras - Add a new camera with validation (Task 3 - Pavan & Task 4 - Chandu)
app.post("/cameras", async (req, res) => {
  try {
    const { name, kind } = req.body;

    // Validation: name and kind are required
    if (!name) {
      return res.status(400).json({ error: "Camera name is required and cannot be empty" });
    }
    if (!kind) {
      return res.status(400).json({ error: "Camera kind is required" });
    }

    const addCameraQuery = `INSERT INTO cameras (name, kind) VALUES (?, ?);`;
    const result = await db.run(addCameraQuery, [name, kind]);

    res.status(201).json({
      message: "Camera added successfully",
      cameraId: result.lastID,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 4. PUT /cameras/:id - Update camera details (Task 3 - Pavan)
app.put("/cameras/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { name, kind } = req.body;

    if (!name || !kind) {
      return res.status(400).json({ error: "Camera name and kind are required" });
    }

    const updateCameraQuery = `UPDATE cameras SET name = ?, kind = ? WHERE id = ?;`;
    await db.run(updateCameraQuery, [name, kind, id]);

    res.status(200).json({ message: "Camera updated successfully" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 5. DELETE /cameras/:id - Delete a camera (Task 3 - Pavan)
app.delete("/cameras/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const deleteCameraQuery = `DELETE FROM cameras WHERE id = ?;`;
    await db.run(deleteCameraQuery, [id]);

    res.status(200).json({ message: "Camera deleted successfully" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 6. GET /photographers - Get all photographers (Task 1 - Amaan)
app.get("/photographers", async (req, res) => {
  try {
    const getPhotographersQuery = `SELECT * FROM photographers;`;
    const photographers = await db.all(getPhotographersQuery);
    res.status(200).json(photographers);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 7. GET /rentals - JOIN query to view rentals with camera and photographer names (Task 3 - Pavan)
app.get("/rentals", async (req, res) => {
  try {
    const joinQuery = `
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
      JOIN photographers ON rentals.photographer_id = photographers.id;
    `;
    const rentals = await db.all(joinQuery);
    res.status(200).json(rentals);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 8. POST /rentals - Rent a camera (Task 5 - Amaan: The Twist Rule - No Double Booking)
// Rule:
// - Camera cannot be rented to two active photographers at once.
// - If already rented, return 409 Conflict: "Camera {id} is already rented".
// - If available, rent with status 'active' and return 201 Created.
app.post("/rentals", async (req, res) => {
  try {
    const { camera_id, photographer_id } = req.body;

    if (!camera_id || !photographer_id) {
      return res.status(400).json({ error: "camera_id and photographer_id are required" });
    }

    // Step 1: Check if this camera is already actively rented
    const checkRentalQuery = `
      SELECT * FROM rentals 
      WHERE camera_id = ? AND status = 'active';
    `;
    const activeRental = await db.get(checkRentalQuery, [camera_id]);

    // Step 2: If already rented, refuse with 409 Conflict
    if (activeRental) {
      return res.status(409).json({
        message: `Camera ${camera_id} is already rented`
      });
    }

    // Step 3: Get camera and photographer details for the response
    const camera = await db.get(`SELECT name FROM cameras WHERE id = ?;`, [camera_id]);
    const photographer = await db.get(`SELECT name FROM photographers WHERE id = ?;`, [photographer_id]);

    // Step 4: Book the rental with status 'active'
    const rentalDate = new Date().toISOString();
    const insertRentalQuery = `
      INSERT INTO rentals (camera_id, photographer_id, status, rental_date)
      VALUES (?, ?, 'active', ?);
    `;
    const result = await db.run(insertRentalQuery, [camera_id, photographer_id, rentalDate]);

    res.status(201).json({
      message: `Camera ${camera_id} rented successfully to ${photographer ? photographer.name : "Photographer"}`,
      rental: {
        id: result.lastID,
        camera_id: Number(camera_id),
        camera_name: camera ? camera.name : "",
        photographer_id: Number(photographer_id),
        photographer_name: photographer ? photographer.name : "",
        status: "active",
        rental_date: rentalDate
      }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 9. PUT /rentals/return/:cameraId - Return a camera (Task 5 - Amaan)
app.put("/rentals/return/:cameraId", async (req, res) => {
  try {
    const { cameraId } = req.params;
    const returnDate = new Date().toISOString();

    const returnQuery = `
      UPDATE rentals
      SET status = 'returned', return_date = ?
      WHERE camera_id = ? AND status = 'active';
    `;
    const result = await db.run(returnQuery, [returnDate, cameraId]);

    res.status(200).json({
      message: `Camera ${cameraId} has been returned successfully. It is now available for new bookings!`,
      status: "returned",
      return_date: returnDate
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});
