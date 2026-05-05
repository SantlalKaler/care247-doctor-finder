const express = require("express");
const cors = require("cors");
// const doctors = require("./doctors.json");
const axios = require("axios");

const app = express();
app.use(cors());

let doctors = [];
loadDoctors();

// load doctors 
async function loadDoctors() {
  const res = await axios.get(
      "https://opensheet.elk.sh/1i-ICZs9guEgl4-4EggeVGz1UmlvENUKtCPgSAhO8srQ/Sheet1"
  );

  doctors = res.data.map(d => ({
    ...d,
    lat: parseFloat(d.lat),
    lng: parseFloat(d.lng)
  }));

  console.log("Doctors loaded:", doctors);
}

// distance function
function getDistance(lat1, lon1, lat2, lon2) {
  const R = 6371;

  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;

  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1 * Math.PI / 180) *
    Math.cos(lat2 * Math.PI / 180) *
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
    .map(doc => {
        console.log("Doctor info ", doc.specialization);
        
      const distance = getDistance(
        userLat,
        userLng,
        doc.lat,
        doc.lng
      );
      return { ...doc, distance };
    })
    .filter(doc => doc.distance <= maxRadius)
    .sort((a, b) => a.distance - b.distance);

  res.json(result);
});

app.listen(5000, () => {
  console.log("Server running on http://localhost:5000");
});