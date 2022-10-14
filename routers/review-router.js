const express = require("express");
const router = express.Router();
const db = require("../database-operations/review-db-operations")

const REVIEW_NAME_MAX_LENGTH = 50;
const REVIEW_NAME_MIN_LENGTH = 2;
const REVIEW_GRADE_MAX = 10;
const REVIEW_GRADE_MIN = 0;
const REVIEW_DESCRIPTION_MAX_LENGTH = 500;

const DATABASE_ERROR_MESSAGE = "Error: Internal server error";
const AUTHORIZATION_ERROR_MESSAGE = "Error: You don't have admin access";

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

router.get("/", function (request, response) {
  db.getAllReviews(function (error, reviews) {
    if (error) {
      const model = {
        dbError: true,
        reviews,
      };
      response.render("reviews.hbs", model);
    } else {
      const model = {
        dbError: false,
        reviews,
      };
      response.render("reviews.hbs", model);
    }
  });
});

router.get("/create", function (request, response) {
  response.render("create-review.hbs");
});



router.post("/create", function (request, response) {
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

router.get("/:id", function (request, response) {
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

router.post("/delete/:id", function (request, response) {
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

router.get("/update/:id", function (request, response) {
  const id = request.params.id;
  if(!request.session.isLoggedIn){
    response.redirect("/login");
  }
  db.getReviewById(id, function (error, review) {
    if (error){
      const model = {
        dbError: true,
        review,
      };
      response.render("update-review.hbs", model);
    } else {
      const model = {
        dbError: false,
        review,
      };
    response.render("update-review.hbs", model);
    }
  });
});

router.post("/update/:id", function (request, response) {
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

module.exports = router;