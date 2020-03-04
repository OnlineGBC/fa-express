const moment = require('moment-timezone');
const { Op } = require('sequelize');
const path = require('path');

class Database {
  constructor(sequelize) {
    this.sequelize = sequelize;
    this.automationModel = this.sequelize.import(path.resolve(__dirname, '../model/Automation'));
    this.logsModel = this.sequelize.import(path.resolve(__dirname, '../model/Logs'));
    this.sequelize.sync();
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

  async saveLog(machineId, content, generatedAt, scheduledAt, timezone = moment.tz.guess()) {
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
    });
  }

  findLogById(id) {
    return this.logsModel.findOne({
      where: {
        id,
      },
    });
  }

  async updateLogContentById(id, content, errorCode) {
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
      });
  }
}

module.exports = Database;
