var express = require('express'), 
router = express.Router();
var manager = require('../lib/manager');

router.get('/test', function(req, res) {
	console.log(manager.list());
	res.send(manager.list());
});

module.exports = router;