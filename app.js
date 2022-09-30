const express = require("express");
const expressHandlebars = require("express-handlebars");
const sqlite3 = require("sqlite3");
const expressSession = require("express-session");

const REVIEW_NAME_MAX_LENGTH = 50;
const REVIEW_GRADE_MAX = 10;
const REVIEW_GRADE_MIN = 0;
const ADMIN_USERNAME = "tsolutions";
const ADMIN_PASSWORD = "password";

const db = new sqlite3.Database("tsolutions-database.db");

db.run(`
  CREATE TABLE IF NOT EXISTS reviews (
    id INTEGER PRIMARY KEY,
    name TEXT,
    description TEXT,
    grade INTEGER
  )
`);

db.run(`
  CREATE TABLE IF NOT EXISTS faq (
    id INTEGER PRIMARY KEY,
    question TEXT,
    answer TEXT
  )
`);

db.run(`
  CREATE TABLE IF NOT EXISTS services (
    id INTEGER PRIMARY KEY,
    name TEXT,
    description TEXT
  )
`);

const app = express();

const path = require("path");
const { get } = require("https");
const { brotliDecompress } = require("zlib");

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

app.get("/", function (request, response) {
  response.render("home.hbs");
});

app.get("/about", function (request, response) {
  response.render("about.hbs");
});

app.get("/services", function (request, response) {
  response.render("services.hbs");
});

app.get("/faqs", function (request, response) {
  const query = "SELECT * FROM faq";

  db.all(query, function (error, faqs) {
    if (error) {
      //display error
    } else {
      const model = {
        faqs,
      };
      response.render("faqs.hbs", model);
    }
  });
});

app.get("/faq/:id", function (request, response) {
  const id = request.params.id;

  const query = "SELECT * FROM faq WHERE id = ?";
  const values = [id];

  db.get(query, values, function (error, faq) {
    if (error) {
      //display error
    } else {
      const model = {
        faq,
      };
      response.render("faq.hbs", model);
    }
  });
});

app.post("/faq/delete/:id", function (request, response) {
  const id = request.params.id;

  const query = "DELETE FROM faq WHERE id = ?";
  const values = [id];

  db.run(query, values, function (error) {
    if (error) {
      //display error
      console.log(error);
    } else {
      response.redirect("/faqs");
    }
  });
});

app.get("/faqs/create-faq", function (request, response) {
  response.render("create-faq.hbs");
})

app.post("/faqs/create-faq", function (request, response) {
  const question = request.body.question;
  const answer = request.body.answer;
  const query = "INSERT INTO faq (question, answer) VALUES (?, ?)";
  const values = [question, answer];

  db.run(query, values, function (error) {
    if (error) {
      //display error
    } else {
      response.redirect("/faqs");
    }
  });
});

app.get("/update-faq/:id", function (request, response) {
  const id = request.params.id;

  const query = "SELECT * FROM faq WHERE id = ?";
  const values = [id];

  db.get(query, values, function (error, faq) {
    if (error) {
      //display error
    } else {
      const model = {
        faq,
      }
      response.render("update-faq.hbs", model);
    }
  })
})

app.post("/update-faq/:id", function (request, response) {
  const updatedQuestion = request.body.question;
  const updatedAnswer = request.body.answer;
  const id = request.params.id;

  const query = "UPDATE faq SET question = ?, answer = ? WHERE id = ?";
  const values = [updatedQuestion, updatedAnswer, id];

  db.run(query, values, function (error) {
    if (error) {
      //display error
    } else {
      response.redirect("/faqs");
    }
  })
})

app.get("/reviews", function (request, response) {
  const query = "SELECT id, name, description, grade FROM reviews";
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

function getErrorMessagesForReviews(name, grade) {
  const errorMessages = [];

  if (name == "") {
    errorMessages.push("Error: Name can't be empty");
  } else if (REVIEW_NAME_MAX_LENGTH < name.length) {
    errorMessages.push(
      "Error: Name may be at most " +
        REVIEW_NAME_MAX_LENGTH +
        " characters long"
    );
  }

  if (isNaN(grade)) {
    errorMessages.push("Error: Grade must be a number");
  } else if (grade < REVIEW_GRADE_MIN) {
    errorMessages.push("Error: Grade can't be negative");
  } else if (grade > REVIEW_GRADE_MAX) {
    errorMessages.push("Error: Grade may at most be 10");
  }
  return errorMessages;
}

app.post("/reviews/create-review", function (request, response) {
  const name = request.body.name;
  const description = request.body.description;
  const grade = parseInt(request.body.grade, 10);

  const errorMessages = getErrorMessagesForReviews(name, grade);

  if (errorMessages.length == 0) {
    const query =
      "INSERT INTO reviews (name, description, grade) VALUES (?, ?, ?)";
    const values = [name, description, grade];

    db.run(query, values, function (error) {
      if (error) {
        errorMessages.push("Error: Internal server error");

        const model = {
          errorMessages,
          name,
          grade,
        };

        response.render("create-review.hbs", model);
      } else {
        response.redirect("/reviews");
      }
    });
  } else {
    const model = {
      errorMessages,
      name,
      grade,
    };

    response.render("create-review.hbs", model);
  }
});

app.get("/reviews/delete-review", function (request, response) {
  const query = "SELECT name FROM reviews";
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
      response.render("delete-review.hbs", model);
    }
  });
});

app.post("/reviews/delete-review", function (request, response) {
  const name = request.body.name;

  const query = "DELETE FROM reviews WHERE name = ?";
  const values = [name];

  db.run(query, values, function (error) {
    if (error) {
      //display error
      response.render("delete.review.hbs");
    } else {
      response.redirect("/reviews");
    }
  });
});

app.get("/reviews/:id", function (request, response) {
  const id = request.params.id;

  const query = "SELECT * FROM reviews WHERE id = ?";
  const values = [id];

  db.get(query, values, function (error, review) {
    const model = {
      review,
    };
    response.render("review.hbs", model);
  });
});

app.get("/reviews/update-review/:id", function (request, response) {
  const id = request.params.id;

  const query = "SELECT * FROM reviews WHERE id = ?";
  const values = [id];

  db.get(query, values, function (error, review) {
    const model = {
      review,
    };

    response.render("update-review.hbs", model);
  });
});

app.post("/reviews/update-review/:id", function (request, response) {
  const updatedName = request.body.name;
  const updatedDescription = request.body.description;
  const updatedGrade = parseInt(request.body.grade, 10);
  const id = request.params.id;

  const query =
    "UPDATE reviews SET name = ?, description = ?, grade = ? WHERE id = ?";
  const values = [updatedName, updatedDescription, updatedGrade, id];

  db.run(query, values, function (error) {
    if (error) {
      //display error
    } else {
      response.redirect("/reviews");
    }
  });
});

app.get("/contact", function (request, response) {
  response.render("contact.hbs");
});

app.get("/login", function (request, response) {
  response.render("login.hbs");
});

app.get("/secret-page", function (request, response) {
  if (isLoggedIn == true) {
    //send back secret page
  } else {
    //send back error
  }
});

app.post("/login", function (request, response) {
  const username = request.body.username;
  const password = request.body.password;

  if (username == ADMIN_USERNAME && password == ADMIN_PASSWORD) {
    request.session.isLoggedIn = true;
    response.redirect("/");
  } else {
    const model = {
      failedToLogin: true,
    };
    response.render("login.hbs", model);
  }
});

app.listen(6969);
