const {database} = require('./container');

console.log("Initiating sequence...");

console.log("Truncating table Jobs");
const promise1 = database.jobsModel.destroy({ truncate: true }).then(()=> console.log("Jobs Table truncated."));

console.log("Truncating table Periodic_jobs");
const promise2 = database.periodicModel.destroy({ truncate: true }).then(()=> console.log("Periodic_jobs Table truncated."));

console.log("Truncating table Logs");
const promise3 = database.logsModel.destroy({ truncate: true }).then(()=> console.log("Logs Table truncated."));

Promise.all([promise1,promise2,promise3]).then(()=>{
    process.exit(1);
})