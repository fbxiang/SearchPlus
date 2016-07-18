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
        chrome.storage.local.get("custom_commands", function(items) {
          all_cmds = items["custom_commands"];
          if (!all_cmds) all_cmds = {};
          for (cmd in cmds) {
            all_cmds[cmd] = cmds[cmd];
          }
          alert(JSON.stringify(all_cmds));
          chrome.storage.local.set({"custom_commands":all_cmds});
          window.close();
        });
      }
      catch(err) {
        alert("Invalid command file!!!");
      }
    }, false);
    reader.readAsText(file);
  })
});

})();