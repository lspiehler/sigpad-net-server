var SerialPort = require('serialport');
var net = require('net');
var websocket = require('./websocket.js');
var io = websocket.getSocket(false);

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
	
	this.getClients = function() {
		let clients = [];
		
		for(var i = 0; i <= sockets.length - 1; i++) {
			clients.push(sockets[i].remoteAddress + ':' + sockets[i].remotePort);
		}
		return clients;
	}
	
	this.writeSocket = function(data) {
		//console.log(data);
		processData(data);
		for(var i = 0; i <= sockets.length - 1; i++) {
			sockets[i].write(new Buffer(data));
		}
	}
	
	this.kill = function() {
		//port.close();
		for(var i = 0; i <= sockets.length - 1; i++) {
			sockets[i].destroy();
		}
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
	
	var datacount = 0;
	var signing = false;
	var values = [];
	var clearbuf = new Buffer([18, 0, 0, 0, 0, 0, 0, 240, 0, 64]);
	//var rawdata = [];
	
	var processData = function(data) {
		for(var i = 0; i <= data.length - 1; i++) {
			//console.log(data[i]);
			if(data[i]==229) {
				//console.log(rawdata);
				//rawdata.length = 0
				//rawdata.push(data[i]);
				if(!signing) {
					console.log('Begin signature on device ' + comport.comName);
					var wsdata = {
						device: comport.comName,
						tcpport: tcpport,
						message: 'begin signature'
					}
					io.sockets.emit('message', wsdata);
					signing = true;
				}
				datacount = 0;
			} else if(data[i]==228) {
				//console.log(rawdata);
				//rawdata.length = 0
				//rawdata.push(data[i]);
				if(signing) {
					console.log('End signature on device ' + comport.comName);
					var wsdata = {
						device: comport.comName,
						tcpport: tcpport,
						message: 'end signature'
					}
					io.sockets.emit('message', wsdata);
					values.length = 0;
					signing = false;
				}
				datacount = 0;
				//console.log('no contact');
			} else {
				//rawdata.push(data[i]);
				if(signing) {
					values[datacount - 1] = data[i];
					if(values.length > 3) {
						let x = (((values[1] - 3) * 127) + values[0]) - 116;
						let y = (((values[3] - 3) * 127) + values[2]) - 66;
						console.log(values);
						//console.log(x + ' x ' + y);
						var wsdata = {
							device: comport.comName,
							tcpport: tcpport,
							data: {
								x: x,
								y: y
							}
						}
						io.sockets.emit('signaturedata', wsdata);
						//console.log(values[1]);
						values.length = 0;
					} else {
						
					}
				} else {
					//console.log('not signature data');
				}
			}
			datacount++;
		}
	}
	
	port.on('data', function (data) {
		//console.log('Sending');
		//console.log(data.toString());
		//console.log(data);
		processData(data);
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
		
		io.sockets.emit('devicechange', false);
		
		// Add a 'data' event handler to this instance of socket
		sock.on('data', function(data) {
			//console.log('Received');
			if(clearbuf.equals(data)) {
				console.log('clear sigpad signal received');
				io.sockets.emit('clearsignature', tcpport);
			}
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
			io.sockets.emit('devicechange', false);
		});
		
		sock.on('error', function(data) {
			console.log('ERROR: ' + sock.remoteAddress +' '+ sock.remotePort +' connection lost' + data);
		});
	});
}

module.exports = sigpad;