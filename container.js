const { Sequelize } = require('sequelize');
const mysql2 = require('mysql2');
const AutomationActions = require('./src/automation/AutomationActions');
const Logger = require('./src/Logger');
const Mailer = require('./src/Mailer');
const Database = require('./src/Database');

let databasePassword = '1qaz@WSX';
if (process.env.DB_PASS) {
  databasePassword = process.env.DB_PASS === 'none' ? '' : process.env.DB_PASS;
}

const databaseHost = process.env.DB_HOST || 'localhost';
const databaseName = process.env.DB_NAME || 'FA_RPA';
const databaseUser = process.env.DB_USER || 'rpaauto';

const sequelize = new Sequelize(databaseName, databaseUser, databasePassword, {
  host: databaseHost,
  dialect: 'mysql',
  define: {
    timestamps: false,
  },
  logging: false,
});

const dbConnection = mysql2.createConnection({
  host: databaseHost,
  database: databaseName,
  user: databaseUser,
  password: databasePassword,
});

const database = new Database(sequelize);
const mailer = new Mailer();
const logger = new Logger();
const automationActions = new AutomationActions(database, mailer, logger);

module.exports = {
  dbConnection,
  database,
  logger,
  mailer,
  automationActions,
};
