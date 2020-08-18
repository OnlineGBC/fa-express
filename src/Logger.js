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

  notifyListeners(log, uid = false) {
    console.log("LOG UID = " + uid);
    console.log("LOG UID2 = " + log.uid);
    if(log.uid != uid){
      return;
    }
    for (const listener of this.onSaveLogListeners) {
      listener(log);
    }
  }

  async writeLogFile(fileName, log) {
    await writeFile(LOGS_DIR + fileName, log.content);
  }
}

module.exports = Logger;
