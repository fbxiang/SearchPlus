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
  switch(action) {
    case "normal":
      remove_highlight();
      highlight(keyword);
      break;
    case "multi":
      remove_highlight();
      keywords = keyword.split(" ");
      colors = ["yellow", "aqua", "chartreuse", "Magenta", "orange"];
      for (var i = 0; i < keywords.length; i++) {
        highlight(keywords[i], colors[i%(colors.length)]);
      }
  }
  return create_message("search","response","");
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

function process_message(message, callback) {
  callback(message._method, message._action, message._content);
}

function iterate_text(info, callback) {
  iterate_text_aux(document.body, info, callback);
}

function iterate_text_aux(node, info, callback) {
  exclude_elements = ['script', 'style', 'iframe', 'canvas', 'mark'];
  var child = node.firstChild;
  while(child){
    switch (child.nodeType) {
      case 1:
        if (exclude_elements.indexOf(child.tagName.toLowerCase()) > -1) {
          break;
        }
        iterate_text_aux(child, info, callback);
        break;
      case 3:
        callback(info, child);
        break;
    }
    child = child.nextSibling;
  }
}

function replace(source, target) {
  iterate_text(null, function(info, node){
  	var pNode = node.parentNode;
    node.data = node.data.replace(source, "<i style=\"color=blue\">"+target+"</i>");
  })
}

function highlight(target, color) {
  color || (color = "yellow");
  if (target.length <= 0) return;
  var info = {count:0};
  iterate_text(info, function(info, node){
    var pNode = node.parentNode;
    var idx;
    while ((idx = node.data.indexOf(target)) >= 0) {
      info.count++;
      var text = node.data;
      var text1 = text.substring(0, idx);
      var text2 = text.substring(idx+target.length);
      var textNode1 = document.createTextNode(text1);
      // var textNode2 = document.createTextNode(text2);
      var iNode = document.createElement("mark")
      var textNode = document.createTextNode(target);
      iNode.setAttribute("class", "search-plus-style");
      iNode.style["background-color"] = color;
      iNode.appendChild(textNode);
      pNode.insertBefore(iNode, node);
      pNode.insertBefore(textNode1, iNode);
      node.data = text2;
    }
  });
  return info.count;
}

function iterate(info, key_func, callback) {
  iterate_aux(body, info, key_func, callback);
}

function iterate_aux(node, info, key_func, callback) {
  var child = node.firstChild;
  while(child){
    switch (key_func(child)) {
      case 1: // Child is what we want
        callback(info, child);
        break;
      case 0: // Child is not what we want
        iterate_aux(child, info, key_func, callback);
        break;
      case -1: // Child is what should be excluded
        break;
    }
    child = child.nextSibling;
  }
}

function remove_highlight() {
  iterate_remove_highlight(document.body);
}

function iterate_remove_highlight(node) {
  var child = node.firstChild;
  exclude_elements = ['script', 'style', 'iframe', 'canvas'];
  while (child){
    if (!child.tagName || exclude_elements.indexOf(child.tagName.toLowerCase()) > -1) {
      // continue to next loop
    }
    else if (child.tagName.toLowerCase() == "mark" && child.getAttribute("class").indexOf("search-plus") > -1) {
      var pNode = child.parentNode;
      var text1 = "";
      var text2 = "";
      var text = "";
      if (child.childNodes[0] && child.childNodes[0].nodeType == 3) {
      	text = child.childNodes[0].data;
      }
      if (child.previousSibling && child.previousSibling.nodeType == 3){
      	text1 = child.previousSibling.data;
      	pNode.removeChild(child.previousSibling);
      }
      if (child.nextSibling && child.nextSibling.nodeType == 3){
      	text2 = child.nextSibling.data;
      	pNode.removeChild(child.nextSibling);
      }
      var textNode = document.createTextNode(text1+text+text2);
      pNode.replaceChild(textNode, child);
      child = textNode;
    }
    else {iterate_remove_highlight(child);}
    child = child.nextSibling;
  }
}