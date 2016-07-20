(function() {


$(document).ready(function() {
  chrome.storage.local.get("custom_commands", function(items) {
    all_cmds = items["custom_commands"];
    for (cmd in all_cmds) {
      add_cmd_entry(cmd, all_cmds[cmd][0], all_cmds[cmd][1]);
    }
  });
});

function add_cmd_entry(name, code, description) {
  name || (name="");
  code || (code="");
  description || (description="");
  var tr = document.createElement('tr');
  var td1 = document.createElement('td'); td1.appendChild(document.createTextNode(name));
  var td2 = document.createElement('td'); td2.appendChild(document.createTextNode(code));
  var td3 = document.createElement('td'); td3.appendChild(document.createTextNode(description));
  tr.appendChild(td1); tr.appendChild(td2); tr.appendChild(td3);
  $("#cmd-table")[0].appendChild(tr);
}

})();