const { database } = require('../container');

const tasks = [];

const add = async (task,title,uid) => {
  console.log("Saving Job");
  const job = await database.saveJob(title,uid);
  const id = job.id;

  // Save job id to each log
 // await database.updateLogsWithJob(id,logs);
  const taskId = "job_"+id;
  tasks[taskId] = task;
  return id;
};

const get = (id) => {
  const taskId = "job_"+id;
  return tasks[taskId];
}

const remove = async (id) => {
  const taskId = "job_"+id;
  // Remove entry from database
  delete tasks[taskId];
  await database.clearJob(id);
  console.log("Running Tasks = " + tasks.length);
  return;
}


module.exports = {
  add,
  get,
  remove,
  tasks
};