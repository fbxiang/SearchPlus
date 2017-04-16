var PostInterface = {
    "search": content => {
        removeHighlight();
        highlight(content, 'yellow', node =>{
            return node.tagName.toLowerCase() == 'a' ||
                window.getComputedStyle(node.firstChild.parentElement, null).cursor == 'pointer';
        });
        nextElem();
        return `${nodeCounter + 1} of ${nodeList.length}`;
    },
    "next": () => {
        nextElem();
        console.log(window.getComputedStyle(thisElem().parentElement, null));
        return `${nodeCounter + 1} of ${nodeList.length}`;
    },
    "prev": () => {
        prevElem();
        return `${nodeCounter + 1} of ${nodeList.length}`;
    },
    "click": () => {
        if (thisElem()) thisElem().click();
        return null;
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
    if (sender.id != chrome.runtime.id) return;
    switch (message.method.toLowerCase()) {
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

let nodeList = []; // all highlighted elements
let nodeCounter = -1; // counts current element

// function process(keyword, action) {
//     var count = 0;
//     switch(action) {
//     case "normal":
//         removeHighlight();
//         reset_counter();
//         highlight(keyword);
//         nodeList = collect_highlighted_elements();
//         emphasize_elem(next_elem());
//         scroll_to(this_elem());
//         break;
//     case "multi":
//         removeHighlight();
//         reset_counter();
//         var keywords = keyword.split(" ");
//         colors = ["yellow", "aqua", "chartreuse", "Magenta", "orange"];
//         for (var i = 0; i < keywords.length; i++) {
//             highlight(keywords[i], colors[i%(colors.length)]);
//         }
//         nodeList = collect_highlighted_elements();
//         emphasize_elem(next_elem());
//         scroll_to(this_elem());
//         break;
//     case "regex":
//         removeHighlight();
//         reset_counter();
//         var regex = new RegExp(keyword, "i");
//         highlight(regex);
//         nodeList = collect_highlighted_elements();
//         emphasize_elem(next_elem());
//         scroll_to(this_elem());
//         break;
//     case "nav":
//         removeHighlight();
//         reset_counter();
//         highlight(keyword, null, elementInViewport);
//         nodeList = collect_highlighted_elements();
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
//     return create_message("search","response", (nodeCounter+1) + " of " + nodeList.length);
// }


function iterateTextNdoes(callback) {
    iterate(document.body, node => {
        switch (node.nodeType) {
        case 1:
            if (['script', 'style', 'iframe', 'canvas'].includes(node.tagName.toLowerCase()))
                return -1;
            if (isHidden(node))
                return -1;
            else
                return 0;
            break;
        case 3:
            return 1;
            break;
        default:
            return 0;
        }
    }, callback);
}

function replace(source, target) {
    if (!source || !target) return;
    iterateTextNdoes(node => {
  	    var pNode = node.parentNode;
        node.data = node.data.replace(RegExp(source,'i'), target);
    });
}

function highlight(target, color='yellow', condition=(node)=>true) {
    if (target.length <= 0) return;
    let elements = [];
    let regex = typeof target == 'string' ? makeRegex(target) : target;
    if (regex.test('')) return;
    iterateTextNdoes(node => {
        let pNode = node.parentNode;
        if (!condition(pNode)) return;
        let match;
        while ((match = node.data.match(regex))) {
            let idx1 = match.index;
            let idx2 = idx1 + match[0].length;
            let text = node.data;
            let textLeft = text.substring(0, idx1);
            let textRight = text.substring(idx2);
            let textMid = text.substring(idx1, idx2);
            let textNodeLeft = document.createTextNode(textLeft);
            let iNode = document.createElement("mark");
            let textNodeMid = document.createTextNode(textMid);
            iNode.setAttribute("class", "search-plus-style");
            iNode.style["background-color"] = color;
            iNode.appendChild(textNodeMid);
            pNode.insertBefore(iNode, node);
            pNode.insertBefore(textNodeLeft, iNode);
            node.data = textRight;
            elements.push(iNode);
        }
    });
    nodeList = elements;
    resetCounter();
}

function makeRegex(str, modifiers) {
    modifiers || (modifiers = "i");
    let result = "";
    for (let i = 0; i < str.length; i++) {
        result += "["+str[i]+"]";
    }
    return new RegExp(result, modifiers);
}


// iterate from node
function iterate(node, key, callback) {
    let child = node.firstChild;
    while(child){
        switch (key(child)) {
        case 1: // Child is what we want
            callback(child);
            break;
        case 0: // Child is not what we want
            iterate(child, key, callback);
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
//     excludeElems = ['script', 'style', 'iframe', 'canvas'];
//     iterate(elems,
//   	        function(node){
//   	            if (node.nodeType != 1) return -1;
//                 if (excludeElems.indexOf(node.tagName.toLowerCase()) > -1)
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

function removeHighlight() {
    iterativeRemoveHighlight(document.body);
    nodeList = [];
    resetCounter();
}

function iterativeRemoveHighlight(node) {
    let child = node.firstChild;
    excludeElems = ['script', 'style', 'iframe', 'canvas'];
    while (child){
        if (!child.tagName || excludeElems.includes(child.tagName.toLowerCase())) {
            // continue
        }
        else if (child.tagName.toLowerCase() == "mark" && child.getAttribute("class").includes("search-plus")) {
            let pNode = child.parentNode;
            let text1 = "";
            let text2 = "";
            let text = "";
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
            let textNode = document.createTextNode(text1+text+text2);
            pNode.replaceChild(textNode, child);
            child = textNode;
        }
        else {
            iterativeRemoveHighlight(child);
        }
        child = child.nextSibling;
    }
}

function resetCounter() {
    nodeCounter = -1;
}

function nextElem() {
    if (nodeList.length == 0) return null;
    unmark(thisElem());
    nodeCounter = (nodeCounter+1) % nodeList.length;
    mark(thisElem());
    scrollTo(thisElem());
    return nodeList[nodeCounter];
}

function prevElem() {
    if (nodeList.length == 0) return null;
    unmark(thisElem());
    nodeCounter = (nodeCounter-1+nodeList.length) % nodeList.length;
    mark(thisElem());
    scrollTo(thisElem());
    return nodeList[nodeCounter];
}

function thisElem() {
    if (nodeList.length == 0) return null;
    return nodeList[nodeCounter];
}

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
