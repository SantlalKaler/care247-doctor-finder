const fs = require("fs");

const raw = fs.readFileSync("./credentials.json", "utf8");

const oneLine = JSON.stringify(JSON.parse(raw));

console.log(`GOOGLE_CREDENTIALS=${oneLine}`);