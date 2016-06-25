/* Background page stuff */
var background = chrome.extension.getBackgroundPage();
/* initialize a counter which controls which history item to read. */
var history_counter = history_length();

$(document).ready(function() {
  ModeInfo[get_mode()].init();
  set_search(background.search_text);
});

/* detect up/down arrow is just pressed. if so, go over the history entries. */
var upkey = 0;
var downkey = 0;
$(document).ready(function(){
  $("#search-text").keydown(function(event) {
    if (event.which == 38 && upkey == 0) {
      upkey = 1;
      set_search(history_back());
    }
    if (event.which == 40 && downkey == 0) {
      downkey = 1;
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

/*
 * [Search mode] when enter is pressed, send message {"search", "enter", search_text} to content script
 * [Code   mode] when enter is pressed, send message {"code," "enter", search_text}
 */
$(document).ready(function(){
  $("#search-text").keypress(function(event) {
    // enter is pressed
    if (event.which == 13 && !event.shiftKey) {
      search_text = $("#search-text").val();
      if (is_cmd(search_text)) {
        process_cmd(search_text.substring(1));
      }
      else if (get_mode() == MODE_CODE) {
        message_current_tab(create_message("code", "enter", search_text), function(method, action, content) {
          display_hint(content, "darkblue");
          clear_search();
        });
      }
      else {
        message_current_tab(create_message("search", "enter", search_text), process_search_response);
      }
      history_add(search_text);
      history_set_counter();
      return false;
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
    var text = $("#search-text").val();
    if (text != "" && !is_cmd(text) && get_mode() != MODE_CODE){
      console.log("Sending search request.");
      message_current_tab(create_message("search", "text", text), function(){
        console.log("Search response received.");
      });
    }
    background.search_text = text;
  });
});

/* Working in progerss*/
function process_search_response(method, action, content) {
  if (method == "WIP") {
    alert("WIP");
  }
}

/*
  @param keyword    keyword typed in popup search bar
  @return           whether it is a command
*/
function is_cmd(keyword) {
  return keyword[0] == '/';
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
    command_table[name]();
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
  "default": function() {
    display_hint("no such command", "red");
  }
}

Mode_Count = 0;
ModeInfo = {};

MODE_DEFAULT = {
  id: -1,
  name: "",
  init: function(){},
  quit: function(){},
}

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
  if (options.hasOwnProperty("init")) {
    mode.init = options.init;
  }
  else {
    mode.init = MODE_DEFAULT.init;
  }
  if (options.hasOwnProperty("quit")) {
    mode.quit = options.quit;
  }
  else {
  	mode.quit = MODE_DEFAULT.quit;
  }
  mode.id = Mode_Count++; 
  ModeInfo[mode.id] = mode;
  return mode.id;
}

MODE_NORMAL = create_mode({
  name: "normal"
});

MODE_REGEX = create_mode({
  name: "regex"
});

MODE_MULTI = create_mode({
  name: "multi"
});

MODE_CODE = create_mode({
  name: "code",
  init: function(){
  	$("#textarea-container").css("height", "200px");
  },
  quit: function(){
  	$("#textarea-container").css("height", "42px");
  }
})

function change_mode_to(mode) {
  console.assert(ModeInfo.hasOwnProperty(mode));
  pmode = get_background_option("mode");
  if (pmode == mode) return;
  ModeInfo[pmode].quit();
  set_background_option("mode", mode);
  ModeInfo[mode].init();
}

function get_mode() {
  return get_background_option("mode");
}