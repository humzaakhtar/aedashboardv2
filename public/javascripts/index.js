


$(document).ready(function() {

  timeData = [];
  pressureData = [];
  flowrateData = [];
  historicaltimeData =[];
  historicalpressureData = [];
  historicalflowrateData = [];
  Historicaldataarray = {};
  HistoricalDataOption ={};
  canvas_h = 0;
  ctx_h = 0;
  HistoricalLineChart = 0;

  tm  = 0;

  var Flowratedataarray = {
    labels: timeData,
    datasets: [{
      fill: false,
      label: 'Flowrate',
      yAxisID: 'Flowrate',
      borderColor: "rgba(24, 120, 240, 1)",
      pointBoarderColor: "rgba(24, 120, 240, 1)",
      backgroundColor: "rgba(24, 120, 240, 0.4)",
      pointHoverBackgroundColor: "rgba(24, 120, 240, 1)",
      pointHoverBorderColor: "rgba(24, 120, 240, 1)",
      data: flowrateData
    }]
  }

  var Pressuredataarray = {
    labels: timeData,
    datasets: [{
      fill: false,
      label: 'Pressure',
      yAxisID: 'Pressure',
      borderColor: "rgba(255, 204, 0, 1)",
      pointBoarderColor: "rgba(255, 204, 0, 1)",
      backgroundColor: "rgba(255, 204, 0, 0.4)",
      pointHoverBackgroundColor: "rgba(255, 204, 0, 1)",
      pointHoverBorderColor: "rgba(255, 204, 0, 1)",
      data: pressureData
    }]
  }




Historicaldataarray = {
    labels: historicaltimeData,
    datasets: [{
        fill: false,
        label: 'Pressure',
        borderColor: "rgba(255, 204, 0, 1)",
        pointBoarderColor: "rgba(255, 204, 0, 1)",
        backgroundColor: "rgba(255, 204, 0, 0.4)",
        pointHoverBackgroundColor: "rgba(255, 204, 0, 1)",
        pointHoverBorderColor: "rgba(255, 204, 0, 1)",
        data: historicalpressureData,
        spanGaps: true,
      },
      {
        fill: false,
        label: 'Flow Rate',
        borderColor: "rgba(24, 120, 240, 1)",
        pointBoarderColor: "rgba(24, 120, 240, 1)",
        backgroundColor: "rgba(24, 120, 240, 0.4)",
        pointHoverBackgroundColor: "rgba(24, 120, 240, 1)",
        pointHoverBorderColor: "rgba(24, 120, 240, 1)",
        data: historicalflowrateData,
        spanGaps: false,
      }
    ]
  };



  var PressureOption = {
    title: {
      display: false,
      text: 'Pressure Real-time Data',
      fontSize: 10
    },
    scales: {
      yAxes: [{
        id: 'Pressure',
        type: 'linear',
        scaleLabel: {
          labelString: 'Pascal',
          display: true
        },
        position: 'left',
      }]
    }
  }

  var FlowrateOption = {
    title: {
      display: false,
      text: 'Flowrate Real-time Data',
      fontSize: 10
    },
    scales: {
      yAxes: [{
        id: 'Flowrate',
        type: 'linear',
        scaleLabel: {
          labelString: 'm^3/s',
          display: true
        },
        position: 'left'
      }]
    }
  }




HistoricalDataOption = {
    scales: {
      yAxes: [{
        scaleLabel: {
          display: false,
          labelString: 'Pressure and Flowrate',
          fontSize: 10
        }
      }]

    }
  };



  //Get the context of the canvas element we want to select
  var ctx = document.getElementById("PressureLineChart").getContext("2d");
  var optionsNoAnimation = {
    animation: false
  }
  var PressureLineChart = new Chart(ctx, {
    type: 'line',
    data: Pressuredataarray,
    options: PressureOption,
    responsive: true,
  maintainAspectRatio: false
  });

  var ctx = document.getElementById("FlowrateLineChart").getContext("2d");
  var optionsNoAnimation = {
    animation: false
  }
  var FlowrateLineChart = new Chart(ctx, {
    type: 'line',
    data: Flowratedataarray,
    options: FlowrateOption,
    responsive: true,
  maintainAspectRatio: false
  });



/*canvas_h = document.getElementById("HistoricalLineChart");
ctx_h = canvas_h.getContext('2d');
HistoricalLineChart = new Chart(ctx_h, {
    type: 'line',
    data: Historicaldataarray,
    options: HistoricalDataOption,
    responsive: true,
  maintainAspectRatio: false
});*/




ws = new WebSocket('wss://' + location.host);


  function ping() {
          ws.send('__ping__');
          tm = setTimeout(function () {
          var currentdevicestatus = document.getElementById("currentdevicestatus");
          currentdevicestatus.innerHTML  = "&#10060;"
      }, 10000);
  }

  function pong() {
      clearTimeout(tm);
  }

  ws.onopen = function() {
    console.log('Successfully connected WebSocket');
    setInterval(ping, 30000);
  }


  ws.onmessage = function(message) {
  //  message = JSON.stringify(message);
    console.log('receive message' + message.data);
  //  console.log('receive message' + message.data);

   if (message.data == '__pong__') {
        pong();
        return;
    }
   if(message.data == 'file downloaded'){

      document.getElementById("visbtn").disabled = false;
      document.getElementById("visbtn").innerHTML='Download';
      document.getElementById("visbtn").style.display='none';
      document.getElementById("dldbtn").style.display='block';
      document.getElementById("ldng").style.display='none';

    }
    else{


    try {

      var obj = JSON.parse(message.data);



            if (!obj.time || !obj.pressure) {
              console.log("No data coming");
              var currentdevicestatus = document.getElementById("currentdevicestatus");
              currentdevicestatus  = "&#10060;"
              return;

            }

            var deviceid = document.getElementById("deviceid");
            deviceid.innerHTML = obj.deviceId;


            var jobid = document.getElementById("currentjobid");
            jobid.innerHTML= obj.jobId;

            var currentdevicestatus = document.getElementById("currentdevicestatus");
            currentdevicestatus.innerHTML  = "&#9989;"

            var lastmsgreceived = document.getElementById("lastmsgreceived");
            lastmsgreceived.innerHTML = obj.time;


            timeData.push(obj.time);
            pressureData.push(obj.pressure);

            const maxLen = 20;
            var len = timeData.length;

            if (len > maxLen) {
              timeData.shift();
              pressureData.shift();
            }

            if (obj.flowrate) {
              flowrateData.push(obj.flowrate);
            }
            if (flowrateData.length > maxLen) {
              flowrateData.shift();
            }

            PressureLineChart.update();
            FlowrateLineChart.update();
          //  HistoricalLineChart.update();


    }

    catch (err) {
      console.error(err);
    }

 }
}

});



function visualizedata() {

  document.getElementById("visbtn").innerHTML='Preparing for Download';
  document.getElementById("visbtn").disabled = true;
  document.getElementById("ldng").style.display='block';


  //socket = io();

  var inputval = document.getElementsByName("oldjobid")[0].value;
  console.log(inputval);
  var obj ={};
  obj.jobid = inputval;
  obj.to = "sec-websocket-identifier";

  obj_st = JSON.stringify(obj);
  if(inputval){
    console.log("visalize data");


    ws.send(obj_st);

  //  ws.send(obj_st);
  //  socket.emit('message', inputval);
  }

//  socket.on('record', function(msg){
//        console.log(msg);
//  });


}




function downloaddata() {
    //console.log("download data");
   document.getElementById("visbtn").style.display='block';
   document.getElementById("dldbtn").style.display='none';
   document.getElementById("visbtn").innerHTML='Download';


   window.open("http://aedashboardv3.azurewebsites.net/download")

   window.location.reload();
   //location = window.location.href

}
