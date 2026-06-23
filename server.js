require("dotenv").config();
const express = require("express");
require("./whatsapp");

const app = express();

app.use(express.json());

app.get("/", (req, res) => {
  res.send("WhatsApp Ledger Running");
});

app.listen(3000, () => {
  console.log("Server running on port 3000");
});