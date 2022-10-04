const express = require("express");
const expressHandlebars = require("express-handlebars");
const sqlite3 = require("sqlite3");
const expressSession = require("express-session");

const REVIEW_NAME_MAX_LENGTH = 50;
const REVIEW_NAME_MIN_LENGTH = 2;
const REVIEW_GRADE_MAX = 10;
const REVIEW_GRADE_MIN = 0;
const REVIEW_DESCRIPTION_MAX_LENGTH = 500;

const ADMIN_USERNAME = "tsolutions";
const ADMIN_PASSWORD = "password";

const DATABASE_ERROR_MESSAGE = "Error: Internal server error";
const AUTHORIZATION_ERROR_MESSAGE = "Error: You don't have admin access";

const FAQ_QUESTION_MAX_LENGTH = 300;
const FAQ_QUESTION_MIN_LENGTH = 5;
const FAQ_ANSWER_MAX_LENGTH = 300;
const FAQ_ANSWER_MIN_LENGTH = 2;

const SERVICE_NAME_MAX_LENGTH = 50;
const SERVICE_NAME_MIN_LENGTH = 5;
const SERVICE_DESCRIPTION_MAX_LENGTH = 300;
const SERVICE_DESCRIPTION_MIN_LENGTH = 10;

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
const { response } = require("express");

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

function getErrorMessagesForServices(name, description) {
  const errorMessages = [];

  if (name.length > SERVICE_NAME_MAX_LENGTH) {
    errorMessages.push("Error: Name may at most be " + SERVICE_NAME_MAX_LENGTH + " characters long");
  } else if (name.length < SERVICE_NAME_MIN_LENGTH) {
    errorMessages.push("Error: Name can't be less than " + SERVICE_NAME_MIN_LENGTH + " characters long");
  }

  if (description.length > SERVICE_DESCRIPTION_MAX_LENGTH) {
    errorMessages.push("Error: Description may at most be " + SERVICE_DESCRIPTION_MAX_LENGTH + " characters long");
  } else if (description.length < SERVICE_DESCRIPTION_MIN_LENGTH) {
    errorMessages.push("Error: Description can't be less than " + SERVICE_DESCRIPTION_MIN_LENGTH + " characters long");
  }
  return errorMessages;
}

app.get("/services", function (request, response) {
  const query = "SELECT * FROM services";

  db.all(query, function (error, services) {
    if (error){
      const model = {
        dbError: true,
        services,
      };
      response.render("services.hbs", model);
    } else {
      const model = {
        dbError: false,
        services,
      };
      response.render("services.hbs", model);
    }
  });
});

app.get("/services/create-service", function (request, response) {
  if (!request.session.isLoggedIn){
    response.redirect("/login");
  } else {
    response.render("create-service.hbs");
  }
});

app.post("/services/create-service", function (request, response) {
  const name = request.body.name;
  const description = request.body.description;

  const errorMessages = getErrorMessagesForServices(name, description);

  if (!request.session.isLoggedIn) {
    errorMessages.push(AUTHORIZATION_ERROR_MESSAGE);
  }

  if (errorMessages.length == 0) {
    const query = "INSERT INTO services (name, description) VALUES (?, ?)";
    const values = [name, description];

    db.run(query, values, function (error) {
      if (error) {
        errorMessages.push(DATABASE_ERROR_MESSAGE);
        const model = {
          errorMessages,
          name,
          description,
        };
        response.render("create-service.hbs", model);
      } else {
        response.redirect("/services");
      }
    });
  } else {
    const model = {
      errorMessages,
      name,
      description,
    };
    response.render("create-service.hbs", model);
  }
});

app.get("/service/:id", function (request, response) {
  const id = request.params.id;

  if (!request.session.isLoggedIn){
    response.redirect("/login");
  }

  const query = "SELECT * FROM services WHERE id = ?";
  const values = [id];

  db.get(query, values, function (error, service) {
    if (error) {
      const model = {
        dbError: true,
        service,
      };
      response.render("service.hbs", model)
    } else {
      const model = {
        dbError: false,
        service,
      };
      response.render("service.hbs", model);
    }
  });
});

app.post("/service/delete/:id", function (request, response) {
  const id = request.params.id;
 if (request.session.isLoggedIn) {
  const query = "DELETE FROM services WHERE id = ?";
  const values = [id];

  db.run(query, values, function (error) {
    if (error) {
      const model = {
        dbError: true,
      };
      response.render("service.hbs", model);
    } else {
      response.redirect("/services");
    }
  });
} else {
  response.redirect("/login")
}
});

app.get("/update-service/:id", function (request, response) {
  const id = request.params.id;

  if (!request.session.isLoggedIn) {
    response.redirect("/login");
  }

  const query = "SELECT * FROM services WHERE id = ?";
  const values = [id];

  db.get(query, values, function (error, service) {
    if (error) {
      const model = {
        dbError: true,
        service,
      };
      response.render("update-service.hbs", model)
    } else {
      const model = {
        dbError: false,
        service,
      };
      response.render("update-service.hbs", model);
    }
  });
});

app.post("/update-service/:id", function (request, response) {
  const updatedName = request.body.name;
  const updatedDescription = request.body.description;
  const id = request.params.id;

  const errorMessages = getErrorMessagesForServices(updatedName, updatedDescription);

  if (!request.session.isLoggedIn) {
    errorMessages.push(AUTHORIZATION_ERROR_MESSAGE);
  }

  if (errorMessages.length == 0) {
    const query = "UPDATE services SET name = ?, description = ? WHERE id = ?";
    const values = [updatedName, updatedDescription, id];

    db.run(query, values, function (error) {
      if (error) {
        errorMessages.push(DATABASE_ERROR_MESSAGE);
        const model = {
          errorMessages,
          service: {
            name: updatedName,
            description: updatedDescription,
          },
        };
        response.render("update-service.hbs", model);
      } else {
        response.redirect("/services");
      }
    });
  } else {
    const model = {
      errorMessages,
      service: {
        name: updatedName,
        description: updatedDescription,
      },
    };
    response.render("update-service.hbs", model);
  }
});

function getErrorMessagesForFaqs(question, answer) {
  const errorMessages = [];

  if (question.length > FAQ_QUESTION_MAX_LENGTH) {
    errorMessages.push("Error: Question may at most be " + FAQ_QUESTION_MAX_LENGTH + " characters long");
  } else if (question.length < FAQ_ANSWER_MIN_LENGTH) {
    errorMessages.push("Error: Question can't be less than " + FAQ_QUESTION_MIN_LENGTH + " characters long");
  }

  if (answer.length > FAQ_ANSWER_MAX_LENGTH) {
    errorMessages.push("Error: Answer may at most be " + FAQ_ANSWER_MAX_LENGTH + " characters long");
  } else if (answer.length < FAQ_ANSWER_MIN_LENGTH) {
    errorMessages.push("Error: Answer can't be less than " + FAQ_ANSWER_MIN_LENGTH +  " charcters long");
  }

  return errorMessages;
}

app.get("/faqs", function (request, response) {
  const query = "SELECT * FROM faq";

  db.all(query, function (error, faqs) {
    if (error) {
      const model = {
        dbError: true,
        faqs,
      };
      response.render("faqs.hbs", model);
    } else {
      const model = {
        dbError: false,
        faqs,
      };
      response.render("faqs.hbs", model);
    }
  });
});


app.get("/faq/:id", function (request, response) {
  const id = request.params.id;

  if (!request.session.isLoggedIn) {
    response.redirect("/login");
  }

  const query = "SELECT * FROM faq WHERE id = ?";
  const values = [id];

  db.get(query, values, function (error, faq) {
    if (error) {
      const model = {
        dbError: true,
        faq,
      };
      response.render("faq.hbs", model);
    } else {
      const model = {
        dbError: false,
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
      const model = {
        dbError: true,
      };
      response.render("review.hbs", model);
    } else {
      response.redirect("/faqs");
    }
  });
});

app.get("/faqs/create-faq", function (request, response) {
  if (!request.session.isLoggedIn) {
    response.redirect("/login");
  } else {
    response.render("create-faq.hbs");
  }
});

app.post("/faqs/create-faq", function (request, response) {
  const question = request.body.question;
  const answer = request.body.answer;

  const errorMessages = getErrorMessagesForFaqs(question, answer);

  if (!request.session.isLoggedIn) {
    errorMessages.push(AUTHORIZATION_ERROR_MESSAGE);
  }
  if (errorMessages.length == 0) {
    const query = "INSERT INTO faq (question, answer) VALUES (?, ?)";
    const values = [question, answer];

    db.run(query, values, function (error) {
      if (error) {
        errorMessages.push(DATABASE_ERROR_MESSAGE);
        const model = {
          errorMessages,
          question,
          answer,
        };
        response.render("create-faq.hbs", model);
      } else {
        response.redirect("/faqs");
      }
    });
  } else {
    const model = {
      errorMessages,
      question,
      answer,
    };
    response.render("create-faq.hbs", model);
  }
});

app.get("/update-faq/:id", function (request, response) {
  const id = request.params.id;

  if (!request.session.isLoggedIn) {
    response.redirect("/login");
  }

  const query = "SELECT * FROM faq WHERE id = ?";
  const values = [id];

  db.get(query, values, function (error, faq) {
    if (error) {
      const model = {
        dbError: true,
        faq,
      };
      response.render("update-faq.hbs", model);
    } else {
      const model = {
        dbError: false,
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

  const errorMessages = getErrorMessagesForFaqs(updatedQuestion, updatedAnswer);

  if (!request.session.isLoggedIn) {
    errorMessages.push(AUTHORIZATION_ERROR_MESSAGE);
  }

  if (errorMessages.length == 0) {
    const query = "UPDATE faq SET question = ?, answer = ? WHERE id = ?";
    const values = [updatedQuestion, updatedAnswer, id];

    db.run(query, values, function (error) {
      if (error) {
        errorMessages.push(DATABASE_ERROR_MESSAGE);
        const model = {
          errorMessages,
          faq: {
            question: updatedQuestion,
            answer: updatedAnswer,
          },
        };
        response.render("update-faq.hbs", model);
      } else {
        response.redirect("/faqs");
      }
    });
  } else {
    const model = {
      errorMessages,
      faq: {
        question: updatedQuestion,
        answer: updatedAnswer,
      },
    };
    response.render("update-faq.hbs", model);
  }
});

function getErrorMessagesForReviews(name, description, grade) {
  const errorMessages = [];

  if (name.length < REVIEW_NAME_MIN_LENGTH) {
    errorMessages.push("Error: Name can't be less than " + REVIEW_NAME_MIN_LENGTH + " characters long");
  } else if (REVIEW_NAME_MAX_LENGTH < name.length) {
    errorMessages.push("Error: Name may be at most " + REVIEW_NAME_MAX_LENGTH + " characters long");
  }

  if (description.length > REVIEW_DESCRIPTION_MAX_LENGTH){
    errorMessages.push("Error: Review may be at most" + REVIEW_DESCRIPTION_MAX_LENGTH + " characters long")
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

app.get("/reviews", function (request, response) {
  const query = "SELECT id, name, description, grade FROM reviews";
  db.all(query, function (error, reviews) {
    if (error) {
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
  const grade = parseInt(request.body.grade, 10);

  const errorMessages = getErrorMessagesForReviews(name, description, grade);

  if (errorMessages.length == 0) {
    const query =
      "INSERT INTO reviews (name, description, grade) VALUES (?, ?, ?)";
    const values = [name, description, grade];

    db.run(query, values, function (error) {
      if (error) {
        errorMessages.push(DATABASE_ERROR_MESSAGE);

        const model = {
          errorMessages,
          name,
          description,
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
      description,
      grade,
    };

    response.render("create-review.hbs", model);
  }
});


app.post("/review/delete/:id", function (request, response) {
  const id = request.params.id;

  const query = "DELETE FROM reviews WHERE id = ?";
  const values = [id];

  db.run(query, values, function (error) {
    if (error) {
      const model = {
        dbError: true,
      };
      response.render("review.hbs", model);
    } else {
      response.redirect("/reviews");
    }
  });
});

app.get("/review/:id", function (request, response) {
  const id = request.params.id;

  const query = "SELECT * FROM reviews WHERE id = ?";
  const values = [id];

  db.get(query, values, function (error, review) {
    if (error) {
      const model = {
        dbError: true,
        review,
      };
      response.render("review.hbs", model);
    } else {
      const model = {
        dbError: false,
        review,
      };
      response.render("review.hbs", model);
    }
  });
});

app.get("/update-review/:id", function (request, response) {
  const id = request.params.id;
  if(!request.session.isLoggedIn){
    response.redirect("/login");
  }
  const query = "SELECT * FROM reviews WHERE id = ?";
  const values = [id];

  db.get(query, values, function (error, review) {
    if (error){
      const model = {
        dbError: true,
      };
      response.render("update-review.hbs", model);
    } else {
      const model = {
        review,
        dbError: false,
      };
    response.render("update-review.hbs", model);
    }
  });
});

app.post("/update-review/:id", function (request, response) {
  const updatedName = request.body.name;
  const updatedDescription = request.body.description;
  const updatedGrade = parseInt(request.body.grade, 10);
  const id = request.params.id;

  const errorMessages = getErrorMessagesForReviews(updatedName, updatedDescription, updatedGrade);

  if (!request.session.isLoggedIn) {
    errorMessages.push(AUTHORIZATION_ERROR_MESSAGE);
  }
  
  if (errorMessages.length == 0) {
    const query =
      "UPDATE reviews SET name = ?, description = ?, grade = ? WHERE id = ?";
    const values = [updatedName, updatedDescription, updatedGrade, id];

    db.run(query, values, function (error) {
      if (error) {
        errorMessages.push(DATABASE_ERROR_MESSAGE);
        const model = {
          errorMessages,
          review: {
           name: updatedName,
           description: updatedDescription,
           grade: updatedGrade,
          },
        };
        response.render("update-review.hbs", model);
      } else {
        response.redirect("/reviews");
      }
    });
  } else {
    const model = {
      errorMessages,
      review: {
        name: updatedName,
        description: updatedDescription,
        grade: updatedGrade,
      },
    };
    response.render("update-review.hbs", model);
  }
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
