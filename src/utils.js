const { promisify } = require('util');
const fs = require('fs');

const access = promisify(fs.access);

function randomLogFileName() {
  return Math.random()
    .toString(36)
    .substring(7) + '.txt';
}

function checkFileExists(filePath) {
  return access(filePath, fs.constants.F_OK)
    .then(() => true)
    .catch(() => false);
}

const delay = (timeout) => new Promise((resolve) => setTimeout(resolve, timeout));

module.exports = {
  randomLogFileName,
  checkFileExists,
  delay,
};
