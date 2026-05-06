const express = require("express");
const cors = require("cors");
const axios = require("axios");

const { google } = require("googleapis");

const app = express();
app.use(cors());

// =========================
// Doctor Finder
// =========================
let doctors = [];
loadDoctors();

// load doctors
async function loadDoctors() {
  const res = await axios.get(
    "https://opensheet.elk.sh/1i-ICZs9guEgl4-4EggeVGz1UmlvENUKtCPgSAhO8srQ/Sheet1",
  );

  doctors = res.data.map((d) => ({
    ...d,
    lat: parseFloat(d.lat),
    lng: parseFloat(d.lng),
  }));

  // console.log("Doctors loaded:", doctors);
}

// distance function
function getDistance(lat1, lon1, lat2, lon2) {
  const R = 6371;

  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;

  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) ** 2;

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c;
}

// API
app.get("/nearby-doctors", (req, res) => {
  const { lat, lng, radius = 5 } = req.query;

  // validation
  if (!lat || !lng) {
    return res.status(400).json({ error: "lat & lng required" });
  }

  const userLat = parseFloat(lat);
  const userLng = parseFloat(lng);
  const maxRadius = parseFloat(radius);

  console.log("Doctors ", doctors);

  const result = doctors
    .map((doc) => {
      console.log("Doctor info ", doc.specialization);

      const distance = getDistance(userLat, userLng, doc.lat, doc.lng);
      return { ...doc, distance };
    })
    .filter((doc) => doc.distance <= maxRadius)
    .sort((a, b) => a.distance - b.distance);

  res.json(result);
});

// =========================
// Add Doctor
// =========================

const auth = new google.auth.GoogleAuth({
  keyFile: "credentials.json",
  scopes: ["https://www.googleapis.com/auth/spreadsheets"],
});

const sheets = google.sheets({ version: "v4", auth });

const SPREADSHEET_ID = "1i-ICZs9guEgl4-4EggeVGz1UmlvENUKtCPgSAhO8srQ";
const RANGE = "Sheet1"; // sheet name

app.use(express.json());
app.post("/add-doctor", async (req, res) => {
  try {

    const { name, specialization, contact, lat, lng } = req.body;

    // basic validation
    if (!name || !contact || !lat || !lng) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    // Normalize contact (IMPORTANT)
    const normalizedContact = contact.toString().trim();

    // Check duplicate
    const alreadyExists = doctors.some(
      (doc) => doc.contact.toString().trim() === normalizedContact,
    );

    if (alreadyExists) {
      return res.status(400).json({
        error: "Doctor already registered with this contact",
      });
    }


    // If not found then add doctor to sheet
    const values = [[name, specialization, contact, lat, lng]];

    await sheets.spreadsheets.values.append({
      spreadsheetId: SPREADSHEET_ID,
      range: RANGE,
      valueInputOption: "USER_ENTERED",
      resource: {
        values: values,
      },
    });

    res.json({ message: "Doctor added successfully ✅" });
    await loadDoctors();
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to add doctor" });
  }
});

// app.listen(5000, () => {
//   console.log("Server running on http://localhost:5000");
// });

// =======================
// App Runer
// =======================

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
