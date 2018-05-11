var express = require('express'), 
router = express.Router();
var sigpad = require('../sigpad');

router.get('/test', function(req, res) {
	res.send('test');
});

module.exports = router;