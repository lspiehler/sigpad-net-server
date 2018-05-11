var SerialPort = require('serialport');
var manager = require('./lib/manager');
var usbDetect = require('usb-detection');
var express_ssl = require('./lib/express_ssl.js');
var express = require('express');
var bodyParser = require('body-parser')

var app = express();
var rescan = false;

var exitHandler = function() {
	usbDetect.stopMonitoring();
}

SerialPort.list().then(function(data) {
	for(var i = 0; i <= data.length - 1; i++) {
		if(data[i].manufacturer=='FTDI') {
			let sig = manager.add(data[i]);
		}
	}
	usbDetect.startMonitoring();
});

express_ssl.getSSL(function(sslOptions) {
	var server = require('https').createServer(sslOptions, app).listen(443);
});

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true })); // support encoded bodies.

//app.engine('html', mustacheExpress());
//app.set('view engine', 'html');
//app.set('views', __dirname + '/views');

app.use('/api/sigpad', require('./api/sigpad'));

app.get('/', function(req, res) {
	res.redirect('/api/sigpad/sigpads');
});

usbDetect.on('add', function(device) {
	if(!rescan) {
		rescan = true;
	        console.log('USB addition detected, triggering rescan');
		manager.rescan(function() {
			rescan = false;
		});
	}
});

usbDetect.on('remove', function(device) {
	if(!rescan) {
		rescan = true;
	        console.log('USB removal detected, triggering rescan');
		manager.rescan(function() {
			rescan = false;
		});
	}
});

usbDetect.on('change', function(device) {
	if(!rescan) {
		rescan = true;
	        console.log('USB change detected, triggering rescan');
		manager.rescan(function() {
			rescan = false;
		});
	}
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

/*process.on('uncaughtException', function() {
        usbDetect.stopMonitoring();
        process.exit();
});*/