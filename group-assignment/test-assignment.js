// Task 6: Testing & Verification - Assigned to Rakshit (9087)
const http = require("http");
const { spawn, execSync } = require("child_process");
const path = require("path");

const PORT = 3000;
const BASE_URL = `http://localhost:${PORT}`;

function request(method, path, data = null) {
  return new Promise((resolve, reject) => {
    const url = new URL(path, BASE_URL);
    const options = {
      method: method,
      hostname: url.hostname,
      port: url.port,
      path: url.pathname + url.search,
      headers: {
        "Content-Type": "application/json",
      },
    };

    const req = http.request(options, (res) => {
      let body = "";
      res.on("data", (chunk) => (body += chunk));
      res.on("end", () => {
        let parsed;
        try {
          parsed = JSON.parse(body);
        } catch (e) {
          parsed = body;
        }
        resolve({ status: res.statusCode, data: parsed });
      });
    });

    req.on("error", (err) => reject(err));

    if (data) {
      req.write(JSON.stringify(data));
    }
    req.end();
  });
}

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

async function isServerRunning() {
  try {
    const res = await request("GET", "/");
    return res.status === 200;
  } catch (e) {
    return false;
  }
}

async function runTests() {
  console.log("=========================================================");
  console.log("LensLab Studio API - Automated Verification Suite");
  console.log("Group: LG-5 (JP-GAI2B-G05) | Theme: LensLab Studio");
  console.log("=========================================================\n");

  // Re-seed DB to have clean slate for Twist Tests
  try {
    execSync("node init-db.js", { cwd: __dirname, stdio: "ignore" });
    console.log("Database initialized cleanly before running tests.\n");
  } catch (e) {
    console.warn("Could not re-seed database:", e.message);
  }

  let serverProcess = null;
  const running = await isServerRunning();
  if (!running) {
    console.log("Starting LensLab server on port 3000...");
    serverProcess = spawn("node", ["server.js"], {
      cwd: __dirname,
      stdio: "ignore",
      shell: true,
    });
    // Wait for server to boot
    for (let i = 0; i < 15; i++) {
      await sleep(500);
      if (await isServerRunning()) break;
    }
  }

  let passed = 0;
  let failed = 0;

  function assert(condition, testName, details = "") {
    if (condition) {
      console.log(`[PASS] ${testName}`);
      passed++;
    } else {
      console.error(`[FAIL] ${testName} - ${details}`);
      failed++;
    }
  }

  try {
    // 1. Root route
    const rootRes = await request("GET", "/");
    assert(rootRes.status === 200, "1. GET / - Welcome endpoint responds with 200");

    // 2. GET /cameras
    const camerasRes = await request("GET", "/cameras");
    assert(camerasRes.status === 200 && Array.isArray(camerasRes.data), "2. GET /cameras - Returns camera list");

    // 3. GET /cameras?kind=DSLR (Task 4: Query parameter search)
    const filterRes = await request("GET", "/cameras?kind=DSLR");
    const allDslr = filterRes.data.every((c) => c.kind.toLowerCase() === "dslr");
    assert(filterRes.status === 200 && filterRes.data.length > 0 && allDslr, "3. GET /cameras?kind=DSLR - Query parameter filtering works");

    // 4. POST /cameras - Validation error (Task 4)
    const invalidCamera = await request("POST", "/cameras", { kind: "DSLR" });
    assert(invalidCamera.status === 400, "4. POST /cameras without name - Validation returns 400 Bad Request");

    // 5. POST /cameras - Valid creation (Task 3)
    const newCamera = await request("POST", "/cameras", { name: "Panasonic Lumix S5II", kind: "Mirrorless" });
    assert(newCamera.status === 201 && newCamera.data.camera.id, "5. POST /cameras - Creates camera and returns 201 Created");
    const createdCameraId = newCamera.data.camera.id;

    // 6. PUT /cameras/:id - Update camera (Task 3)
    const updatedCamera = await request("PUT", `/cameras/${createdCameraId}`, { name: "Panasonic Lumix S5IIX", kind: "Mirrorless" });
    assert(updatedCamera.status === 200, "6. PUT /cameras/:id - Updates camera and returns 200 OK");

    // 7. DELETE /cameras/:id - Delete camera (Task 3)
    const deletedCamera = await request("DELETE", `/cameras/${createdCameraId}`);
    assert(deletedCamera.status === 200, "7. DELETE /cameras/:id - Deletes camera and returns 200 OK");

    // 8. GET /photographers
    const photographersRes = await request("GET", "/photographers");
    assert(photographersRes.status === 200 && photographersRes.data.length >= 2, "8. GET /photographers - Lists photographers (Asha and Ravi present)");

    // 9. GET /rentals - JOIN endpoint (Task 3)
    const rentalsJoinRes = await request("GET", "/rentals");
    assert(rentalsJoinRes.status === 200 && Array.isArray(rentalsJoinRes.data), "9. GET /rentals - JOIN query returns rental, camera, and photographer data");

    console.log("\n---------------------------------------------------------");
    console.log("THE TWIST RULE TESTS (Double Booking Prevention)");
    console.log("---------------------------------------------------------");

    // TEST 1: Rent Camera 3 to Asha -> Expect 201
    const test1 = await request("POST", "/rentals", { camera_id: 3, photographer_id: 1 });
    assert(test1.status === 201, "Twist Test 1: Rent Camera 3 to Asha -> Returns 201 Created", JSON.stringify(test1.data));

    // TEST 2: Rent Camera 3 to Ravi -> Expect 409 Conflict with exact error message
    const test2 = await request("POST", "/rentals", { camera_id: 3, photographer_id: 2 });
    const has409 = test2.status === 409;
    const hasCorrectMessage = test2.data && test2.data.message === "Camera 3 is already rented";
    assert(has409 && hasCorrectMessage, "Twist Test 2: Rent Camera 3 to Ravi -> Returns 409 Conflict ('Camera 3 is already rented')", JSON.stringify(test2.data));

    // TEST 3: Return Camera 3, then rent Camera 3 to Ravi -> Expect 200 then 201
    const returnRes = await request("PUT", "/rentals/return/3");
    assert(returnRes.status === 200, "Twist Test 3a: Return Camera 3 -> Returns 200 OK", JSON.stringify(returnRes.data));

    const test3 = await request("POST", "/rentals", { camera_id: 3, photographer_id: 2 });
    assert(test3.status === 201, "Twist Test 3b: Rent Camera 3 to Ravi after return -> Returns 201 Created", JSON.stringify(test3.data));

    console.log("\n=========================================================");
    console.log(`Test Results: ${passed} Passed, ${failed} Failed`);
    console.log("=========================================================");

    if (serverProcess) {
      serverProcess.kill();
    }

    if (failed === 0) {
      console.log("ALL TESTS PASSED PERFECTLY!");
      process.exit(0);
    } else {
      process.exit(1);
    }
  } catch (error) {
    console.error("Test execution failed:", error);
    if (serverProcess) serverProcess.kill();
    process.exit(1);
  }
}

runTests();
