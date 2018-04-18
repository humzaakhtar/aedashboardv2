const express = require('express');
const http = require('http');
const WebSocket = require('ws');
const moment = require('moment');
const path = require('path');
var sql = require('mssql');
const iotHubClient = require('./IoTHub/iot-hub.js');
const bodyParser = require("body-parser");

const app = express();

app.use(express.static(path.join(__dirname, 'public')));
app.use(bodyParser.urlencoded({
    extended: true
}));
app.use(bodyParser.json());


//app.use(function (req, res/*, next*/) {
//  res.redirect('/');
//});

app.get('/', function (req, res) {
    res.redirect('/');
});



// visualize old database
app.post('/visualize', function(req, res) {

var jobid = req.body.title;
console.log(jobid);

/*
var connectionString = {'Data Source=tcp:aesqldatabaseserver.database.windows.net,1433;Initial Catalog=aesqldatabase;User Id=null@aesqldatabaseserver.database.windows.net;Password=Aeiotbox2;'};
try {
  sql.connect(connectionString, function(err) {
    if (err) {
      console.log(err);
      return;}
    var request = new sql.Request();
    request.query('select * from sensordata where jobid =' + jobid +';', function(err, recordset) {
      if (err) {
        console.log(err);
        return;}
      res.send(recordset);
    });
  });
} catch (ex1) {}
*/
});


const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

// Broadcast to all.
wss.broadcast = function broadcast(data) {
  wss.clients.forEach(function each(client) {
    if (client.readyState === WebSocket.OPEN) {
      try {
        console.log('sending data ' + data);
        client.send(data);
      } catch (e) {
        console.error(e);
      }
    }
  });
};

var iotHubReader = new iotHubClient(process.env['Azure.IoT.IoTHub.ConnectionString'], process.env['Azure.IoT.IoTHub.ConsumerGroup']);
iotHubReader.startReadMessage(function (obj, date) {
  try {
    console.log(date);
    date = date || Date.now();
    var date = moment.utc(date).format('YYYY-MM-DD HH:mm:ss');
    var stillUtc = moment.utc(date).toDate();
    var local = moment(stillUtc).local().format('hh:mm:ss');
    wss.broadcast(JSON.stringify(Object.assign(obj, { time: local })));



  } catch (err) {
    console.log(obj);
    console.error(err);
  }
});

var port = normalizePort(process.env.PORT || '3000');
server.listen(port, function listening() {
  console.log('Listening on %d', server.address().port);
});

/**
 * Normalize a port into a number, string, or false.
 */

function normalizePort(val) {
  var port = parseInt(val, 10);

  if (isNaN(port)) {
    // named pipe
    return val;
  }

  if (port >= 0) {
    // port number
    return port;
  }

  return false;
}

/*var connectionString = {
    user: '[myUserName]',
    password: '[myPassword]',
    server: 'tcp:[serverName].database.windows.net',
    database: '[databaseName]',

    options: {
        encrypt: true // Use this if you're on Windows Azure
    }
};

try {
  sql.connect(connectionString, function(err) {
    if (err) {
      console.log(err);
      return;
    }

    var request = new sql.Request();
    request.query('select top 5 from Logs', function(err, recordset) {
      if (err) {
        console.log(err);
        return;
      }
    });
  });
} catch (ex1) {

}*/
