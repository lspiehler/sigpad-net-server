var https = require('https');
var websocket = require('socket.io');

var sock = false;
module.exports = {
    getSocket: function (server) {
		if(sock) {
			//console.log('here');
			return sock;
		} else {
			//console.log(server);
			sock = websocket.listen(server)
			sock.sockets.on('connection',function (socket) {
				console.log('connection')
			});
			return sock;
		}
    }
};