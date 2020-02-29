const express = require('express');

const router = express.Router();
const { database } = require('../container');

/* GET home page. */
/* router.get('/', function(req, res, next) {
  res.render('index', { title: 'Robotics Process Automation' });
});
*/
router.get('/', (req, res) => {
  database.logsModel.findAll({ limit: 1, order: [['id', 'DESC']] })
    .then((result) => {
      if (result.length) req.session.lastLogId = result[0].id;
      else req.session.lastLogId = 0;
      res.render('index', {
        title: 'Robotics Process Automation',
      });
    })
    .catch((err) => {
      req.session.lastLogId = 0;
      res.render('index', {
        title: 'Robotics Process Automation',
      });
    });
});

/* var io = socket(server);
io.on('connection', (socket) => {
  console.log('made socket connection', socket.id);
});
*/

module.exports = router;
