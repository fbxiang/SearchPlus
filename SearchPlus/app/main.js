(function() {


/* Background page stuff */
var background = chrome.extension.getBackgroundPage();
/* initialize a counter which controls which history item to read. */
var history_counter = history_length();

chrome.storage.local.get("custom_commands", function(items) {
  custom_command_table = items["custom_commands"];
});

$(document).ready(function() {
  ModeInfo[get_mode()].init();
  set_search(background.search_text);
  if (!is_cmd(background.search_text)) get_mode_info().onChange();
});

/* detect up/down arrow is just pressed. if so, go over the history entries. */
var upkey = 0;
var downkey = 0;
$(document).ready(function(){
  $("#search-text").keydown(function(event) {
    if (event.which == 38 && upkey == 0) {
      upkey = 1;
      if (get_mode() != MODE_CODE || event.shiftKey)
        set_search(history_back());
    }
    if (event.which == 40 && downkey == 0) {
      downkey = 1;
      if (get_mode() != MODE_CODE || event.shiftKey)
        set_search(history_forward());
    };
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
        process_cmd(search_text.substring(1));
        return false;
      }
      history_add(search_text);
      history_set_counter();
      if (event.shiftKey)
        return get_mode_info().onShiftEnter();
      else
      {
      	return get_mode_info().onEnter();
      }
    }
    else {
      return true;
    }
  });
});

/*
 * when text is typed into the search bar
 * send message {"search, "text", text} to content script
 * 
 */
$(document).ready(function() {
  $("#search-text").bind("input propertychange", function(event){
  	clear_hint();
  	var prev_text = background.search_text;
  	var curr_text = background.search_text = get_text();
  	if (is_cmd(get_text())) {
  	  if (curr_text.length > prev_text.length)
  	    cmd_autocomplete();
  	  return;
  	}
    get_mode_info().onChange();
  });
});

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
  if (cmds.length) {
  	set_search("/"+cmds[0]);
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
  var words = keyword.split(" "); // TODO: handle commands with more then 1 argument
  if (words.length == 0) {
    display_hint("Invalid Command", "red");
    return;
  }
  execute_cmd(words);
}

function execute_cmd(words) {
  var name = words[0];
  if (command_table.hasOwnProperty(name))
    command_table[name](words);
  else if (custom_command_table.hasOwnProperty(name))
  	eval(custom_command_table[name]);
  else
    command_table["default"]();
  clear_search();
}

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
}

/* clear hint displayed in the right of the search area */
function clear_hint() {
  $("#search-hint").text("");
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
  if (func)
    func(message._method, message._action, message._content);
}

/* Command lookup table*/ 
var command_table = {
  "test": function() {
    alert("test"); 
    display_hint("success", "green");
  },
  "normal": function() { 
	change_mode_to(MODE_NORMAL);
    display_hint("mode set", "green");
  },
  "regex": function() { 
    change_mode_to(MODE_REGEX);
    display_hint("mode set", "green");
  },
  "multi": function() { 
  	change_mode_to(MODE_MULTI);
    display_hint("mode set", "green");
  },
  "code": function() { 
  	change_mode_to(MODE_CODE);
    display_hint("mode set", "green");
  },
  "mode": function() { 
    alert(get_background_option("mode"));
  },
  "clear": function() {
    history_clear();
  },
  "q": function() {
    window.close();
  },
  "addcmd": function(words) {
    if (words.length != 2) {
      display_hint("invalid arguments", "red");
      return;
    }
    var newcmd = words[1].toLowerCase();
    if (newcmd=="" || !/[a-z]/i.test(newcmd[0])) {
      display_hint("commands start with letter", "red");
      return;
    }
    if (command_table.hasOwnProperty(newcmd)) {
      display_hint("command already in use", "red");
      return;
    }
    change_mode_to(MODE_ADD_CMD, words[1]);
  },
  "rmcmd": function(words) {
    if (words.length != 2) {
      display_hint("invalid arguments", "red");
      return;
    }
    var cmd = words[1].toLowerCase();
    if (!custom_command_table.hasOwnProperty(cmd)) {
      display_hint("no such command", "red");
      return;
    }
    rmcmd(cmd);
  },
  "default": function() {
    display_hint("no such command", "red");
  }
}

var custom_command_table = {}

function addcmd(name, code) {
  custom_command_table[name] = code;
  chrome.storage.local.set({"custom_commands":custom_command_table});
}

function rmcmd(name) {
  if (custom_command_table.hasOwnProperty(name)) {
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
  if (options.hasOwnProperty("name")) {
    mode.name = options.name;
  }
  else {
  	console.log("Create Mode Failed");
  	return;
  }
  ["init", "quit", "onEnter", "onShiftEnter", "onCtrlEnter", "onChange"].forEach(option=>{
    if (options.hasOwnProperty(option)) mode[option] = options[option];
    else mode[option] = function(){}
  });
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
    // background.search_text = text;
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
  onEnter: function() {
    return true;
  },
  onShiftEnter: function() {
    message_current_tab(create_message("code", "enter", get_text()), function(method, action, content) {
      display_hint(content, "darkblue");
      clear_search();
    });
    return false;
  },
});

MODE_ADD_CMD = create_mode({
  name: "addcmd",
  onShiftEnter: function() {
    var newcmd = get_background_option("modemetadata");
    addcmd(newcmd, get_text());
    change_mode_to(MODE_MULTI);
    clear_search();
    return false;
  },
  init: function() {
  	$("#textarea-container").css("height", "200px");
  	$("body").css("background-color", "red");
  },
  quit: function() {
  	$("#textarea-container").css("height", "42px");
  	$("body").css("background-color", "lightblue");
  }
})

function change_mode_to(mode, metadata) {
  metadata || (metadata = "");
  console.assert(ModeInfo.hasOwnProperty(mode));
  pmode = get_background_option("mode");
  if (pmode == mode) return;
  ModeInfo[pmode].quit();
  set_background_option("mode", mode);
  set_background_option("modemetadata", metadata);
  ModeInfo[mode].init();
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

function get_text() {
  return $("#search-text").val();
}


//---------------------------API








})();