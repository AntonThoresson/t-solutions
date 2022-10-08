const express = require("express");
const router = express.Router();
const db = require("../db")

const FAQ_QUESTION_MAX_LENGTH = 300;
const FAQ_QUESTION_MIN_LENGTH = 5;
const FAQ_ANSWER_MAX_LENGTH = 300;
const FAQ_ANSWER_MIN_LENGTH = 2;

const DATABASE_ERROR_MESSAGE = "Error: Internal server error";
const AUTHORIZATION_ERROR_MESSAGE = "Error: You don't have admin access";

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

router.get("/", function (request, response) {
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

router.get("/create", function (request, response) {
  if (!request.session.isLoggedIn) {
    response.redirect("/login");
  } else {
    response.render("create-faq.hbs");
  }
});

router.post("/create", function (request, response) {
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

router.get("/:id", function (request, response) {
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

router.post("/delete/:id", function (request, response) {
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

router.get("/update/:id", function (request, response) {
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

router.post("/update/:id", function (request, response) {
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

module.exports = router;