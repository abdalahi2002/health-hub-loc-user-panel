const express = require("express");
const path = require("path");
const fs = require("fs");
const ejs = require("ejs"); // Import EJS module
const app = express();

// Set EJS as the view engine
app.set("view engine", "ejs");

// Set the views directory
app.set("views", path.join(__dirname, "views"));

// Serve static files from the "public" directory
app.use("/public", express.static(path.join(__dirname, "public")));

// Helper function to read component files
const readComponent = (filePath) => {
  return fs.readFileSync(
    path.join(__dirname, "components", filePath),
    "utf8"
  );
};

// Route for the home page
app.get("/", (req, res) => {
  // Read the content of the navbar
  const navbarContent = readComponent("navbar.ejs");

  // Render the index page with navbar content
  res.render("index", {
    title: "Home",
    navbar: navbarContent,
  });
});

// Route for the pharmacie page
app.get("/pharmacie", (req, res) => {
  // Read the content of the navbar
  const navbarContent = readComponent("navbar.ejs");

  // Render the pharmacie page with navbar content
  res.render("pharmacie", {
    title: "Pharmacie",
    navbar: navbarContent,
  });
});

app.get("/docteur", (req, res) => {
  // Read the content of the navbar
  const navbarContent = readComponent("navbar.ejs");

  // Render the pharmacie page with navbar content
  res.render("docteur", {
    title: "docteur",
    navbar: navbarContent,
  });
});

app.get("/cabinet", (req, res) => {
  // Read the content of the navbar
  const navbarContent = readComponent("navbar.ejs");

  // Render the pharmacie page with navbar content
  res.render("cabinet", {
    title: "cabinet",
    navbar: navbarContent,
  });
});



const port = process.env.PORT || 3001;
app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});
