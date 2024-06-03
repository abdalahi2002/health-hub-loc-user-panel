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

// Your existing routes and middleware
app.get("/", (req, res) => {
  const navbarContent = fs.readFileSync(
    path.join(__dirname, "/components/navbar.ejs"),
    "utf8"
  );
  
  res.render("index", {
    title: "Home",
    navbar: navbarContent,
  });
});

const port = process.env.PORT || 3001;
app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});
