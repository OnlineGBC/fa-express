const moment = require('moment-timezone');
const { Op } = require('sequelize');
const path = require('path');
const bcrypt = require('bcrypt');

class Database {
  constructor(sequelize) {
    this.sequelize = sequelize;
    this.automationModel = this.sequelize.import(path.resolve(__dirname, '../model/Automation'));
    this.logsModel = this.sequelize.import(path.resolve(__dirname, '../model/Logs'));
    this.userModel = this.sequelize.import(path.resolve(__dirname, '../model/User'));
    this.sequelize.sync();
  }

  findUser(email) {
    return this.userModel.findOne(
      {
        where: {
          email
        }
      })
  }

  getUserById(id) {
    return this.userModel.findOne(
      {
        where: {
          id
        }
      })
  }

  async createUser(email, password, key, fname, lname) {

    const saltRounds = 10;

    const userModel = this.userModel;
console.log(key);
    // Create password hash
    bcrypt.genSalt(saltRounds, function (err, salt) {
      bcrypt.hash(password, salt, function (err, hash) {
        return userModel.create({
          fname,
          lname,
          email,
          password: hash,
          otp_key:key
        });
      });
    });
  }

  async findMachineDetailsByIds(ids) {
    return this.automationModel.findAll({
      where: {
        id: {
          [Op.in]: ids,
        },
      },
    });
  }

  async findAllMachines() {
    return this.automationModel.findAll();
  }

  async saveLog(machineId, content, generatedAt, scheduledAt, timezone = moment.tz.guess(), ScriptName = false, uid = null) {
    const machines = await this.findMachineDetailsByIds([machineId]);
    if (!machines[0]) {
      throw new Error('Machine not found');
    }
    const machineDetails = machines[0];
    const {
      HostName,
      IFN,
      CFN,
      SID,
      CUSTNAME,
    } = machineDetails;

    const formatTime = (date) => `${date.format('HH:mm')} ${date.zoneAbbr()}`;

    const dateGenerated = moment(generatedAt)
      .tz(moment.tz.guess());
    const timeGenerated = formatTime(dateGenerated);
    const formattedDateGenerated = dateGenerated.format('YYYY-MM-DD');
    const timezoneAbbreviation = dateGenerated.zoneAbbr();

    let formattedDateScheduled;
    let timeScheduled;
    if (scheduledAt) {
      const dateScheduled = moment(scheduledAt)
        .tz(timezone);
      formattedDateScheduled = dateScheduled.format('YYYY-MM-DD');
      timeScheduled = formatTime(dateScheduled);
    }

    return this.logsModel.create({
      uid,
      IFN,
      CFN,
      SID,
      HostName,
      content,
      CustName: CUSTNAME,
      DateGenerated: formattedDateGenerated,
      TimeGenerated: timeGenerated,
      DateScheduled: formattedDateScheduled,
      TimeScheduled: timeScheduled,
      TZ: timezoneAbbreviation,
      ScriptName,
      Status: "scheduled"
    });
  }

  findLogById(id) {
    return this.logsModel.findOne({
      where: {
        id,
      },
    });
  }

  async updateLogContentById(id, content, errorCode, Status = 'scheduled') {
    if (typeof errorCode !== 'number') {
      errorCode = null;
    }
    const logFile = await this.findLogById(id);
    if (!logFile) {
      throw new Error('Log not found');
    }
    return logFile
      .update({
        content,
        ErroCode: errorCode,
        Status
      });
  }
}

module.exports = Database;
