const express = require('express');
const router = express.Router();

/* GET home page. */
/*router.get('/', function(req, res, next) {
  res.render('index', { title: 'Express' });
});
*/

router.get('/', function (req, res, next) {
    var sql = "SELECT * FROM FA_RPA.Automation";
    db.query(sql, function (err, result, field) {
	    console.log(result);
        res.render('index', {
	    title: 'Express',
            automation: result
        });
    });
});



module.exports = router;
