const path = require('path');
const { promisify } = require('util');
const childProcess = require('child_process');
const utils = require('../utils');

const exec = promisify(childProcess.exec);

class AutomationActions {
  constructor(database, mailer, logger) {
    this.database = database;
    this.mailer = mailer;
    this.logger = logger;
  }

  async runScript(scriptName, machinesIds, isImmediate, options = {}) {
    if (!scriptName) {
      throw new Error('Invalid scriptName parameter');
    }
    const scriptPath = path.resolve(__dirname, '../../scripts', scriptName);
    const fileExists = await utils.checkFileExists(scriptPath);
    if (!fileExists) {
      throw new Error('script not found');
    }

    if (!machinesIds || !Array.isArray(machinesIds) || !machinesIds.length) {
      throw new Error('Invalid machineIds parameter');
    }
    const machines = await this.database.findMachineDetailsByIds(machinesIds);
    if (!machines.length) {
      throw new Error('No machines found with specified ids');
    }
    let runAt;
    if (!isImmediate) {
      const { scheduleAt } = options;
      if (typeof scheduleAt !== 'number' || !(new Date(scheduleAt)).getTime() || scheduleAt < Date.now()) {
        throw new Error('Invalid scheduleAt parameter');
      }
      runAt = scheduleAt;
    }
    return this.scheduleScript(runAt, scriptPath, machinesIds, machines, options);
  }

  async scheduleScript(runAt, scriptPath, machinesIds, machines, options) {
    const now = Date.now();
    if (!runAt) {
      runAt = now;
    }
    const immediate = runAt === now;
    const timeout = runAt - now;

    Promise.all(machines.map(async (machineDetails, index) => {
      const machineId = machinesIds[index];
      const scheduledAt = immediate ? null : runAt;
      const log = await this.database.saveLog(machineId, null, now, scheduledAt, options.timezone);
      await utils.delay(timeout);
      return this.runScriptOnMachine(scriptPath, machineId, machineDetails, {
        logId: log.id,
        ...options,
      });
    }));
  }

  async runScriptOnMachine(scriptPath, machineId, machineDetails, options = {}) {
    const {
      emailAddress = '',
      logId,
    } = options;
    const { loginId, internalFacingNetworkIp, osType } = machineDetails;
    const hostWithLogin = `${loginId}@${internalFacingNetworkIp}`;
    const logFileName = utils.randomLogFileName();

    const scriptBaseName = path.basename(scriptPath);

    const isWindows = osType.toLowerCase()
      .includes('windows');

    const tempFilePath = isWindows ? `C:/temp/${scriptBaseName}` : `/tmp/${scriptBaseName}`;

    const commands = {
      copy: `scp -o StrictHostKeyChecking=no ${scriptPath} ${hostWithLogin}:/tmp/.`,
      remove: `ssh -n -tt -o StrictHostKeyChecking=no ${isWindows ? 'del' : 'rm'} ${tempFilePath}`,
      chmod: isWindows ? null : `ssh -n -tt -o StrictHostKeyChecking=no chmod 777 /tmp/${scriptBaseName}`,
      execute: `ssh -n -tt -o StrictHostKeyChecking=no /tmp/${scriptBaseName}`,
    };

    let logContent = '';
    let errorCode;
    try {
      await exec(commands.copy);
      console.log(`script copied to the remote server ${internalFacingNetworkIp}`);
      if (commands.chmod) {
        await exec(commands.chmod);
        console.log('script made executable successfully');
      }
      const { stdout } = await exec(commands.execute);

      // Dispatch mail
      if (emailAddress) {
        this.mailer.sendMail(stdout, emailAddress)
          .catch(console.error);
      }

      logContent = stdout;
      console.log('The Log file saved');
      await exec(commands.remove);
      console.log('Script removed from the remote server');
    } catch (error) {
      console.error('Error while executing the script', error);
      logContent = error.toString();
      errorCode = error.code;
      // TODO: only send if the occurred while copying/executing the script.
      if (emailAddress) {
        this.mailer.sendMail(
          'Error occurred. Please contact developer or your internal technical support.',
          emailAddress,
        )
          .catch(console.error);
      }
    }
    this.database.updateLogContentById(logId, logContent, errorCode);
    this.logger.writeLogFile(logContent, logFileName, logId);
  }
}

module.exports = AutomationActions;
