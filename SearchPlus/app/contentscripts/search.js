var PostInterface = {
    "search": content => {
        return 'search response';
    },
    "code": content => {
        console.log('executing code');
        var result;
        try {
            result = eval(content);
        }
        catch(err) {
            reseult = err.message;
        }
        return result;
    }
};

var GetInterface = {
};

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    console.log('[search] message received:', message);
    // check the message comes from this extension
    if (sender.id !== chrome.runtime.id) return;
    switch (message.method.toLowerCase() == 'post') {
    case 'post':
        if (PostInterface[message.action]) {
            sendResponse(PostInterface[message.action](message.content));
        }
        break;
    case 'get':
        if (GetInterface[message.action]) {
            sendResponse(GetInterface[message.action](message.content));
        };
    }
});

// var highlighted_elems = []; // list for storing elements
// var elem_counter = -1; // selected element

let nodeList = []; // all highlighted elements
let nodeCounter = -1; // counts current element

// function process(keyword, action) {
//     var count = 0;
//     switch(action) {
//     case "normal":
//         remove_highlight();
//         reset_counter();
//         highlight(keyword);
//         highlighted_elems = collect_highlighted_elements();
//         emphasize_elem(next_elem());
//         scroll_to(this_elem());
//         break;
//     case "multi":
//         remove_highlight();
//         reset_counter();
//         var keywords = keyword.split(" ");
//         colors = ["yellow", "aqua", "chartreuse", "Magenta", "orange"];
//         for (var i = 0; i < keywords.length; i++) {
//             highlight(keywords[i], colors[i%(colors.length)]);
//         }
//         highlighted_elems = collect_highlighted_elements();
//         emphasize_elem(next_elem());
//         scroll_to(this_elem());
//         break;
//     case "regex":
//         remove_highlight();
//         reset_counter();
//         var regex = new RegExp(keyword, "i");
//         highlight(regex);
//         highlighted_elems = collect_highlighted_elements();
//         emphasize_elem(next_elem());
//         scroll_to(this_elem());
//         break;
//     case "nav":
//         remove_highlight();
//         reset_counter();
//         highlight(keyword, null, elementInViewport);
//         highlighted_elems = collect_highlighted_elements();
//         emphasize_elem(next_elem());
//         break;
//     case "next":
//         remove_emphasis(this_elem());
//         emphasize_elem(next_elem());
//         scroll_to(this_elem());
//         break;
//     case "prev":
//         remove_emphasis(this_elem());
//         emphasize_elem(prev_elem());
//         scroll_to(this_elem());
//         break;
//     case "click":
//         if (this_elem()) this_elem().click();
//     default:
//         break;
//     }
//     return create_message("search","response", (elem_counter+1) + " of " + highlighted_elems.length);
// }


function iterateTextNdoes(accumulator, callback) {
    iterate(document.body, accumulator, node => {
        switch (node.nodeType) {
        case 1:
            if (['script', 'style', 'iframe', 'canvas'].includes(node.tagName.toLowerCase()))
                return -1;
            if (isHidden(node))
                return -1;
            break;
        case 3:
            return 1;
            break;
        default:
            return 0;
        }
    }, callback);
}

// function replace(source, target) {
//     if (!source || !target) return;
//     iterate_text(null, function(info, node){
//   	    var pNode = node.parentNode;
//         node.data = node.data.replace(RegExp(source,'i'), target);
//     })
// }

function highlight(target, color, condition) {
    if (!target) return;
    color || (color = 'yellow');
    condition || (condition = () => true);

    if (target.length <= 0) return;
    let count = {count: 0};
    let regex = typeof target == 'string' ? makeRegex(target) : target;
    iterateTextNdoes(count, (count, node) => {
        var pNode = node.parentNode;
        if (!condition(pNode)) return;
        var match;
        while ((match = node.data.match(regex))) {
            var idx1 = match.index;
            var idx2 = idx1 + match[0].length;
            count.count++;
            var text = node.data;
            var textLeft = text.substring(0, idx1);
            var textRight = text.substring(idx2);
            var textMid = text.substring(idx1, idx2);
            var textNodeLeft = document.createTextNode(textLeft);
            var iNode = document.createElement("mark");
            var textNodeMid = document.createTextNode(textMid);
            iNode.setAttribute("class", "search-plus-style");
            iNode.style["background-color"] = color;
            iNode.appendChild(textNodeMid);
            pNode.insertBefore(iNode, node);
            pNode.insertBefore(textNodeLeft, iNode);
            node.data = textRight;
        }
    })
}

// /* Add colored highlight to all target text 
//  */
// function highlight(target, color, condition) {
//     if (!target) return;
//     color || (color = "yellow");
//     condition || (condition = _ => true );

//     if (target.length <= 0) return;
//     var info = {count:0};
//     var regex = typeof target == "string" ? exact_regex(target) : target;
//     if (regex.test("")) return; // important!
//     iterate_text(info, function(info, node){
//         var pNode = node.parentNode;
//         if (!condition(pNode)) return;
//         var match;
//         while (match = node.data.match(regex)) {
//             var idx1 = match.index;
//             var idx2 = idx1 + match[0].length;
//             info.count++;
//             var text = node.data;
//             var textLeft = text.substring(0, idx1);
//             var textRight = text.substring(idx2);
//             var textMid = text.substring(idx1, idx2);
//             var textNodeLeft = document.createTextNode(textLeft);
//             var iNode = document.createElement("mark")
//             var textNodeMid = document.createTextNode(textMid);
//             iNode.setAttribute("class", "search-plus-style");
//             iNode.style["background-color"] = color;
//             iNode.appendChild(textNodeMid);
//             pNode.insertBefore(iNode, node);
//             pNode.insertBefore(textNodeLeft, iNode);
//             node.data = textRight;
//         }
//     });
//     return info.count;
// }

function makeRegex(str, modifiers) {
    modifiers || (modifiers = "i");
    var result = "";
    for (var i = 0; i < str.length; i++) {
        result += "["+str[i]+"]";
    }
    return new RegExp(result, modifiers);
}


// iterate from node
function iterate(node, accumulator, key, callback) {
    var child = node.firstChild;
    while(child){
        switch (key(child)) {
        case 1: // Child is what we want
            callback(accumulator, child);
            break;
        case 0: // Child is not what we want
            iterate(child, accumulator, key, callback);
            break;
        case -1: // Child is what should be excluded
            break;
        }
        child = child.nextSibling;
    }
}

// /*
//  * Collect all highlighted elements
//  */
// function collect_highlighted_elements() {
//     elems = [];
//     exclude_elements = ['script', 'style', 'iframe', 'canvas'];
//     iterate(elems,
//   	        function(node){
//   	            if (node.nodeType != 1) return -1;
//                 if (exclude_elements.indexOf(node.tagName.toLowerCase()) > -1)
//                     return -1;
//                 if (is_hidden(node)) // invisible
//                     return -1;
//                 if (node.tagName.toLowerCase() == "mark" && node.getAttribute("class").indexOf("search-plus") > -1)
//                     return 1;
//                 return 0;
//   	        },
//   	        function(elems, node) {
//   	            elems.push(node);
//   	        });
//     return elems;
// }

// /* Removes all highlights at once
//  */
// function remove_highlight() {
//     iterate_remove_highlight(document.body);
// }

// function iterate_remove_highlight(node) {
//     var child = node.firstChild;
//     exclude_elements = ['script', 'style', 'iframe', 'canvas'];
//     while (child){
//         if (!child.tagName || exclude_elements.indexOf(child.tagName.toLowerCase()) > -1) {
//             // continue to next loop
//         }
//         else if (child.tagName.toLowerCase() == "mark" && child.getAttribute("class").indexOf("search-plus") > -1) {
//             var pNode = child.parentNode;
//             var text1 = "";
//             var text2 = "";
//             var text = "";
//             if (child.childNodes[0] && child.childNodes[0].nodeType == 3) {
//       	        text = child.childNodes[0].data;
//             }
//             if (child.previousSibling && child.previousSibling.nodeType == 3){
//       	        text1 = child.previousSibling.data;
//       	        pNode.removeChild(child.previousSibling);
//             }
//             if (child.nextSibling && child.nextSibling.nodeType == 3){
//       	        text2 = child.nextSibling.data;
//       	        pNode.removeChild(child.nextSibling);
//             }
//             var textNode = document.createTextNode(text1+text+text2);
//             pNode.replaceChild(textNode, child);
//             child = textNode;
//         }
//         else {iterate_remove_highlight(child);}
//         child = child.nextSibling;
//     }
// }

// function reset_counter() {
//     elem_counter = -1;
// }

// function next_elem() {
//     if (highlighted_elems.length == 0) return null;
//     elem_counter = (elem_counter+1) % highlighted_elems.length;
//     return highlighted_elems[elem_counter];
// }

// function prev_elem() {
//     if (highlighted_elems.length == 0) return null;
//     elem_counter = (elem_counter-1+highlighted_elems.length) % highlighted_elems.length;
//     return highlighted_elems[elem_counter];
// }

// function this_elem() {
//     if (highlighted_elems.length == 0) return null;
//     return highlighted_elems[elem_counter];
// }

function mark(node) {
    if (node) {
        node.style['border'] = '2px solid black';
    }
}

function unmark(node) {
    if (node) {
        node.style['border'] = '';
    }
}

function scrollTo(node) {
    if (node) node.scrollIntoViewIfNeeded();
}

function isHidden(node) {
    return node.offsetParent == null;
}

// function is_hidden(node) {
//     return node.offsetParent == null;
// }

// function elementInViewport(el) {
//     var top = el.offsetTop;
//     var left = el.offsetLeft;
//     var width = el.offsetWidth;
//     var height = el.offsetHeight;

//     while(el.offsetParent) {
//         el = el.offsetParent;
//         top += el.offsetTop;
//         left += el.offsetLeft;
//     }

//     return (
//         top >= window.pageYOffset &&
//             left >= window.pageXOffset &&
//             (top + height) <= (window.pageYOffset + window.innerHeight) &&
//             (left + width) <= (window.pageXOffset + window.innerWidth)
//     );
// }
