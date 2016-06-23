var background = chrome.extension.getBackgroundPage();
var history_counter = history_length();

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

$(document).ready(function(){
  $("#search-text").keyup(function(event) {
    if (event.which == 38) upkey = 0;
    else if (event.which == 40) downkey = 0;
  });
});

/*
 * when enter is pressed, send message {search, enter} to content script
 */
$(document).ready(function(){
  $("#search-text").keypress(function(event) {
    // enter is pressed
    if (event.which == 13) {
      search_text = $("#search-text").val();
      if (is_cmd(search_text)) {
        process_cmd(search_text.substring(1));
      }
      else if (get_background_option("mode") == "code") {
        message_current_tab(create_message("code", "enter", search_text), function(method, action, content) {
          display_hint(content, "darkblue");
          clear_search();
        });
      }
      else {
        message_current_tab(create_message("search", "enter", search_text), process_response);
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
 * send message {search, type} to content script
 * 
 */
$(document).ready(function() {
  $("#search-text").bind("input propertychange", function(event){
    clear_hint();
    var text = $("#search-text").val();
    if (text != "" && !is_cmd(text) && get_background_option("mode") != "code"){
      console.log("Sending search request.");
      message_current_tab(create_message("search", "text", text), function(){
        console.log("Search response received.");
      });
    }
  });
});

function process_response(method, action, content) {
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
  var words = keyword.split(" ");
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

function display_hint(content, color) {
  $("#search-hint").text(content);
  $("#search-hint").css("color", color);
}

function clear_search() {
  $("#search-text").val("");
}

function set_search(item) {
  $("#search-text").val(item);
}

function clear_hint() {
  $("#search-hint").text("");
}

function history_add(item) {
  background.search_history.push(item);
}

function history_clear() {
  background.search_history = [];
}

function history_has(i) {
  return i >= 0 && i < background.search_history.length;
}

function history_get(i) {
  return background.search_history[i];
}

function history_length() {
  return background.search_history.length;
}

function history_set_counter() {
  history_counter = history_length();
}

function history_clear() {
  background.search_history = [];
  history_counter = 0;
}

function history_back() {
  if (history_has(history_counter-1)) {
    history_counter--;
  }
  return history_get(history_counter);
}

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

function set_background_option(k, v) {
  background.global_options[k] = v;
}

function get_background_option(k) {
  return background.global_options[k];
}

/*
 * Send message to current tab content script
 * @param message       the message to send, created via create_message(method, action, content)
 * @param func_response(method, action, content)
 *                      fcuntion that processes the response from content script
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

function process_message(message, func) {
  func(message._method, message._action, message._content);
}

var command_table = {
  "test": function() {
    alert("test"); 
    display_hint("success", "green");
  },
  "normal": function() { 
    set_background_option("mode", "normal"); 
    display_hint("mode set", "green");
  },
  "regex": function() { 
    set_background_option("mode", "regex"); 
    display_hint("mode set", "green");
  },
  "multi": function() { 
    set_background_option("mode", "multi"); 
    display_hint("mode set", "green");
  },
  "code": function() { 
    set_background_option("mode", "code"); 
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