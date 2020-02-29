const fs = require('fs');
const { promisify } = require('util');

const writeFile = promisify(fs.writeFile);

const LOGS_DIR = './logs/';

class Logger {
  async writeLogFile(data, fileName) {
    return writeFile(LOGS_DIR + fileName, data);
  }
}

module.exports = Logger;
