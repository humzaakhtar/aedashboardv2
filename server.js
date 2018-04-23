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
var csvWriter = require('csv-write-stream')
var writer = csvWriter({ headers: ["messageid", "jobid","deviceid","pressure","flowrate","time","from"]});


//var file = __dirname + '/upload-folder/dramaticpenguin.MOV';
//res.download(file); // Set disposition and send it.

var fs = require('fs');
//var stream = fs.createWriteStream("historical_data.csv");

const app = express();

app.use(express.static(path.join(__dirname, 'public')));

var rowObject = {};
var csvheader = 0;

app.use(function(req, res /*, next*/ ) {
  res.redirect('/');
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
    //writer.pipe(stream)

    wss.clients.forEach(function each(client) {
      if (client.readyState === WebSocket.OPEN) {
        try {
          console.log(msg);
        //  client.send(msg);

              if (isJson(msg)) {

                msg = JSON.parse(msg);
                if (msg.hasOwnProperty('jobid')) {

                  console.log('message: ' + msg);

                  // Create connection to database
                  var config = {
                    userName: 'akhtarh', // update me
                    password: 'Aeiotbox2', // update me
                    server: 'aesqldatabaseserver.database.windows.net', // update me
                    options: {
                      database: 'aesqldatabase',
                      encrypt: true,
                      rowCollectionOnDone:true
                    }
                  }
                  var connectionsql = new Connection(config);
                  // Attempt to connect and execute queries if connection goes through
                  connectionsql.on('connect', function(err) {
                    jsonArray = []
                    if (err) {
                      console.log(err)
                    } else {
                    //  client.send("connection established");
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
                            if(itemsProcessed === 6) {
                              //callback();
                              rowObject["from"] = "db"
                              //console.log(rowObject);

                              //client.send(JSON.stringify(rowObject))
                            //  if(csvheader == 0){
                            //    csvheader++;
                            //  }
                            //else if(csvWriter == 1){
                            //    writer = csvWriter({sendHeaders: false})
                            //}
                              jsonArray.push(rowObject)


                            }

                        });

                      });


                      request.on('doneProc', function (rowCount, more, returnStatus, rows) {
                            //console.log(rowCount + ' rows returned');
                              //console.log(rows) // this is the full array of row objects
                              console.log(jsonArray)
                              for (var i = 0; i < jsonArray.length; i++) {
                                writer.pipe(fs.createWriteStream("historical_data1.csv", {flags: 'a'}));
                                writer.write(jsonArray[i]);

                              }
                                writer.end();
                      });


                    //  setInterval(function(){ client.send(JSON.stringify(rowObject)) },2000);

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
