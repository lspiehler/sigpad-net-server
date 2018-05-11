var express = require('express'), 
router = express.Router();
var manager = require('../lib/manager');

router.get('/sigpads', function(req, res) {
	//console.log(manager.list());
	var stats = [];
	var status = manager.list();
	for(var i = 0; i <= status.length - 1; i++) {
		var sigpad = {
			name: status[i].device.comName,
			active: status[i].active,
			tcpport: status[i].port,
			clients: status[i].service.getClients()
		}
		stats.push(sigpad);
	}
	res.json(stats);
});

module.exports = router;