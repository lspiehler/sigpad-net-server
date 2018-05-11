var SerialPort = require('serialport');
var sigpad = require('./sigpad');
var usbDetect = require('usb-detection');

var port = 13377;
var sigpads = [];

var exitHandler = function() {
	usbDetect.stopMonitoring();
}

SerialPort.list().then(function(data) {
	for(var i = 0; i <= data.length - 1; i++) {
		if(data[i].manufacturer=='FTDI') {
			sigpads.push(new sigpad(data[i], port));
			port++;
		}
	}
	usbDetect.startMonitoring();
});

usbDetect.on('add', function(device) {
        console.log('Add: ', device);
});

usbDetect.on('remove', function(device) {
        console.log('Remove: ', device);
});

usbDetect.on('change', function(device) {
        console.log('Remove: ', device);
});

process.on('exit', function() {
        usbDetect.stopMonitoring();
        process.exit();
});

process.on('SIGINT', function() {
        usbDetect.stopMonitoring();
        process.exit();
});

process.on('SIGUSR1', function() {
        usbDetect.stopMonitoring();
        process.exit();
});

process.on('SIGUSR2', function() {
        usbDetect.stopMonitoring();
        process.exit();
});

process.on('uncaughtException', function() {
        usbDetect.stopMonitoring();
        process.exit();
});