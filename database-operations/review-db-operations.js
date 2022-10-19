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

exports.getReviewById = function (id, callback) {
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

exports.updateReviewById = function (updatedName, updatedDescription, updatedGrade, id, callback) {
  const query = "UPDATE reviews SET name = ?, description = ?, grade = ? WHERE id = ?";
  const values = [updatedName, updatedDescription, updatedGrade, id];

  db.run(query, values, function (error) {
    callback(error);
  });
};
