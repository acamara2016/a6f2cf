const Sequelize = require("sequelize");
const user = 'postgres'
const host = 'localhost'
const database = 'messenger'
const password = 'password'
const port = '5432'
const db = new Sequelize(database, user, password, {
  host,
  port,
  dialect: 'postgres',
  logging: false
})
// const db = new Sequelize(process.env.DATABASE_URL || "postgres://localhost:5432/messenger", {
//   logging: false
// });

module.exports = db;
