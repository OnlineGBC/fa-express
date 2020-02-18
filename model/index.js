"use strict";

var fs = require("fs");
var path = require("path");
var Sequelize = require("sequelize");
var basename = path.basename(__filename);
var db = {};

let db_name = "FA_RPA";
let user = "root";
let pword = "";

if (process.env.DB_PASS && process.env.DB_PASS === "none") {
  pword = "";
}

var sequelize = new Sequelize(db_name, user, pword, {
  host: "127.0.0.1",
  dialect: "mysql",
  define: {
    timestamps: false
  }
});

fs.readdirSync(__dirname)
  .filter(file => {
    return (
      file.indexOf(".") !== 0 && file !== basename && file.slice(-3) === ".js"
    );
  })
  .forEach(file => {
    var model = sequelize["import"](path.join(__dirname, file));
    db[model.name] = model;
  });

Object.keys(db).forEach(modelName => {
  if (db[modelName].associate) {
    db[modelName].associate(db);
  }
});

db.sequelize = sequelize;
db.Sequelize = Sequelize;

module.exports = db;
