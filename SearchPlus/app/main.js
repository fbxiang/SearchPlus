(function() {

var _ = undefined; // for quick reference

var help_table = {}; // table to store all help info

var custom_buttons = []; // buttons

custom_command_table = {};

chrome.storage.local.get("custom_commands", function(items) {
  custom_command_table = items["custom_commands"] ? items["custom_commands"] : {};
});

/* Background page stuff */
var background = chrome.extension.getBackgroundPage();
/* initialize a counter which controls which history item to read. */
var history_counter = history_length();

load_buttons();

$(document).ready(function() {
  ModeInfo[get_mode()].init();
  set_search_hint(ModeInfo[get_mode()].name);
  set_search(background.search_text);
  if (!is_cmd(background.search_text)) get_mode_info().onChange();
});

$(document).ready(function() {
  ModeInfo[get_mode()].onLoad();
});

/* detect up/down arrow is just pressed. if so, go over the history entries. */
var upkey = 0;
var downkey = 0;
$(document).ready(function(){
  $("#search-text").keydown(function(event) {
    if (event.which == 38 && upkey == 0) {
      upkey = 1;
      if ( (get_mode() != MODE_CODE && get_mode() != MODE_GET_TEXT) || event.shiftKey)
        set_search(history_back());
    }
    else if (event.which == 40 && downkey == 0) {
      downkey = 1;
      if ( (get_mode() != MODE_CODE && get_mode() != MODE_GET_TEXT) || event.shiftKey)
        set_search(history_forward());
    }
    else if (event.which == 9) { // tab
      deselectAll();
      return false;
    }
  });
});

/* detect up/down is released. */
$(document).ready(function() {
  $("#search-text").keyup(function(event) {
    if (event.which == 38) upkey = 0;
    else if (event.which == 40) downkey = 0;
  });
});


$(document).ready(function(){
  $("#search-text").keypress(function(event) {
    // ctrl+enter is pressed
  	if (event.which == 10) {
  	  get_mode_info().onCtrlEnter();
  	}
    // enter is pressed
    if (event.which == 13) {
      search_text = $("#search-text").val();
      if (is_cmd(search_text)) {
        history_add(search_text);
        history_set_counter();
      	clear_search();
        process_cmd(search_text.substring(1));
        return false;
      }
      if (event.shiftKey)
        return get_mode_info().onShiftEnter();
      else
      	return get_mode_info().onEnter();
    }
    else {
      return true;
    }
  });
});

function on_search_change(event) {
  clear_hint();
  	var prev_text = background.search_text;
  	var curr_text = background.search_text = get_text();
  	if (is_cmd(get_text())) {
  	  if (curr_text.length > prev_text.length)
  	    cmd_autocomplete();
  	  return;
  	}
    get_mode_info().onChange();
}

/*
 * when text is typed into the search bar
 * send message {"search, "text", text} to content script
 * 
 */
$(document).ready(function() {
  $("#search-text").bind("input propertychange", on_search_change)});

/*
  @param keyword    keyword typed in popup search bar
  @return           whether it is a command
*/
function is_cmd(keyword) {
  return keyword[0] == '/';
}

function cmd_autocomplete() {
  var text = get_text().substring(1);
  if (!text) return;
  var cmds = get_all_cmds().filter(x => x.indexOf(text)==0);
  cmds = cmds.sort(w=>-w.length);
  if (cmds.length) {
  	$("#search-text").val("/"+cmds[0]);
    var start = text.length+1;
    var end = cmds[0].length+1;
    createSelection($("#search-text")[0], start, end);
  }
}

function createSelection(field, start, end) {
  if( field.createTextRange ) {
    var selRange = field.createTextRange();
    selRange.collapse(true);
    selRange.moveStart('character', start);
    selRange.moveEnd('character', end);
    selRange.select();
    field.focus();
  } else if( field.setSelectionRange ) {
    field.focus();
    field.setSelectionRange(start, end);
  } else if( typeof field.selectionStart != 'undefined' ) {
    field.selectionStart = start;
    field.selectionEnd = end;
    field.focus();
  }
}

function get_all_cmds() {
  return Object.keys(command_table).concat(Object.keys(custom_command_table));
}

function process_cmd(keyword) {
  var words = keyword.trim().split(" ");
  if (words.length == 0) {
    display_hint("Invalid Command", "red");
    return;
  }
  execute_cmd(words);
}

function execute_cmd(words) {
  var name = words[0];
  
  // Case 1: name is a number
  var num = parseInt(name)-1;
  if (!isNaN(num) && num>=0 && num<num_buttons()) {
    click_button(custom_buttons[num]);
    return;
  }
  if (name in command_table)
    command_table[name](words);
  else if (name in custom_command_table)
  {
    var args = words;
  	eval(custom_command_table[name][0]);
  }
  else
    command_table["default"]();
}

/* -------------------------Button Logic-------------------------- */

function create_button(name, cmd) {
  return {name:name, cmd:cmd};
}

function store_buttons() {
  chrome.storage.local.set({"custom_buttons": custom_buttons});
}

function load_buttons() {
  chrome.storage.local.get("custom_buttons", function(items) {
    custom_buttons = items["custom_buttons"] ? items["custom_buttons"] : [];
    update_buttons();
  });
}

function add_button(button) {
  custom_buttons.push(button);
  store_buttons();
}

function remove_buttons() {
  custom_buttons = [];
  store_buttons();
}

function remove_button(idx) {
  custom_buttons.splice(idx, 1);
  store_buttons();
}

function change_button(idx, name, cmd) {
  custom_buttons[idx].name = name;
  custom_buttons[idx].cmd = cmd;
  store_buttons();
}

function update_buttons() {
  var bc = $("#buttons-container")[0];
  while (bc.firstChild) {
    bc.removeChild(bc.firstChild);
  }
  custom_buttons.forEach(function(button, idx) {
    var b = document.createElement("button");
    b.appendChild(document.createTextNode(idx+1 + ". " + button.name));
    b.addEventListener("click", function(){click_button(button)});
    bc.appendChild(b);
  });
}

function num_buttons() {
  return custom_buttons.length;
}

function click_button(button) {
  execCMD(button.cmd);
}


/* ------------------------End Button Logic------------------------*/


/* Show hint in the right of search area */
function display_hint(content, color) {
  $("#search-hint").text(content);
  $("#search-hint").css("color", color);
}

/* Clear search area */
function clear_search() {
  $("#search-text").val("");
  background.search_text = "";
}

/* Set search area 
 * @param item     string to set
 */
function set_search(item) {
  $("#search-text").val(item);
  on_search_change();
}

function set_prompt(text) {
  $("#search-prompt").text(text);
}

function clear_prompt() {
  $("#search-prompt").text("");
}

/* clear hint displayed in the right of the search area */
function clear_hint() {
  $("#search-hint").text("");
}

function set_search_hint(text) {
  $("#mode-hint").text(text);
}

/* Add search history to background page */
function history_add(item) {
  background.search_history.push(item);
}

/* Helper function to check the ith entry is available in history*/
function history_has(i) {
  return i >= 0 && i < background.search_history.length;
}

/* Get the ith entry from history */
function history_get(i) {
  return background.search_history[i];
}

/* Get the length of history */
function history_length() {
  return background.search_history.length;
}

/* Set history_counter to after the last entry */
function history_set_counter() {
  history_counter = history_length();
}

/* Clear history in background page */
function history_clear() {
  background.search_history = [];
  history_counter = 0;
}

/* Go back 1 history item */
function history_back() {
  if (history_has(history_counter-1)) {
    history_counter--;
  }
  return history_get(history_counter);
}

/* Go forward 1 history item */
function history_forward() {
  if (history_has(history_counter+1)) {
    history_counter++;
    return history_get(history_counter);
  }
  else {
    history_counter = history_length();
    return "";
  }
}

/* Set background option (key, value) */
function set_background_option(k, v) {
  background.global_options[k] = v;
}

/* Get background option (key) */
function get_background_option(k) {
  return background.global_options[k];
}

/*
 * Send message to current tab content script
 * @param message       the message to send, created via create_message(method, action, content)
 * @param func_response(method, action, content)
 *                      function that processes the response from content script
 */
function message_current_tab(message, func_response) {
  chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
    chrome.tabs.sendMessage(tabs[0].id, message, function(response){
      process_message(response, func_response);
    });
  });
}

/*
 * Create message for communication
 * @param method     general message type
 * @param action     specific action type
 * @param content    other information
 */
function create_message(method, action, content) {
  return ({_method:method, _action:action, _content:content});
}

/*
 * Use continuation style to process message
 * @param message      The message to process created by create_message
 * @param func(method, action, content)
 *                     Function that processes the message
 */
function process_message(message, func) {
  if (message === _) return;
  if (func)
    func(message._method, message._action, message._content);
}

/* Command lookup table*/ 
var command_table = {
  "default": function() {
    display_hint("no such command", "red");
  }
};

command_table["test"] = function() {
  alert("test"); 
  display_hint("success", "green");
}

help_table["normal"] = "Normal search mode. Highlight exact match (not case sensitive).";
command_table["normal"] = function() {
  change_mode_to(MODE_NORMAL);
  display_hint("mode set", "green");
}

help_table["regex"] = "Regular expression mode. Highlight using javascript normal expressions.";
command_table["regex"] = function() {
  change_mode_to(MODE_REGEX);
  display_hint("mode set", "green");
}

help_table["multi"] = "Multiple words mode. Highlight different words separated by space.";
command_table["multi"] = function() {
  change_mode_to(MODE_MULTI);
  display_hint("mode set", "green");
}

help_table["code"] = "Code mode. Run javascript code on content page, jquery supported.";
command_table["code"] = function() { 
  change_mode_to(MODE_CODE);
  display_hint("mode set", "green");
}

help_table["clear"] = "Clear command/search history.";
command_table["clear"] = function() {
  history_clear();
}

help_table["q"] = "Quit pop up."
command_table["q"] = function() {
  window.close();
}

help_table["addcmd"] = "Add new command. Usage: /addcmd [cmdName]. This will change mode to getText. Type code and Shift+Enter to store for later execution.";
command_table["addcmd"] = function(words) {
  if (words.length != 2) {
    display_hint("invalid arguments", "red");
    return;
  }
  var newcmd = words[1].toLowerCase();
  if (newcmd=="" || !/[a-z]/i.test(newcmd[0])) {
    display_hint("commands start with letter", "red");
    return;
  }
  if (newcmd in command_table) {
    display_hint("command already in use", "red");
    return;
  }
  getLines(function(text){
    addcmd(newcmd, text);
    getLines(function(text) {
      add_cmd_description(newcmd, text);
    }, "Enter description for this cmd");
  }, "Enter javascript, Shift+Enter to submit.");
}

help_table["editcmd"] = "Edit custom command. Usage: /editcmd [cmdName]. See usage of /addcmd."
command_table["editcmd"] = function(words) {
  if (words.length != 2) {
    display_hint("invalid arguments", "red");
    return;
  }
  var cmd = words[1].toLowerCase();
  if (cmd=="" || !/[a-z]/i.test(cmd[0])) {
    display_hint("commands start with letter", "red");
    return;
  }
  if (! (cmd in custom_command_table)) {
    display_hint("no such command", "red");
    return;
  }
  var cmdtext = custom_command_table[cmd][0];
  var description = custom_command_table[cmd][1] ? custom_command_table[cmd][1] : "";
  getLines(function(text){
    addcmd(cmd, text);
    getLines(function(text) {
      add_cmd_description(cmd, text);
    }, "Enter description for this cmd", description);
  }, "Change javascript, Shift+Enter to submit.", cmdtext);
}

help_table["rmcmd"] = "Delete custom command.";
command_table["rmcmd"] = function(words) {
  if (words.length != 2) {
    display_hint("invalid arguments", "red");
    return;
  }
  var cmd = words[1].toLowerCase();
  if (!(cmd in custom_command_table)) {
    display_hint("no such command", "red");
    return;
  }
  rmcmd(cmd);
}

help_table["help"] = "Usage: /help [cmdName]."
command_table["help"] = function(words) {
  if (words.length == 1) { // only help is typed
    alert("usage: /help [cmd]\navailable cmds: " + Object.keys(help_table));
  }
  else if (words.length == 2) {
  	if (help_table.hasOwnProperty(words[1])) {
  	  alert(help_table[words[1]]);
  	}
  	else {
  	  display_hint(words[1]+" not found", "red");
  	}
  }
}

command_table["addbutton"] = function(words) {
  if (words.length == 1) {
    alert("usage: /addbutton [buttonName]");
    return;
  }
  getLines(function(text) {
    add_button(create_button(words[1], text));
    update_buttons();
  }, "Add command to execute by the button, Shift+Enter to submit.");
}

command_table["rmbutton"] = function(words) {
  switch (words.length) {
    case 1:
      getLines(function(text) {
        text = text.toLowerCase();
        if (text == "yes" || text == "y") {
          remove_buttons();
          update_buttons();
        }
      }, "Yes/No.", "remove all buttons? [Y/N]");
      break;
    case 2:
      var idx = parseInt(words[1])-1;
      if (isNaN(idx) || idx < 0 || idx > custom_buttons.length) {
        return;
      }
      remove_button(idx);
      update_buttons();
      break;
    default:
      break;
  }
}

command_table["editbutton"] = function(words) {
  switch (words.length) {
    case 1:
    case 2:
      alert("usage: /editbutton [buttonNumber] [buttonName]");
      break;
    case 3:
      var idx = parseInt(words[1])-1;
      if (isNaN(idx) || idx < 0 || idx > custom_buttons.length) {
        return;
      }
      var b = custom_buttons[idx];
      getLines(function(text) {
        change_button(idx, words[2], text);
        update_buttons();
      }, "Change command for this button, Shift+Enter to submit.", b.cmd);
      break;
    default:
      break;
  }
}

command_table["exportcmds"] = function(words) {
  var commands_json = JSON.stringify(custom_command_table);
  download("cmds.txt", commands_json);
}

command_table["importcmds"] = function(words) {
  chrome.tabs.create({'url': chrome.extension.getURL('html/import.html')}, function(tab) {});
}

command_table["cmdlist"] = function(words) {
  chrome.tabs.create({'url': chrome.extension.getURL('html/list.html')}, function(tab) {});
};

function download(filename, text) {
  var pom = document.createElement('a');
  pom.setAttribute('href', 'data:text/plain;charset=utf-8,' + encodeURIComponent(text));
  pom.setAttribute('download', filename);
  pom.click();
}


var custom_command_table = {}

var custom_mode_table = {}

function addcmd(name, code) {
  custom_command_table[name] = [];
  custom_command_table[name].push(code);
  chrome.storage.local.set({"custom_commands":custom_command_table});
}

function add_cmd_description(name, text) {
  if (name in custom_command_table) {
    custom_command_table[name][1] = text;
    chrome.storage.local.set({"custom_commands":custom_command_table});
  }
}

function rmcmd(name) {
  if (name in custom_command_table) {
  	delete custom_command_table[name];
  	chrome.storage.local.set({"custom_commands":custom_command_table});
  }
}

function search_next() {
  message_current_tab(create_message("search", "next", search_text), function(method, action, content){
  	display_hint(content, "grey");
  });
  return false;
}
function search_prev() {
  message_current_tab(create_message("search", "prev", search_text), function(method, action, content){
  	display_hint(content, "grey");
  });
  return false;
}
function search_click() {
  message_current_tab(create_message("search", "click", ""));
  clear_search();
  return false;
}


Mode_Count = 0;
ModeInfo = {};

/* Create a mode. Each mode will be assigned an id
 * @param options     a list, "name" property is required,
 *                            "init" and "quit" properties are optional
 * @return the id
 */
function create_mode(options) {
  mode = {};
  if ("name" in options) {
    mode.name = options.name;
  }
  else {
  	console.log("Create Mode Failed");
  	return;
  }
  ["init", "quit", "onEnter", "onShiftEnter", "onCtrlEnter", "onChange", "onLoad"].forEach(option=>{
    if (option in options) mode[option] = options[option];
    else mode[option] = function(){}
  });
  mode.id = Mode_Count++; 
  ModeInfo[mode.id] = mode;
  return mode.id;
}

function create_custom_mode(name) {
  if (name == "") return;
  mode = {};
  mode.name = name;
  mode.id = Mode_Count++; 
  ModeInfo[mode.id] = mode;
  return mode.id;
}

MODE_NORMAL = create_mode({
  name: "normal",
  onChange: function() {
    clear_hint();
    var text = get_text();
    console.log("Sending search request.");
    message_current_tab(create_message("search", "normal", text), function(method, action, content){
      display_hint(content, "grey");
      console.log("Search response received.");
    });
  },
  onEnter: search_next,
  onShiftEnter: search_prev,
  onCtrlEnter: search_click
});

MODE_REGEX = create_mode({
  name: "regex",
  onChange: function() {
    clear_hint();
    var text = get_text();
    console.log("Sending search request.");
    message_current_tab(create_message("search", "regex", text), function(method, action, content){
      display_hint(content, "grey");
      console.log("Search response received.");
    });
  },
  onEnter: search_next,
  onShiftEnter: search_prev,
  onCtrlEnter: search_click
});

MODE_MULTI = create_mode({
  name: "multi",
  onChange: function() {
    clear_hint();
    var text = get_text();
    console.log("Sending search request.");
    message_current_tab(create_message("search", "multi", text), function(method, action, content){
      display_hint(content, "grey");
      console.log("Search response received.");
    });
  },
  onEnter: search_next,
  onShiftEnter: search_prev,
  onCtrlEnter: search_click
});

MODE_CODE = create_mode({
  name: "code",
  init: function() {
  	$("#textarea-container").css("height", "200px");
  },
  quit: function() {
  	$("#textarea-container").css("height", "42px");
  },
  onShiftEnter: function() {
    message_current_tab(create_message("code", "enter", get_text()), function(method, action, content) {
      display_hint(content, "darkblue");
      clear_search();
    });
    return false;
  },
});

MODE_GET_TEXT = create_mode({
  name: "gettext",
  onShiftEnter: function() {
    var callback = get_mode_metadata();
    var text = get_text();
    clear_search();
    change_mode_to(get_background_option("prevmode"));
    callback(text);
    return false;
  },
  init: function() {
    $("#textarea-container").css("height", "200px");
    $("body").css("background-color", "forestgreen");
  },
  quit: function() {
  	$("#textarea-container").css("height", "42px");
  	$("body").css("background-color", "lightblue");
    clear_prompt();
  },
  onLoad: function() {
    clear_search();
    change_mode_to(get_background_option("prevmode"));
  }
});

/*
 * getLines function could be placed inside the callback function
 * but may cause issues
 */
function getLines(callback, prompt, text) {
  if (callback === _) return;
  prompt || (prompt = "");
  text || (text = "");
  set_search(text);
  set_prompt(prompt);
  selectAll();
  set_background_option("prevmode", get_mode());
  change_mode_to(MODE_GET_TEXT, callback);
}

function setLines(text) {
  set_search(text);
}

function change_mode_to(mode, metadata) {
  metadata || (metadata = "");
  console.assert(mode in ModeInfo);
  pmode = get_background_option("mode");
  if (pmode == mode) return;
  ModeInfo[pmode].quit();
  set_background_option("mode", mode);
  set_background_option("modemetadata", metadata);
  ModeInfo[mode].init();
  set_search_hint(ModeInfo[mode].name);
}

function get_mode() {
  return get_background_option("mode");
}
function get_mode_metadata() {
  return get_background_option("modemetadata");
}

function get_mode_info() {
  return ModeInfo[get_mode()];
}

function set_mode_attr(mode, key, value) {
  ModeInfo[mode][key] = value;
}

function get_text() {
  return $("#search-text").val();
}

function openURL(text) {
  chrome.tabs.create({url: text});
}

function openWindows(url_list) {
  n_windows = url_list.length;
  screen_width = screen.width;
  screen_height = screen.height;
  window_width = (screen_width / n_windows) >> 0; // integer division
  window_height = screen_height;
  for (var i = 0; i < n_windows; i++) {
    var u = url_list[i].trim();
  	if (u.indexOf("http") != 0) {
      u = "http://" + u;
    }
    chrome.windows.create({url: u, width: window_width, height: window_height,
                                   left: window_width*i, top: 0});
  }
}

// execute code in content script
function exec(code) {
  message_current_tab(create_message("code", "enter", code), function(method, action, content) {
    display_hint(content, "darkblue");
  });
}

function execCMD(cmdstr) {
  var words = cmdstr.trim().split(" ");
  execute_cmd(words);
}

function deselectAll() {
  var text = $("#search-text").val();
  createSelection($("#search-text")[0], text.length, text.length);
}

function selectAll() {
  var text = $("#search-text").val();
  createSelection($("#search-text")[0], 0, text.length);
}

})();