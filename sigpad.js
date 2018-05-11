var SerialPort = require('serialport');
var net = require('net');

var sigpad = function(comport, tcpport) {
	var multiplex = false;
	var sockets = [];
	var comport = comport;
	var tcpport = tcpport;
	
	var port = new SerialPort(comport.comName, {
		autoOpen: false,
		baudRate: 19200,
		parity: 'odd'
	});
	
	this.kill = function() {
		port.close();
		server.close();
	}
	
	// The open event is always emitted
	port.on('open', function() {
		// open logic
	});

	port.on('error', function(e) {
		console.log(e);
	});

	var openCOMPort = function() {
		port.open(function (err) {
			if (err) {
				setTimeout(function() {
					openCOMPort();
				}, 10000);
				return console.log('Error opening port: ', err.message);
			} else {
				console.log('com port ' + comport.comName + ' opened on tcp port ' + tcpport);
			}
		});
	}
	
	openCOMPort();
	
	port.on('data', function (data) {
		//console.log('Sending');
		//console.log(data.toString());
		console.log(data);
		for(var i = 0; i <= sockets.length - 1; i++) {
			sockets[i].write(data);
		}
	});

	var findSocket = function(ip, port) {
		for(var i = 0; i <= sockets.length - 1; i++) {
			if(sockets[i].remoteAddress==ip && sockets[i].remotePort==port) {
				return i;
			}
		}
		return -1;
	}

	var killAllOtherSockets = function(ip, port) {
		console.log(sockets.length);
		while(sockets.length > 1) {
			for(var i = 0; i <= sockets.length - 1; i++) {
				if(sockets[i].remoteAddress==ip && sockets[i].remotePort==port) {
					//leave connected
				} else {
					sockets[i].destroy();
					sockets.splice(i, 1);
				}
			}
		}
	}
	
	var server = net.createServer();

	server.listen(tcpport, '0.0.0.0');
		
	server.on('connection', function(sock) {
		sockets.push(sock);
		
		if(!multiplex) {
			killAllOtherSockets(sock.remoteAddress, sock.remotePort);
		}
		// We have a connection - a socket object is assigned to the connection automatically
		console.log('CONNECTED: ' + sock.remoteAddress +':'+ sock.remotePort);
		
		// Add a 'data' event handler to this instance of socket
		sock.on('data', function(data) {
			//console.log('Received');
			console.log(data);
			port.write(data);
			//console.log('DATA ' + sock.remoteAddress + ': ' + data);
			// Write the data back to the socket, the client will receive it as data from the server
			//sock.write('You said "' + data + '"');
			
		});
		
		// Add a 'close' event handler to this instance of socket
		sock.on('close', function(data) {
			console.log('CLOSED: ' + sock.remoteAddress +' '+ sock.remotePort);
			var sockindex = findSocket(sock.remoteAddress, sock.remotePort);
			if(sockindex >= 0) {
				sockets.splice(sockindex, 1);
				console.log('Found and removed reference to closed socket.');
			} else {
				console.log('Failed to find and remove reference to closed socket.');
			}
		});
		
		sock.on('error', function(data) {
			console.log('ERROR: ' + sock.remoteAddress +' '+ sock.remotePort +' connection lost' + data);
		});
	});
}

module.exports = sigpad;