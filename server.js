const express = require('express');
const http = require('http');
const WebSocket = require('ws');
const moment = require('moment');
const path = require('path');
var sql = require('mssql');
const iotHubClient = require('./IoTHub/iot-hub.js');
var Connection = require('tedious').Connection;
var Request = require('tedious').Request;
//npm install tedious
//npm install async
const app = express();

app.use(express.static(path.join(__dirname, 'public')));


app.use(function (req, res/*, next*/) {
  res.redirect('/');
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


wss.on('connection', function connection(ws) {
  ws.on('message', function incoming(msg) {
  //  ws.send("finally");

    console.log('message: ' + msg);


    // Create connection to database
    var config =
       {
         userName: 'akhtarh', // update me
         password: 'Aeiotbox2', // update me
         server: 'aesqldatabaseserver.database.windows.net', // update me
         options:
            {
               database: 'aesqldatabase' //update me
               , encrypt: true
            }
       }
    var connectionsql = new Connection(config);

    // Attempt to connect and execute queries if connection goes through
    connectionsql.on('connect', function(err)
       {
         if (err)
           {
              console.log(err)
           }
        else
           {
             console.log('Reading rows from the Table...');
             var reqsql = "select * from sensordata where jobid = "+ msg;
                 // Read all rows from table
               request = new Request(
                       reqsql,
                       function(err, rowCount, rows)
                          {
                              ws.send(rowCount + ' row(s) returned');
                              process.exit();
                          }
                      );

               request.on('row', function(columns) {
                  columns.forEach(function(column) {
                      ws.send("%s\t%s", column.metadata.colName, column.value);

                   });
                       });
               connectionsql.execSql(request);
           }
       }
     );




  });
});


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
