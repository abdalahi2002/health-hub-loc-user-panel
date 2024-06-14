const { error } = require("console");
const express = require("express");
const fs = require("fs");
const path = require("path");
const router = express.Router();

// Helper function to read component files
const readComponent = (filePath) => {
  return fs.readFileSync(
    path.join(__dirname, "..", "components", filePath),
    "utf8"
  );
};

router.get("/", (req, res) => {
  try {
    // Read components
    const navbar = readComponent("Navbar.ejs");

    res.render("index", { title: "Home", navbar });
  } catch (error) {
    console.error("Error reading components:", error);
    res.status(500).send("Internal Server Error");
  }
});

router.get("/pharmacie", (req, res) => {
  try {
    // Read components

    res.render("pharmacie", { title: "pharmacie" });
  } catch (error) {
    console.error("Error reading components:", error);
    res.status(500).send("Internal Server Error");
  }
});

router.get("/docteur", (req, res) => {
  try {
    // Read components

    res.render("docteur", { title: "docteur" });
  } catch (error) {
    console.error("Error reading components:", error);
    res.status(500).send("Internal Server Error");
  }
});

router.get("/docteurdetails/:id", (req, res) => {
  try {
    const doctorId = req.params.id;
    res.render("docteurdetails", {
      title: "docteurdetails",
      doctorId: doctorId,
    });
  } catch (error) {
    console.error("Error reading components:", error);
    res.status(500).send("Internal Server Error");
  }
});

router.get("/cabinet", (req, res) => {
  try {
    // Read components

    res.render("cabinet", { title: "cabinet" });
  } catch (error) {
    console.error("Error reading components:", error);
    res.status(500).send("Internal Server Error");
  }
});

module.exports = router;
