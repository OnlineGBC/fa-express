const fs = require('fs');
const { promisify } = require('util');

const writeFile = promisify(fs.writeFile);

const LOGS_DIR = './logs/';

class Logger {
  constructor() {
    this.onSaveLogListeners = [];
  }

  addOnSaveLogListener(listener) {
    if (typeof listener !== 'function') {
      throw new Error('listener must be a function');
    }
    this.onSaveLogListeners.push(listener);
  }

  async writeLogFile(data, fileName, logId) {
    await writeFile(LOGS_DIR + fileName, data);
    for (const listener of this.onSaveLogListeners) {
      listener(data, fileName, logId);
    }
  }
}

module.exports = Logger;
