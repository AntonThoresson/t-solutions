const sqlite3 = require("sqlite3");
const db = new sqlite3.Database("tsolutions-database.db");

db.run(`
  CREATE TABLE IF NOT EXISTS services (
    id INTEGER PRIMARY KEY,
    name TEXT,
    description TEXT
  )
`);

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
