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

/* Database operations for services page */

exports.getAllServices = function (callback) {
  const query = "SELECT * FROM services";

  db.all(query, function (error, services) {
    callback(error, services);
  });
};

exports.createService = function (name, description, callback) {
  const query = "INSERT INTO services (name, description) VALUES (?, ?)";
  const values = [name, description];

  db.run(query, values, function (error) {
    callback(error);
  })
};

exports.getServiceById = function (id, callback) {
  const query = "SELECT * FROM services WHERE id = ?";
  const values = [id];

  db.get(query, values, function (error, service) {
    callback(error, service);
  });
};

exports.deleteServiceById = function (id, callback) {
  const query = "DELETE FROM services WHERE id = ?";
  const values = [id];

  db.run(query, values, function (error) {
    callback(error);
  });
};

exports.updateServiceById = function (updatedName, updatedDescription, id, callback) {
  const query = "UPDATE services SET name = ?, description = ? WHERE id = ?";
  const values = [updatedName, updatedDescription, id];

  db.run(query, values, function (error) {
    callback(error);
  });
};

/* Database operations for FAQ page */

exports.getAllFAQS = function (callback) {
  const query = "SELECT * FROM faq";

  db.all(query, function (error, faqs) {
    callback(error, faqs);
  });
};

exports.createFAQ = function (question, answer, callback) {
  const query = "INSERT INTO faq (question, answer) VALUES (?, ?)";
  const values = [question, answer];

  db.run(query, values, function (error) {
    callback(error);
  });
};

exports.getFAQById = function (id, callback){
  const query = "SELECT * FROM faq WHERE id = ?";
  const values = [id];

  db.get(query, values, function (error, faq) {
    callback(error, faq);
  });
};

exports.deleteFAQById = function (id, callback) {
  const query = "DELETE FROM faq WHERE id = ?";
  const values = [id];

  db.run(query, values, function (error) {
    callback(error);
  });
};

exports.updateFAQById = function (updatedQuestion, updatedAnswer, id, callback) {
  const query = "UPDATE faq SET question = ?, answer = ? WHERE id = ?";
  const values = [updatedQuestion, updatedAnswer, id];

  db.run(query, values, function (error) {
    callback(error);
  });
};

/* Database operations for reviews */

exports.getAllReviews = function (callback) {
  const query = "SELECT * FROM reviews";

  db.all(query, function (error, reviews) {
    callback(error, reviews);
  });
};

exports.createReview = function (name, description, grade, callback) {
  const query = "INSERT INTO reviews (name, description, grade) VALUES (?, ?, ?)";
  const values = [name, description, grade];

  db.run(query, values, function (error) {
    callback(error);
  });
};

exports.getReviewById = function (id, callback){
  const query = "SELECT * FROM reviews WHERE id = ?";
  const values = [id];

  db.get(query, values, function (error, review) {
    callback(error, review);
  });
};

exports.deleteReviewById = function (id, callback) {
  const query = "DELETE FROM reviews WHERE id = ?";
  const values = [id];

  db.run(query, values, function (error) {
    callback(error);
  });
};

exports.updateReviewById = function (updatedName, updatedDescription, updatedGrade,id, callback) {
  const query = "UPDATE reviews SET name = ?, description = ?, grade = ? WHERE id = ?";
  const values = [updatedName, updatedDescription, updatedGrade, id];

  db.run(query, values, function (error) {
    callback(error);
  });
};