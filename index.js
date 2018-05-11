var SerialPort = require('serialport');
var sigpad = require('./sigpad');

var port = 13377;
var sigpads = [];

SerialPort.list().then(function(data) {
	for(var i = 0; i <= data.length - 1; i++) {
		if(data[i].manufacturer=='FTDI') {
			sigpads.push(new sigpad(data[i], port));
			port++;
		}
	}
});

var usbDetect = require('usb-detection');

process.on('SIGINT', function() {
        usbDetect.stopMonitoring();
        process.exit();
});

usbDetect.startMonitoring();

usbDetect.on('add', function(device) {
        console.log('Add: ', device);
});

usbDetect.on('remove', function(device) {
        console.log('Remove: ', device);
});