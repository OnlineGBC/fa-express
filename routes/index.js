const express = require('express');
const router = express.Router();

/* GET home page. */
/*router.get('/', function(req, res, next) {
  res.render('index', { title: 'Robotics Process Automation' });
});
*/
router.get('/', function (req, res, next) {
	res.render('index', {title : 'Robotics Process Automation'});
});

/*var io = socket(server);
io.on('connection', (socket) => {
  console.log('made socket connection', socket.id);
});
*/

module.exports = router;
