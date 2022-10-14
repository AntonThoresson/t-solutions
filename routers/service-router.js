const express = require("express");
const router = express.Router();
const db = require("../database-operations/service-db-operations")

const SERVICE_NAME_MAX_LENGTH = 50;
const SERVICE_NAME_MIN_LENGTH = 5;
const SERVICE_DESCRIPTION_MAX_LENGTH = 300;
const SERVICE_DESCRIPTION_MIN_LENGTH = 10;

const DATABASE_ERROR_MESSAGE = "Error: Internal server error";
const AUTHORIZATION_ERROR_MESSAGE = "Error: You don't have admin access";

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

router.get("/", function (request, response) {
  db.getAllServices(function (error, services) {
    if (error) {
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

router.get("/create", function (request, response) {
  if (!request.session.isLoggedIn){
    response.redirect("/login");
  } else {
    response.render("create-service.hbs");
  }
});

router.post("/create", function (request, response) {
  const name = request.body.name;
  const description = request.body.description;

  const errorMessages = getErrorMessagesForServices(name, description);

  if (!request.session.isLoggedIn) {
    errorMessages.push(AUTHORIZATION_ERROR_MESSAGE);
  }

  if (errorMessages.length == 0) {
    db.createService(name, description, function (error) {
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

router.get("/:id", function (request, response) {
  const id = request.params.id;

  if (!request.session.isLoggedIn) {
    response.redirect("/login");
  }

  db.getServiceById(id, function (error, service) {
    if (error) {
      const model = {
        dbError: true,
        service,
      };
      response.render("service.hbs", model);
    } else {
      const model = {
        dbError: false,
        service,
      };
      response.render("service.hbs", model);
    }
  });
});

router.post("/delete/:id", function (request, response) {
  const id = request.params.id;
  if (request.session.isLoggedIn) {
    db.deleteServiceById(id, function (error) {
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
    response.redirect("/login");
  }
});

router.get("/update/:id", function (request, response) {
  const id = request.params.id;

  if (!request.session.isLoggedIn) {
    response.redirect("/login");
  }

  db.getServiceById(id, function (error, service) {
    if (error) {
      const model = {
        dbError: true,
        service,
      };
      response.render("update-service.hbs", model);
    } else {
      const model = {
        dbError: false,
        service,
      };
      response.render("update-service.hbs", model);
    }
  });
});

router.post("/update/:id", function (request, response) {
  const updatedName = request.body.name;
  const updatedDescription = request.body.description;
  const id = request.params.id;

  const errorMessages = getErrorMessagesForServices(updatedName, updatedDescription);

  if (!request.session.isLoggedIn) {
    errorMessages.push(AUTHORIZATION_ERROR_MESSAGE);
  }

  if (errorMessages.length == 0) {


    db.updateServiceById(updatedName, updatedDescription, id, function (error) {
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

module.exports = router;