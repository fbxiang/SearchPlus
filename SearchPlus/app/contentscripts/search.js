/*
 * register listener for messages
 */
chrome.runtime.onMessage.addListener(function(message, sender, sendResponse) {
  process_message(message, function(method, action, content){
    if (method == "search")// we only listen to search message
    {
      var keyword = content;
      console.log("[Search]"+keyword);
      var response = process(keyword, action);
      // Function in progress
      iterate_text([], function(list, node) {
      	  // alert(node.innerHTML);
      });
      sendResponse(response);
      return;
    }
    else if (method == "code") {
      // eval evaluates the code
      sendResponse(create_message("code", "response", eval(content)));
    }
    sendResponse(create_message("Unknown","None","None"));
  });
});

function process(keyword, action) {
  return create_message("WIP","None","None");
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

function iterate_text(info, func) {
  iterate_text_aux(document.body, info, func);
}

function iterate_text_aux(node, info, func) {
  if (node.nodeValue != null) {
    func(info, node);
    return;
  }
  var cnodes = node.childNodes;
  for (var i = 0; i < cnodes.length; i++) {
    iterate_text_aux(cnodes[i], info, func);
  }
}