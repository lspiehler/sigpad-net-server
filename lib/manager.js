var sigpad = require('./sigpad');
var SerialPort = require('serialport');

var port = 13377;
var sigpads = [];

var deviceExists = function(sigpad, scan) {
	for(var i = 0; i <= scan.length - 1; i++) {
		if(sigpad.device.comName==scan[i].comName) {
			return true;
		}
	}
	return false;
}

var entryExists = function(scan, sigpads) {
	for(var i = 0; i <= sigpads.length - 1; i++) {
		if(scan.comName==sigpads[i].device.comName) {
			//console.log(scan.comName + ' = ' +sigpads[i].device.comName);
			return sigpads[i];
		}
	}
	return false;
}

var manager = {
	add: function(ftdi) {
		let container = {
			port: port,
			device: ftdi,
			active: true,
			service: new sigpad(ftdi, port)
		}
		sigpads.push(container);
		port++;
		return;
	},
	list: function() {
		return sigpads;
	},
	rescan: function(callback) {
		let scan = [];
		SerialPort.list().then(function(data) {
			for(var i = 0; i <= data.length - 1; i++) {
				if(data[i].manufacturer=='FTDI') {
					scan.push(data[i]);
				}
			}
			//find devices that have been removed and terminate the com port and tcp server
			for(var i = 0; i <= sigpads.length - 1; i++) {
				if(deviceExists(sigpads[i], scan)) {
					//device still exists
				} else {
					console.log('Removed ' + sigpads[i].device.comName);
					//console.log(sigpads[i]);
					sigpads[i].active = false;
					sigpads[i].service.kill();
				}
			}
			//find devices that have been added
			for(var i = 0; i <= scan.length - 1; i++) {
				let entry = entryExists(scan[i],sigpads);
				if(entry) {
					if(entry.active) {
						//existing active device, do nothing
					} else {
						console.log('Reconnect previous device ' + entry.device.comName);
						entry.active = true;
						entry.service = new sigpad(entry.device, entry.port)
					}
				} else {
					console.log('Initialize new device ' + scan[i].comName);
					manager.add(scan[i]);
				}
			}
			callback(false, true);
			return;
		});
	}
}

module.exports = manager;