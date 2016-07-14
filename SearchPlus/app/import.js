(function() {

$(document).ready(function() {
  $("#file-import").change(function(event) {
    var file = event.target.files[0];
    var reader = new FileReader();
    reader.addEventListener('load', function(){
      try {
        var cmds = JSON.parse(reader.result);
        for (cmd in cmds) {
          if (typeof cmds[cmd] !=  "string") {
          	alert("Invalid command file!!!");
          	return;
          } 
        }
        chrome.storage.local.set({"custom_commands":cmds});
        window.close();
      }
      catch(err) {
        alert("Invalid command file!!!");
      }
    }, false);
    reader.readAsText(file);
  })
});

})();