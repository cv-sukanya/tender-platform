const express = require("express");
const cors = require("cors");
require("dotenv").config();

const tenderRoutes = require("./routes/tenderRoutes");
require("./services/scheduler");

const checkTenders = require("./services/tenderChecker");

const app = express();

app.use(cors(
  {
    origin: "https://tender-platform-brown.vercel.app"
  }
));
app.use(express.json());

// Routes
app.use("/api/tenders", tenderRoutes);

// Test route
app.get("/", (req, res) => {
  res.send("Tender Notification System Running");
});

// Run scraper once on server start
checkTenders();

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});