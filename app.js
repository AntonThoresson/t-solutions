const express = require("express");
const expressHandlebars = require("express-handlebars");
const sqlite3 = require("sqlite3");

const db = new sqlite3.Database("tsolutions-database.db");

db.run(`
  CREATE TABLE IF NOT EXISTS reviews (
    id INTEGER PRIMARY KEY,
    name TEXT,
    description TEXT,
    grade INTEGER
  )
`);

const app = express();

const path = require("path");

app.engine(
  "hbs",
  expressHandlebars.engine({
    defaultLayout: "main.hbs",
  })
);

app.use("/public", express.static(path.join(__dirname, "/public")));
app.use(express.static("node_modules/spectre.css/dist"));

app.use(
  express.urlencoded({
    extended: false,
  })
);

app.get("/", function (request, response) {
  response.render("home.hbs");
});

app.get("/about", function (request, response) {
  response.render("about.hbs");
});

app.get("/services", function (request, response) {
  response.render("services.hbs");
});

app.get("/reviews", function (request, response) {
  const query = "SELECT name, description, grade FROM reviews";
  db.all(query, function (error, reviews) {
    if (error) {
      console.log(error);
      const model = {
        dbError: true,
      };
      response.render("reviews.hbs", model);
    } else {
      const model = {
        reviews,
        dbError: false,
      };
      response.render("reviews.hbs", model);
    }
  });
});

app.get("/reviews/create-review", function (request, response) {
  response.render("create-review.hbs");
});

app.post("/reviews/create-review", function (request, response) {
  const name = request.body.name;
  const description = request.body.description;
  const grade = request.body.grade;

  const query = "INSERT INTO reviews (name, description, grade) VALUES (?, ?, ?)";
  const values = [name, description, grade];

  db.run(query, values, function (error) {
    response.redirect("/reviews");
  });
});

app.get("/contact", function (request, response) {
  response.render("contact.hbs");
});

app.listen(6969);
