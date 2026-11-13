# LensLab Studio - Camera Rental System

> **Group:** LG-5 (`JP-GAI2B-G05`)  
> **Section:** CSE-GEN-AI 2B  
> **Theme:** Theme 5 — Camera Rental (LensLab Studio)  

---

## 1. Problem Statement

**Client Problem:**  
> *"Our cameras are lent by phone call. Two photographers turned up for the same camera on the same day. Please build us a system that fixes this."*

**Our Solution:**  
We built a REST API backend using **Express.js** and **SQLite3** for LensLab Studio. The system tracks cameras, photographers, and rentals. To solve the client's double-booking issue, we implemented **The Twist Rule**:
1. A camera cannot be rented to two photographers at the same time.
2. If someone tries to rent a camera that is already active, the server returns **409 Conflict** with `"Camera {id} is already rented"`.
3. Once the camera is returned, it becomes available to be rented again.

---

## 2. Team Members & Contributions

| Member Name | Student ID | Assigned Tasks | Responsibility |
| :--- | :---: | :---: | :--- |
| **Mohammed Amaan** | **9098** | **Task 1 & Task 5** | • **Task 1:** Express server setup, base routes, and server connection.<br>• **Task 5 (Twist Rule):** Preventing double bookings (`409 Conflict`) and camera return route. |
| **Pavan Kumar** | **9099** | **Task 2 & Task 3** | • **Task 2:** SQLite database schema (`init-db.js`) with 3 tables (`photographers`, `cameras`, `rentals`).<br>• **Task 3:** REST CRUD endpoints for cameras and the SQL `JOIN` endpoint (`GET /rentals`). |
| **Chandu** | **9100** | **Task 4** | • **Task 4:** Input validation returning `400 Bad Request` and query parameter search (`GET /cameras?kind=DSLR`). |
| **Rakshit** | **9087** | **Task 6** | • **Task 6:** Testing all endpoints in Postman, capturing verification screenshots, and writing documentation. |

---

## 3. Database Schema

The database `lenslab.db` has 3 tables:

1. **`photographers`**: `id`, `name`, `phone`, `email`
2. **`cameras`**: `id`, `name`, `kind` (e.g. DSLR, Mirrorless, Cinema)
3. **`rentals`**: `id`, `camera_id`, `photographer_id`, `status` (`'active'` or `'returned'`), `rental_date`, `return_date`

---

## 4. API Endpoints

| Method | Endpoint | Description | Status Code |
| :--- | :--- | :--- | :---: |
| `GET` | `/cameras` | Get all cameras in inventory | `200 OK` |
| `GET` | `/cameras?kind=DSLR` | Filter cameras by kind | `200 OK` |
| `GET` | `/cameras/:id` | Get a camera by ID | `200 OK` / `404` |
| `POST` | `/cameras` | Add new camera (validates name & kind) | `201 Created` / `400` |
| `PUT` | `/cameras/:id` | Update camera name or kind | `200 OK` |
| `DELETE` | `/cameras/:id` | Delete a camera | `200 OK` |
| `GET` | `/photographers` | List registered photographers | `200 OK` |
| `GET` | `/rentals` | **JOIN:** List rentals with camera name and photographer name | `200 OK` |
| `POST` | `/rentals` | **Twist:** Rent camera (returns `409` if already rented) | `201` / `409` |
| `PUT` | `/rentals/return/:cameraId` | **Twist:** Return camera so it can be rented again | `200 OK` |

---

## 5. How to Run the Project

1. Install dependencies:
   ```bash
   npm install
   ```

2. Initialize database and seed sample data:
   ```bash
   node init-db.js
   ```

3. Start the server:
   ```bash
   npm start
   ```
   The server runs at: `http://localhost:3000/`

---

## 6. The Twist Rule Verification (Postman Steps)

To test the double-booking fix:

- **Test 1: Rent Camera 3 to Asha**
  - `POST http://localhost:3000/rentals` with `{ "camera_id": 3, "photographer_id": 1 }`
  - Result: `201 Created`
- **Test 2: Rent Camera 3 to Ravi (Double booking attempt)**
  - `POST http://localhost:3000/rentals` with `{ "camera_id": 3, "photographer_id": 2 }`
  - Result: `409 Conflict` $\rightarrow$ `"Camera 3 is already rented"`
- **Test 3: Return Camera 3 and Rent to Ravi**
  - Step 1: `PUT http://localhost:3000/rentals/return/3` $\rightarrow$ `200 OK`
  - Step 2: `POST http://localhost:3000/rentals` with `{ "camera_id": 3, "photographer_id": 2 }` $\rightarrow$ `201 Created`

---

## 7. Postman Verification Screenshots

### Screenshot 1: GET /cameras (All Cameras)
![Cameras List](screenshots/01_cameras_list.png)

### Screenshot 2: GET /cameras?kind=DSLR (Filter by Query Parameter)
![Filter by DSLR](screenshots/02_query_param_dslr.png)

### Screenshot 3: POST /cameras Validation Error (400 Bad Request)
![Validation Error](screenshots/03_validation_error.png)

### Screenshot 4: GET /rentals (JOIN Endpoint)
![JOIN Rentals](screenshots/04_join_rentals.png)

### Screenshot 5: Twist Test 1 - Rent Camera 3 to Asha (201 Created)
![Twist Test 1](screenshots/05_twist_test1_asha.png)

### Screenshot 6: Twist Test 2 - Rent Camera 3 to Ravi (409 Conflict)
![Twist Test 2](screenshots/06_twist_test2_ravi_conflict.png)

### Screenshot 7: Twist Test 3A - Return Camera 3 (200 OK)
![Twist Test 3A](screenshots/07_twist_test3a_return_camera.png)

### Screenshot 8: Twist Test 3B - Rent Camera 3 to Ravi after Return (201 Created)
![Twist Test 3B](screenshots/08_twist_test3b_rent_to_ravi.png)
