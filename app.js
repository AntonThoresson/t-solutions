const express = require("express");
const expressHandlebars = require("express-handlebars");
const expressSession = require("express-session");
const bcrypt = require("bcrypt");

const serviceRouter = require("./routers/service-router")
const faqRouter = require("./routers/faq-router")
const reviewRouter = require("./routers/review-router")

const ADMIN_USERNAME = "tsolutions";
const ADMIN_PASSWORD = "$2b$10$AG3N/Bg2Ygd4I/dx1GbKIOSzK9qqnPm8ytew5NCIKZrQ6JbAvtFhG";

const app = express();

const path = require("path");

app.engine(
  "hbs",
  expressHandlebars.engine({
    defaultLayout: "main.hbs",
  })
);

app.use("/public", express.static(path.join(__dirname, "/public")));
app.use("/node_modules", express.static(path.join(__dirname, "/node_modules")));

app.use(
  express.urlencoded({
    extended: false,
  })
);

app.use(
  expressSession({
    saveUninitialized: false,
    resave: false,
    secret: "sdfskgfghuerrewfncsdfmnbqwa",
  })
);

app.use(function (request, response, next) {
  const isLoggedIn = request.session.isLoggedIn;

  response.locals.isLoggedIn = isLoggedIn;

  next();
});

app.use("/services", serviceRouter);

app.use("/faqs", faqRouter);

app.use("/reviews", reviewRouter);

app.get("/", function (request, response) {
  response.render("home.hbs");
});

app.get("/about", function (request, response) {
  response.render("about.hbs");
});

app.get("/contact", function (request, response) {
  response.render("contact.hbs");
});

app.get("/login", function (request, response) {
  response.render("login.hbs");
});

app.post("/login", function (request, response) {
  const username = request.body.username;
  const password = request.body.password;

  if (username == ADMIN_USERNAME && bcrypt.compareSync(password, ADMIN_PASSWORD)) {
    request.session.isLoggedIn = true;
    response.redirect("/");
  } else {
    const model = {
      failedToLogin: true,
    };
    response.render("login.hbs", model);
  }
});

app.post("/logout", function (request, response) {
  request.session.isLoggedIn = false;
  response.redirect("/");
});

app.listen(6969);
