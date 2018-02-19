$(document).ready(function () {
  var timeData = [],
    pressureData = [],
    flowrateData = [];
  var Flowratedataarray = {
    labels: timeData,
    datasets: [
      {
        fill: false,
        label: 'Flowrate',
        yAxisID: 'Flowrate',
        borderColor: "rgba(24, 120, 240, 1)",
        pointBoarderColor: "rgba(24, 120, 240, 1)",
        backgroundColor: "rgba(24, 120, 240, 0.4)",
        pointHoverBackgroundColor: "rgba(24, 120, 240, 1)",
        pointHoverBorderColor: "rgba(24, 120, 240, 1)",
        data: flowrateData
      }
    ]
  }

  var Pressuredataarray = {
    labels: timeData,
    datasets: [
      {
        fill: false,
        label: 'Pressure',
        yAxisID: 'Pressure',
        borderColor: "rgba(255, 204, 0, 1)",
        pointBoarderColor: "rgba(255, 204, 0, 1)",
        backgroundColor: "rgba(255, 204, 0, 0.4)",
        pointHoverBackgroundColor: "rgba(255, 204, 0, 1)",
        pointHoverBorderColor: "rgba(255, 204, 0, 1)",
        data: pressureData
      }
    ]
  }

  var basicOption1 = {
    title: {
      display: true,
      text: 'Pressure Real-time Data',
      fontSize: 36
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

  var basicOption2 = {
    title: {
      display: true,
      text: 'Flowrate Real-time Data',
      fontSize: 36
    },
    scales: {
      yAxes: [{
          id: 'Flowrate',
          type: 'linear',
          scaleLabel: {
            labelString: 'm^3/s',
            display: true
          },
          position: 'right'
        }]
    }
  }

  //Get the context of the canvas element we want to select
  var ctx = document.getElementById("PressureChart").getContext("2d");
  var optionsNoAnimation = { animation: false }
  var myLineChart1 = new Chart(ctx, {
    type: 'line',
    data: Pressuredataarray,
    options: basicOption1
  });

  var ctx = document.getElementById("FlowrateChart").getContext("2d");
  var optionsNoAnimation = { animation: false }
  var myLineChart2 = new Chart(ctx, {
    type: 'line',
    data: Flowratedataarray,
    options: basicOption2
  });

  var ws = new WebSocket('wss://' + location.host);
  ws.onopen = function () {
    console.log('Successfully connect WebSocket');
  }
  ws.onmessage = function (message) {
    console.log('receive message' + message.data);
    try {
      var obj = JSON.parse(message.data);
      if(!obj.time || !obj.pressure) {
        console.log("No data coming");
        return;

      }
      timeData.push(obj.time);
      pressureData.push(obj.pressure);
      // only keep no more than 50 points in the line chart
      const maxLen = 50;
      var len = timeData.length;
      if (len > maxLen) {
        timeData.shift();
        pressureData.shift();
      }

      console.log(obj.flowrate);
      console.log(obj.pressure);

      if (obj.flowrate) {
        flowrateData.push(obj.flowrate);
      }
      if (flowrateData.length > maxLen) {
        flowrateData.shift();
      }

      myLineChart1.update();
      myLineChart2.update();
    } catch (err) {
      console.error(err);
    }
  }
});
