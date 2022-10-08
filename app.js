const express = require("express");
const expressHandlebars = require("express-handlebars");
const expressSession = require("express-session");
const bcrypt = require("bcrypt");
const db = require("./db.js") 
const serviceRouter = require("./routers/service-router")

const REVIEW_NAME_MAX_LENGTH = 50;
const REVIEW_NAME_MIN_LENGTH = 2;
const REVIEW_GRADE_MAX = 10;
const REVIEW_GRADE_MIN = 0;
const REVIEW_DESCRIPTION_MAX_LENGTH = 500;

const ADMIN_USERNAME = "tsolutions";
const ADMIN_PASSWORD = "$2b$10$AG3N/Bg2Ygd4I/dx1GbKIOSzK9qqnPm8ytew5NCIKZrQ6JbAvtFhG";

const FAQ_QUESTION_MAX_LENGTH = 300;
const FAQ_QUESTION_MIN_LENGTH = 5;
const FAQ_ANSWER_MAX_LENGTH = 300;
const FAQ_ANSWER_MIN_LENGTH = 2;

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

app.use("/services", serviceRouter);

app.get("/", function (request, response) {
  response.render("home.hbs");
});

app.get("/about", function (request, response) {
  response.render("about.hbs");
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
  db.getAllFAQS(function (error, faqs) {
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

  db.getFAQById(id, function (error, faq) {
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

  if (request.session.isLoggedIn) {


    db.deleteFAQById(id, function (error) {
      if (error) {
        const model = {
          dbError: true,
        };
        response.render("review.hbs", model);
      } else {
        response.redirect("/faqs");
      }
    });
  } else {
    response.redirect("/login");
  }
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
    db.createFAQ(question, answer, function (error) {
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

  db.getFAQById(id, function (error, faq) {
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
    db.updateFAQById(updatedQuestion, updatedAnswer, id, function (error) {
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
  db.getAllReviews(function (error, reviews) {
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
    db.createReview(name, description, grade, function (error) {
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

  if (request.session.isLoggedIn) {
    db.deleteReviewById(id, function (error) {
      if (error) {
        const model = {
          dbError: true,
        };
        response.render("review.hbs", model);
      } else {
        response.redirect("/reviews");
      }
    });
  } else {
    response.redirect("/login");
  }
});

app.get("/review/:id", function (request, response) {
  const id = request.params.id;
  db.getReviewById(id, function (error, review) {
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
  db.getReviewById(id, function (error, review) {
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
    db.updateReviewById(updatedName, updatedDescription, updatedGrade, id, function (error) {
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

app.listen(6969);
