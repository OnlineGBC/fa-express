const express = require("express");
const { automationActions } = require("../../container");

const router = express.Router();

router.post("/", async (req, res) => {

  let {
    rows,
    isImmediate = true,
    scheduleAt,
    emailAddress= '',
    timezone = '',
    continueOnErrors
  } = req.body;


  function compare( a, b ) {
    if ( a.Order_Exec < b.Order_Exec ){
      return -1;
    }
    if ( a.Order_Exec > b.Order_Exec ){
      return 1;
    }
    return 0;
  }
  
  
  /* rows = [ { id: 9,
    HostName: 'mgbacfgr',
    LoginID: 'rpaauto',
    CMD_PREFIX: 'sudo su -',
    IFN: '10.177.68.48',
    CFN: '10.140.4.48',
    OSType: 'AIX',
    SID: 'DFG',
    DBTYPE: 'db6',
    AppType: 'StandardABAPJava',
    num1: 0,
    num2: 0,
    num3: 0,
    num4: 0,
    num5: 0,
    Order_Exec: 1,
    CDIR: 'MGB',
    CUSTNAME: 'MegaBrands',
    LOCATION: 'NYC',
    HOST_TYPE: 'PRIMARY',
    scriptName: 'WinCommands.bat',
    folderKey: '' },
  { id: 19,
    HostName: 'mgbadslr',
    LoginID: 'rpaauto',
    CMD_PREFIX: 'sudo su -',
    IFN: '10.177.68.14',
    CFN: '10.140.4.14',
    OSType: 'AIX',
    SID: 'DSL',
    DBTYPE: 'db6',
    AppType: 'StandardABAPJava',
    num1: 0,
    num2: 0,
    num3: 0,
    num4: 0,
    num5: 0,
    Order_Exec: 1,
    CDIR: 'MGB',
    CUSTNAME: 'MegaBrands',
    LOCATION: 'NYC',
    HOST_TYPE: 'PRIMARY',
    scriptName: 'LinuxPatchCheck.sh',
    folderKey: 'HPUX' },
   { id: 12,
    HostName: 'mgbrxxir',
    LoginID: 'rpaauto',
    CMD_PREFIX: 'sudo su -',
    IFN: '10.177.68.55',
    CFN: '10.140.4.55',
    OSType: 'AIX',
    SID: 'XXI',
    DBTYPE: 'db6',
    AppType: 'StandardABAPJava',
    num1: 0,
    num2: 0,
    num3: 0,
    num4: 0,
    num5: 0,
    Order_Exec: 2,
    CDIR: 'MGB',
    CUSTNAME: 'MegaBrands',
    LOCATION: 'NYC',
    HOST_TYPE: 'PRIMARY',
    scriptName: 'LinuxPatchCheck.sh',
    folderKey: 'HPUX' },
  { id: 63,
    HostName: 'LinAlert1P',
    LoginID: 'funauto',
    CMD_PREFIX: 'sudo su -',
    IFN: '10.0.0.109',
    CFN: '192.168.86.38',
    OSType: 'Ubuntu_Linux',
    SID: 'CIQ',
    DBTYPE: 'non',
    AppType: 'StandardABAPJava',
    num1: 0,
    num2: 0,
    num3: 0,
    num4: 0,
    num5: 0,
    Order_Exec: 3,
    CDIR: 'GBC',
    CUSTNAME: 'GBC',
    LOCATION: 'Tucson',
    HOST_TYPE: 'PRIMARY',
    scriptName: 'LinuxPatchCheck.sh',
    folderKey: 'HPUX' } 
]; */

  // Rows sorted according to order
  sortedRows = rows.sort(compare);

  // Array containing set of same order_Exec
  let orderArray = Array();
  let orderSet = Array();
  let start = 0;

  for(let i=0 ; i < sortedRows.length; i++){
    if(sortedRows[i].Order_Exec > start){
      if(start > 0){
        orderArray.push(orderSet);
      }
      // Reset the array when order number changes
      orderSet = Array();
      start = sortedRows[i].Order_Exec;
    }
    orderSet.push(sortedRows[i]);
    if(i == sortedRows.length-1){
      orderArray.push(orderSet);
    }
  }

  orderNum = 1;

  //Remove below after test and uncomment up
  beginExecution(0);

  async function beginExecution(index){
    let rows = orderArray[index];
    let rowsPlaceholder = rows;
    errorCode = false;

    index++;
    rows.forEach(async function(row,row_i){
      console.log('Is immediate'+isImmediate);
      scriptName = row.scriptName;
      machineIds = [row.id];
      folder = row.folderKey;
      try {
        console.log('starting with:'+row.id);
        let returnCode = await automationActions.runScript(
          scriptName,
          machineIds,
          isImmediate,
          {
            scheduleAt,
            emailAddress,
            timezone
          },
          folder,
          true
        );
        if(errorCode)
          return;
        console.log('Successfull results for '+row.id);
        row.errorCode = returnCode;
        row.status = 'completed';
        
        //Check if all rows are completed before proceeding with next group of order
        allStatus = true;
        console.log("Global Error Status = " +errorCode);
        
        rowsPlaceholder.some(function(tempRow,theIndex){
          if(!('status' in tempRow)){
            allStatus = false;
          }
          if(('errorCode' in tempRow) && (tempRow.errorCode != 0) && (typeof tempRow.errorCode != 'undefined')){
            console.log('Error Code status for '+tempRow.id);
            console.log('Error code exists = '+ ('errorCode' in tempRow));
            console.log('ErrorCode = '+tempRow.errorCode);
            console.log(typeof tempRow.errorCode != 'undefined');
            console.log(tempRow.errorCode != 0);
            errorCode = true;
            filteredRow = rows.filter(obj => {
              return obj.id === tempRow.id
            })
            filteredRow[0].errorCode = undefined;
            console.log('RRunniign the loop for index '+theIndex);
          }
          return errorCode;
        })

        //Stop execution if error is returned
        if(errorCode && !continueOnErrors){
          console.log('Found an error. Stopping script execution');
          res.json({
            status: "failed"
          });
          return;
        }
        else if(allStatus){
          if(index < orderArray.length){
          beginExecution(index);
        }
          else{
            console.log("Returning after successful execution");
            res.json({
              status: "success"
            }); // Send response after all scripts have run. Otherwise HTTP_HEADERS_SENT will be thrown
            return;
          }
        }

      } catch (error) {
        if(continueOnErrors){
          console.log('Found Errors. Skipping to next set of rows');
          beginExecution(index);
        }
        res.status(400).json({
          status: "error",
          error: error.message
        });
      }
      isImmediate = true;
    })
  }
});

module.exports = router;
