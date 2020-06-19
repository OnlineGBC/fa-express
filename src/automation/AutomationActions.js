const path = require("path");
const { promisify } = require("util");
const childProcess = require("child_process");
const utils = require("../utils");
const fs = require('fs');

const { spawn } = childProcess;
const exec = promisify(childProcess.exec);

class AutomationActions {
  constructor(database, mailer, logger) {
    this.database = database;
    this.mailer = mailer;
    this.logger = logger;
  }

  async runScript(scriptName, machinesIds, isImmediate, options = {}, folder, isSequential = true, logIds = false, machineLogId = false) {

    //let logMessage = `Running script ${scriptName}\n`;

    //await this.updateLogMessage(logMessage,machinesIds,logIds);
    
    if (!scriptName) {
      throw new Error("Invalid scriptName parameter");
    }
    const scriptPath =
      folder == ""
        ? path.resolve(__dirname, "../../scripts", scriptName)
        : path.resolve(__dirname, "../../scripts/" + folder, scriptName);
    const fileExists = await utils.checkFileExists(scriptPath);
    if (!fileExists) {
      throw new Error("script not found");
    }

    if (!machinesIds || !Array.isArray(machinesIds) || !machinesIds.length) {
      throw new Error("Invalid machineIds parameter");
    }
    const machines = await this.database.findMachineDetailsByIds(machinesIds);
    if (!machines.length) {
      throw new Error("No machines found with specified ids");
    }
    let runAt;
    if (!isImmediate) {
      console.log("received scheduleat = " + options.scheduleAt);
      const { scheduleAt } = options;
      if (
        typeof scheduleAt !== "number" ||
        !new Date(scheduleAt).getTime() ||
        scheduleAt < Date.now()
      ) {
        throw new Error("Invalid scheduleAts parameter");
      }
      runAt = scheduleAt;
    }
    return this.scheduleScript(
      runAt,
      scriptPath,
      machinesIds,
      machines,
      options,
      isSequential,
      logIds,
      machineLogId
    );
  }

  async scheduleScript(runAt, scriptPath, machinesIds, machines, options, isSequential, logIds, machineLogId) {

    const now = Date.now();
    if (!runAt) {
      runAt = now;
    }
    const immediate = runAt === now;
    const timeout = runAt - now;

    const thePromise = Promise.all(
      machines.map(async (machineDetails, index) => {
        //const machineId = machinesIds[index];
        let log;
        const machineId = machineDetails.dataValues.id;
        const scheduledAt = options.hasOwnProperty('scheduleAt') ? options.scheduleAt : null;
        if(!machineLogId){
          log = logIds.filter(logs => machineId == logs.machine)[0].log;
        }
        else{
          log = logIds.filter(logs => machineLogId == logs.log.dataValues.id)[0].log;
        }
        await utils.delay(timeout);
        let scriptName = path.basename(scriptPath);
        let logMessage = `Running script ${scriptName}\nHostName: ${machineDetails.hostName}\nIFN: ${machineDetails.internalFacingNetworkIp}\nCFN: ${machineDetails.customerFacingNetwork}\nSID: ${machineDetails.sid}\nCustName: ${machineDetails.custName}\n\n`;
        
        await this.updateLogMessage(logMessage, log);
        return this.runScriptOnMachine(scriptPath, machineId, machineDetails, {
          logId: log.id,
          ...options
        },
          isSequential,
          logMessage);
      })
    );
    if (isSequential) {
      return thePromise;
    }
  }

  async runScriptOnMachine(
    scriptPath,
    machineId,
    machineDetails,
    options = {},
    isSequential,
    initialLogContent
  ) {
    const { emailAddress = "", logId } = options;
    const { loginId, internalFacingNetworkIp, osType} = machineDetails;
    const hostWithLogin = `${loginId}@${internalFacingNetworkIp}`;
    const logFileName = utils.randomLogFileName();
    const isWindows = osType.toLowerCase().includes("windows");

    console.log("Before Content");
    let fileContents = '';
    let rcFile = '';
    let fileExt = path.extname(scriptPath).substr(1);
    let tempFile = scriptPath;
    let scriptName = path.basename(scriptPath);
    if (fileExt == 'cmd') {
      if (!isWindows) {
        const log = await this.database.updateLogContentById(
          logId,
          `${initialLogContent}The script ${scriptName} will not run on the *nix platform`,
          1
        );
        log.dataValues.status = 'fileError';
        log.dataValues.errorMsg = `Wrong OS`;
        console.log("wrong os");
        this.logger.notifyListeners(log);
        // Dispatch mail
        if (emailAddress) {
          this.mailer.sendMail(`${initialLogContent}The script ${scriptName} will not run on the *nix platform`, emailAddress).catch(console.error);
        }
        return 1;
      }
      rcFile = path.join(__dirname, "/../../scripts/", "rclevel.cmd");
    }
    else if (fileExt == 'sh') {
      if (isWindows) {
        const log = await this.database.updateLogContentById(
          logId,
          `${initialLogContent}The script ${scriptName} will not run on the Windows platform`,
          1
        );
        log.dataValues.status = 'fileError';
        log.dataValues.errorMsg = `Wrong OS`;
        console.log("wrong os");
        this.logger.notifyListeners(log);
        // Dispatch mail
        if (emailAddress) {
          this.mailer.sendMail(`${initialLogContent}The script ${scriptName} will not run on the Windows platform`, emailAddress).catch(console.error);
        }
        return 1;
      }
      rcFile = path.join(__dirname, "/../../scripts/", "rclevel.sh");
    }

    scriptPath = path.join(__dirname, "/../../scripts/", this.makeid(10) + '.' + fileExt);

    // Change below line to cat
    await exec(`cat ${tempFile} ${rcFile} > ${scriptPath}`);



    const scriptBaseName = path.basename(scriptPath);

    const tempFilePath = isWindows
      ? `C:\\temp\\${scriptBaseName}`
      : `/tmp/${scriptBaseName}`;
    const executableTmpFilePath = isWindows
      ? `C:/temp/${scriptBaseName}`
      : `/tmp/${scriptBaseName}`;
    const scpDestination = isWindows ? "/C:/temp/." : "/tmp/.";

    const commands = {
      copy: `scp -o StrictHostKeyChecking=no ${scriptPath} ${hostWithLogin}:${scpDestination}`,
      remove: `ssh -n -tt -o StrictHostKeyChecking=no ${hostWithLogin} ${
        isWindows ? "del" : "rm"
        } ${tempFilePath}`,
      chmod: isWindows
        ? null
        : `ssh -n -tt -o StrictHostKeyChecking=no ${hostWithLogin} chmod 777 ${tempFilePath}`
    };


    let logContent = "";
    let errorCode;
    /*console.log('Destination'+logId);
    logContent = await (await exec('dir')).stdout;
    console.log('creating log'); */

    try {
      await exec(commands.copy);
      console.log(
        `script copied to the remote server ${internalFacingNetworkIp}`
      );
      if (commands.chmod) {
        await exec(commands.chmod);
        console.log("script made executable successfully");
      }

      const stdout = await this.executeScriptOnHost(
        hostWithLogin,
        executableTmpFilePath
      );
      // Dispatch mail
      if (emailAddress) {
        this.mailer.sendMail(initialLogContent + stdout.output, emailAddress).catch(console.error);
      }

      logContent = stdout.output;
      errorCode = stdout.returnCode;
      console.log("The Log file saved");
      await exec(commands.remove);
      console.log("Script removed from the remote server");
    } catch (error) {
      console.error("Error while executing the script", error);
      logContent = error.toString();
      errorCode = error.code;
      // TODO: only send if the occurred while copying/executing the script.
      if (emailAddress) {
        this.mailer
          .sendMail(
            initialLogContent + error,
            emailAddress
          )
          .catch(console.error);
      }
    }

    fs.unlink(scriptPath, (err) => {
      //console.log(err);
    });

    // New message string added
    logContent = initialLogContent + logContent;

    const log = await this.database.updateLogContentById(
      logId,
      logContent,
      errorCode
    );
    console.log('The error code for id = ' + machineId + ' is = ' + errorCode);
    console.log('logs done');
    this.logger.writeLogFile(logFileName, log);
    if (errorCode == 0) {
      log.dataValues.status = 'completed';
      this.logger.notifyListeners(log);
    }
    //let returnCodeCommand = isWindows? 'echo.%errorlevel%' : 'echo $?';
    if (isSequential) {
      if (errorCode != 0) {
        log.dataValues.status = 'failed';
        this.logger.notifyListeners(log);
      }
      return errorCode;
    }
  }

  async executeScriptOnHost(hostWithLogin, scriptPath) {
    const ls = spawn("ssh", [
      "-n",
      "-o",
      "StrictHostKeyChecking=no",
      hostWithLogin,
      scriptPath
    ]);
    let fullOutput = "";
    let returnCode = "";
    ls.stdout.on("data", data => {
      fullOutput += data.toString();
    });

    return new Promise(resolve => {
      ls.on("exit", (returnCode) => {
        console.log("return code is " + returnCode);
        resolve({ output: fullOutput, returnCode })
      }
      );
    });
  }

  async updateLogMessage(message, logRef) {

    let log = await this.database.updateLogContentById(
      logRef.id,
      message,
      1
    );
    log.dataValues.status = 'processing';
    this.logger.notifyListeners(log);
    console.log("-----------");
  }
  makeid(length) {
    var result = 'TEMP-';
    var characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    var charactersLength = characters.length;
    for (var i = 0; i < length; i++) {
      result += characters.charAt(Math.floor(Math.random() * charactersLength));
    }
    return result;
  }
}

module.exports = AutomationActions;
