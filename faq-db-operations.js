const sqlite3 = require("sqlite3");
const db = new sqlite3.Database("tsolutions-database.db");

db.run(`
  CREATE TABLE IF NOT EXISTS faq (
    id INTEGER PRIMARY KEY,
    question TEXT,
    answer TEXT
  )
`);

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