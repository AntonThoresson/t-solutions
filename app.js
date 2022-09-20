const express = require("express");
const expressHandlebars = require("express-handlebars");
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


app.get("/", function (request, response) {
  response.render("home.hbs");
});



app.listen(6969);