var SerialPort = require('serialport');
var usbDetect = require('usb-detection');
var express_ssl = require('./lib/express_ssl.js');
var express = require('express');
var bodyParser = require('body-parser')
var http = require('http');
var bodyParser = require('body-parser') ;
var mustacheExpress = require('mustache-express');

var app = express();
var rescan = false;

var http = http.createServer(function (req, res) {
	res.writeHead(301, {
		Location: "https://" + req.headers.host
	});
	res.end();
});

http.listen(80, function() {
	//listening on port 80
});

var exitHandler = function() {
	usbDetect.stopMonitoring();
}

express_ssl.getSSL(function(sslOptions) {
	var server = require('https').createServer(sslOptions, app).listen(443);
	var websocket = require('./lib/websocket.js');
	var io = websocket.getSocket(server);
	//var sock = require('socket.io').listen(server)
	
	app.get('/', function(req, res) {
		//let ip = req.headers['x-forwarded-for'] || req.connection.remoteAddress;
		//console.log('HTTPS connection from ' + ip);
		let template = {
			ip: req.headers['x-forwarded-for'] || req.connection.remoteAddress
		}
		res.render('index.html', template);
	});

	app.use(bodyParser.json()); 
	app.use(bodyParser.urlencoded({ extended: true })); // support encoded bodies.
	 
	// Register '.mustache' extension with The Mustache Express 
	app.engine('html', mustacheExpress());
	app.set('view engine', 'html');
	app.set('views', __dirname + '/views');
	app.use(express.static(__dirname + '/views'));
	app.use('/bower_components',  express.static(__dirname + '/bower_components'));
	
	app.use('/api/sigpad', require('./api/sigpad'));
	
	var manager = require('./lib/manager');
	
	io.sockets.on('connection',function (socket) {
		console.log('connection')
		socket.on(13377, function(data){
			console.log(data);
			let device = manager.getSigpadByPort(13377);
			//console.log(device);
			device.service.writeSocket(data);
		})
	});
	
	SerialPort.list().then(function(data) {
		for(var i = 0; i <= data.length - 1; i++) {
			if(data[i].manufacturer=='FTDI') {
				let sig = manager.add(data[i]);
			}
		}
		usbDetect.startMonitoring();
	});
	
	usbDetect.on('add', function(device) {
		if(!rescan) {
			rescan = true;
			setTimeout(function() {
				console.log('USB addition detected, triggering rescan');
				manager.rescan(function() {
					rescan = false;
				});
			}, 1000);
		}
	});

	usbDetect.on('remove', function(device) {
		if(!rescan) {
			rescan = true;
			setTimeout(function() {
				console.log('USB removal detected, triggering rescan');
				manager.rescan(function() {
					rescan = false;
				});
			}, 1000);
		}
	});

	usbDetect.on('change', function(device) {
		if(!rescan) {
			rescan = true;
			setTimeout(function() {
				console.log('USB change detected, triggering rescan');
				manager.rescan(function() {
					rescan = false;
				});
			}, 1000);
		}
	});
});

//app.engine('html', mustacheExpress());
//app.set('view engine', 'html');
//app.set('views', __dirname + '/views');

/*app.get('/', function(req, res) {
	res.redirect('/api/sigpad/sigpads');
});*/

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
