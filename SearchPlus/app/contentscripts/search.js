var highlighted_elems = [] // list for storing elements
var elem_counter = -1 // selected element

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
  var count = 0;
  switch(action) {
    case "normal":
      remove_highlight();
      reset_counter();
      highlight(keyword);
      highlighted_elems = collect_highlighted_elements();
      count = highlighted_elems.length;
      emphasize_elem(next_elem());
      scroll_to(this_elem());
      break;
    case "multi":
      remove_highlight();
      reset_counter();
      keywords = keyword.split(" ");
      colors = ["yellow", "aqua", "chartreuse", "Magenta", "orange"];
      for (var i = 0; i < keywords.length; i++) {
        highlight(keywords[i], colors[i%(colors.length)]);
      }
      highlighted_elems = collect_highlighted_elements();
      count = highlighted_elems.length;
      emphasize_elem(next_elem());
      scroll_to(this_elem());
      break;
    case "enter":
      remove_emphasis(this_elem());
      emphasize_elem(next_elem());
      scroll_to(this_elem());
      count = highlighted_elems.length;
  }
  return create_message("search","response", (elem_counter+1) + " of " + count);
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
 * Interface for message receiving. (Message should be handled with this function)
 */
function process_message(message, callback) {
  callback(message._method, message._action, message._content);
}

function iterate_text(info, callback) {
  iterate(info, function(node) {
    exclude_elements = ['script', 'style', 'iframe', 'canvas', 'mark'];
    switch (node.nodeType) {
      case 1:
        if (exclude_elements.indexOf(node.tagName.toLowerCase()) > -1)
          return -1;
        if (node.offsetParent == null)
          return -1;
        break;
      case 3:
        return 1;
      break;
    }
    return 0;
  }, callback);

}

function replace(source, target) {
  iterate_text(null, function(info, node){
  	var pNode = node.parentNode;
    node.data = node.data.replace(source, target);
  })
}

/* Add colored highlight to all target text 
 */
function highlight(target, color) {
  color || (color = "yellow");
  if (target.length <= 0) return;
  var info = {count:0};
  iterate_text(info, function(info, node){
    var pNode = node.parentNode;
    var idx;
    while ((idx = node.data.toLowerCase().indexOf(target.toLowerCase())) >= 0) {
      info.count++;
      var text = node.data;
      var textLeft = text.substring(0, idx);
      var textRight = text.substring(idx+target.length);
      var textMid = text.substring(idx, idx+target.length);
      var textNodeLeft = document.createTextNode(textLeft);
      var iNode = document.createElement("mark")
      var textNodeMid = document.createTextNode(textMid);
      iNode.setAttribute("class", "search-plus-style");
      iNode.style["background-color"] = color;
      iNode.appendChild(textNodeMid);
      pNode.insertBefore(iNode, node);
      pNode.insertBefore(textNodeLeft, iNode);
      node.data = textRight;
    }
  });
  return info.count;
}

/* Iterate throught the document body
 * @param info            first argument of call back
 * @param key_func(node)  returns 1 if the node is our target, callback(info, node) will be applied
 *                        returns 0 if the node shoule be further expanded
 *                        returns -1 if the node should be discarded immediately
 * @param callback(info, node)
 */
function iterate(info, key_func, callback) {
  iterate_aux(document.body, info, key_func, callback);
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


/*
 * Collect all highlighted elements
 */
function collect_highlighted_elements() {
  elems = [];
  exclude_elements = ['script', 'style', 'iframe', 'canvas'];
  iterate(elems, 
  	function(node){
  	  if (node.nodeType != 1) return -1;
      if (exclude_elements.indexOf(node.tagName.toLowerCase()) > -1)
        return -1;
      if (node.offsetParent == null) // invisible
        return -1;
      if (node.tagName.toLowerCase() == "mark" && node.getAttribute("class").indexOf("search-plus") > -1)
        return 1;
      return 0;
  	},
  	function(elems, node) {
  	  elems.push(node);
  	});
  return elems;
}

/* Removes all highlights at once
 */
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

function reset_counter() {
  elem_counter = -1;
}

function next_elem() {
  if (highlighted_elems.length == 0) return null;
  elem_counter = (elem_counter+1) % highlighted_elems.length;
  return highlighted_elems[elem_counter];
}

function this_elem() {
  if (highlighted_elems.length == 0) return null;
  return highlighted_elems[elem_counter];
}

function emphasize_elem(node) {
  if (node == null) return;
  node.style["border"] = "2px solid black"
}

function remove_emphasis(node) {
  if (node == null) return;
  node.style["border"] = "";
}

function scroll_to(node) {
  if (node == null) return;
  node.scrollIntoView();
}