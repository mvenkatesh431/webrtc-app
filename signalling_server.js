const https = require('https');
const fs = require('file-system');
const express = require('express');
const WebSocket = require('ws');


var privateKey = fs.readFileSync('/etc/letsencrypt/live/test.sillycodes.com/privkey.pem','utf-8');
var cert = fs.readFileSync('/etc/letsencrypt/live/test.sillycodes.com/fullchain.pem','utf-8');

var options =  { key: privateKey, cert: cert };

var app = express();

var httpsServer = https.createServer(options, app);

httpsServer.listen('8443', 'test.sillycodes.com', function () {
  console.log("Server is listening on port 8443 ! \n");
})

/*
var webSocketServer = require('ws').server;
var wss = new webSocketServer({
  server : httpsServer
});
*/

var WebSocketServer = require('ws').Server;
var wss = new WebSocketServer({
        server: httpsServer
});


wss.on('connection', function (connection) {
  console.log(" We got the Connection ");

  connection.on('message', function(msg){
    console.log(" Message Received : %s \n", msg);

    // This example will send data to everyone else except the Sender.
    wss.clients.forEach( function each(client) {
      if( client !== wss && client.readyState === WebSocket.OPEN) {
        client.send(msg);
      }
    });

  });

  // Let's Comment out the dummy send line.
  //connection.send(" Hello World, This is from Node WSS ");

  connection.on('close', function() {
    console.log(" Connection is closed !");
  });
});
