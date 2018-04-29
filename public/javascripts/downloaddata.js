


function visualizedata() {
  document.getElementById("visbtn").innerHTML = 'Preparing for Download';
  document.getElementById("visbtn").disabled = true;
  document.getElementById("ldng").style.display = 'block';
  var inputval = document.getElementsByName("oldjobid")[0].value;
  console.log(inputval);
  var obj = {};
  obj.jobid = inputval;
  obj_st = JSON.stringify(obj);
  if (inputval) {
    console.log("visualize data");
    $.ajax({
      type: 'POST',
      data: obj_st,
      contentType: "application/json",
      dataType: 'text',
      url: '/visdata',
      success: function(data) {
        console.log(data);
        if (data == "file downloaded") {
          document.getElementById("visbtn").disabled = false;
          document.getElementById("visbtn").innerHTML = 'Download';
          document.getElementById("visbtn").style.display = 'none';
          document.getElementById("dldbtn").style.display = 'block';
          document.getElementById("ldng").style.display = 'none';
        } else {
          document.getElementById("visbtn").disabled = false;
          document.getElementById("visbtn").innerHTML = 'Download';
          document.getElementById("ldng").style.display = 'none';
          window.alert("Error - Please try again");
        }
      }
    });
  }
}



function downloaddata() {
  document.getElementById("visbtn").style.display = 'block';
  document.getElementById("dldbtn").style.display = 'none';
  document.getElementById("visbtn").innerHTML = 'Download';
  window.open("http://aedashboardv3.azurewebsites.net/download")
}
