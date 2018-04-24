const express = require('express');
const http = require('http');
const WebSocket = require('ws');
const moment = require('moment');
const path = require('path');
var sql = require('mssql');
const iotHubClient = require('./IoTHub/iot-hub.js');
var Connection = require('tedious').Connection;
var Request = require('tedious').Request;
var fs = require('fs');
var router = express.Router();
const app = express();


app.use(express.static(path.join(__dirname, 'public')));
var rowObject = {};
var csvheader = 0;

//app.use(function(req, res /*, next*/ ) {
//  res.redirect('/');
//});


router.use(function(req, res, next) {
  console.log("/" + req.method);
  next();
});

// main page route
router.get('/download', function(req, res) {
  console.log("hello");
  res.download('/','sensordata.txt');
});



const server = http.createServer(app);
const wss = new WebSocket.Server({
  server
});

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

function isJson(str) {
  try {
    JSON.parse(str);
  } catch (e) {
    return false;
  }
  return true;
}


wss.on('connection', function connection(ws) {
  ws.on('message', function incoming(msg) {

    /* this works */
    var data = "New File Contents";
    fs.writeFile('temp1.txt', data, function(err, data) {
      if (err) console.log(err);
      console.log("Successfully Written to File.");
    });


    wss.clients.forEach(function each(client) {
      if (client.readyState === WebSocket.OPEN) {
        try {
          if (isJson(msg)) {
            msg = JSON.parse(msg);
            if (msg.hasOwnProperty('jobid')) {
              console.log('message: ' + msg);
              var config = {
                userName: 'akhtarh',
                password: 'Aeiotbox2',
                server: 'aesqldatabaseserver.database.windows.net',
                options: {
                  database: 'aesqldatabase',
                  encrypt: true,
                  rowCollectionOnDone: true
                }
              }
              var connectionsql = new Connection(config);
              connectionsql.on('connect', function(err) {
                jsonArray = []
                if (err) {
                  console.log(err)
                } else {
                  console.log('Reading rows from the Table...');
                  var reqsql = "select * from sensordata where jobid = " + msg.jobid
                  request = new Request(
                    reqsql,
                    function(err, rowCount, rows) {
                      process.exit();
                    }
                  );
                  request.on('row', function(columns) {
                    rowObject = {};
                    var itemsProcessed = 0;
                    columns.forEach(function(column) {
                      rowObject[column.metadata.colName] = column.value;
                      itemsProcessed++;
                      if (itemsProcessed === 6) {
                        rowObject["from"] = "db"
                        jsonArray.push(rowObject)
                      }
                    });
                  });
                  request.on('doneProc', function(rowCount, more, returnStatus, rows) {
                    console.log("all rows downloaded")

                    /*this works */
                    fs.writeFileSync('sensordata.txt', JSON.stringify(jsonArray));

                  });
                  connectionsql.execSql(request);
                }
              });
            }
          }
        } catch (e) {
          console.error(e);
        }
      }
    });
  });
});



var iotHubReader = new iotHubClient(process.env['Azure.IoT.IoTHub.ConnectionString'], process.env['Azure.IoT.IoTHub.ConsumerGroup']);
iotHubReader.startReadMessage(function(obj, date) {
  try {
    console.log(date);
    date = date || Date.now();
    var date = moment.utc(date).format('YYYY-MM-DD HH:mm:ss');
    var stillUtc = moment.utc(date).toDate();
    var local = moment(stillUtc).local().format('hh:mm:ss');
    wss.broadcast(JSON.stringify(Object.assign(obj, {
      time: local
    })));
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
