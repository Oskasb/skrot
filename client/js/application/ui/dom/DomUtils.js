let rect = {
    centerX:0,
    centerY:0,
    width:0,
    height:0,
    x:0,
    y:0
};

class DomUtils {
    constructor() {
        this.refDiv = document.getElementById("canvas_window");
    }

    getWindowBoundingRect() {
        return document.body.getBoundingClientRect();
    }

    xyInsideRect(x, y, rect) {
        if (rect.x < x && rect.x+rect.width > x) {
            if (rect.y < y && rect.y+rect.height > y) {
                return true;
            }
        }
        return false;
    }

    getElementCenter(element, iframeBody) {
        let bodyRect = this.getWindowBoundingRect();
        let rootRect = iframeBody.getBoundingClientRect();
        let elemRect = element.getBoundingClientRect();
        rect.width = elemRect.width;
        rect.height = elemRect.height;
        rect.y  = elemRect.top  + rootRect.top  - bodyRect.top;
        rect.x = elemRect.left + rootRect.left - bodyRect.left;
        rect.centerY  = elemRect.height * 0.5 + elemRect.top + rootRect.top  - bodyRect.top;
        rect.centerX = elemRect.width * 0.5 + elemRect.left + rootRect.left - bodyRect.left;
        return rect;
    }

    getElementById = function(id) {
        return document.getElementById(id);
    };

    rootFontSize() {
        return this.refDiv.style.fontSize;
    }

    removeDivElement = function(div) {
        if (div.parentNode) div.parentNode.removeChild(div);
    };

    clearDivArray = function(array) {
            while(array.length) {
                this.removeDivElement(array.pop());
            }
    }

    checkForStylePrefix = function(prefix) {
        if (this.refDiv.style[prefix] === "") return prefix;
    };

    checkStylePrefixList = function(prefixes) {
        for (var i in prefixes) {
            var prefix = checkForStylePrefix(prefixes[i]);
            if (prefix) return prefix;
        }
    };


    getTransformPrefix = function() {
        var prefixes = ["transform", "webkitTransform", "MozTransform", "msTransform", "OTransform"];
        return checkStylePrefixList(prefixes);
    };

    getTransitionPrefix = function() {
        var prefixes = ["transition", "WebkitTransition", "MozTransition", "msTransition", "OTransition"];
        return checkStylePrefixList(prefixes);
    };

    setDivElementParent = function(id, parentId) {
        var divId = document.getElementById(id);
        var parentDiv = document.getElementById(parentId);
        parentDiv.appendChild(divId)

    };

    applyElementStyleParams = function(element, styleParams) {
        for(let index in styleParams) {
            element.style[index] = styleParams[index];
        }
    };

    removeElementStyleParams = function(element, styleParams) {
        for(let index in styleParams) {
            element.style[index] = "";
        }
    };

    addElementClass = function(element, styleClass) {
        element.classList.add(styleClass);
    };

    removeElementClass = function(element, styleClass) {
        element.classList.remove(styleClass);
    };

    setElementClass = function(element, styleClass) {
    //    setTimeout(function() {
            element.className = styleClass; //  "game_base "+styleClass;
    //    }, 0);
    };

    createDivElement = function(parent, id, html, styleClass) {
        if (typeof(parent) === "string") parent = document.getElementById(parent);
        let newdiv = this.createElement(parent, id, 'div', html, styleClass);
        return newdiv;
    };

    createCanvasElement = function(parentId, id, source, styleClass, loadedCallback) {
        let  parent = document.getElementById(parentId);
        let  canvas = this.createElement(parent, id, 'canvas', "", styleClass)
        let  image = new Image()
        image.setAttribute('src', source);
        canvas.setAttribute('name', id);
        image.onload = function(){
            canvas.image = image;
            loadedCallback();
        };

        return canvas;
    };

    createIframeElement = function(parentId, id, source, styleClass, loadedCallback) {
        let  parent = document.getElementById(parentId);
        let  iframe = this.createElement(parent, id, 'iframe', "", styleClass)
        iframe.setAttribute('src', source);
        iframe.setAttribute('name', id);
        iframe.onload = function(){
            loadedCallback(iframe);
        };

        return iframe;
    };

    createElement = function(parent, id, type, html, styleClass) {
        let index = parent.getElementsByTagName("*");
        let elem = document.createElement(type, [index]);
        elem.setAttribute('id', id);
        elem.className = styleClass; // "game_base "+styleClass;

        if (html) {
            this.setElementHtml(elem, html)
        }

        parent.appendChild(elem);
        return elem;
    };


    createTextInputElement = function(parent, id, varName, styleClass) {
        let index = parent.getElementsByTagName("*");
        let newdiv = document.createElement('input', [index]);

        newdiv.setAttribute('id', id);
        newdiv.setAttribute('type', "text");
        newdiv.setAttribute('name', varName);

        newdiv.className = styleClass;

        parent.appendChild(newdiv);
        return newdiv;
    };

    setElementHtml = function(element, text) {
        if (typeof(element) == "string") element = this.getElementById(element);

        setTimeout(function() {
            element.innerHTML = text;
        },1)
    };

    setElementBackgroundImg = function(element, url) {
        setTimeout(function() {
            element.style.backgroundImage = "url("+url+")";
        },1)
    };

    applyElementTransform = function(element, transform, time) {
        if (!time) time = 0;
        let transformPrefix = getTransformPrefix();
 //       setTimeout(function() {
            element.style[transformPrefix] = transform;
 //       },time)
    };

    setElementTransition = function(element, transition) {
        let transitionPrefix = getTransitionPrefix();
        element.style[transitionPrefix] = transition;
    };

    removeElement = function(element) {
        this.removeElementChildren(element);
        this.removeDivElement(element);
    };

    getChildCount = function(element) {
        if (element.childNodes) {
            return element.childNodes.length
        }
        return 0;
    };

    removeElementChildren = function(element) {
        if (element.childNodes )
        {
            while ( element.childNodes.length >= 1 )
            {
                element.removeChild(element.firstChild);
            }
        }
    };


    addElementClickFunction = function(element, cFunc) {

        disableElementInteraction(element);
        element.interactionListeners = {};

        let inType = "click";


        element.interactionListeners[inType] = {clickFunc:cFunc, isEnabled:false};
        registerInputSoundElement(element, inType, "UI_HOVER", "UI_ACTIVE", "UI_CLICK", "UI_OUT");
        enableElementInteraction(element);
    };


    disableElementInteraction = function(element) {

        element.style.pointerEvents = "none";
        element.style.cursor = "";

        for (let index in element.soundInteractionListeners) {
            element.removeEventListener(index, element.soundInteractionListeners[index], null);
        };


        for (let index in element.interactionListeners) {

            if (element.interactionListeners[index].isEnabled == true) {
                element.removeEventListener(index, element.interactionListeners[index].clickFunc, false);
                element.interactionListeners[index].isEnabled = false;
            }
        }
    };

    enableElementInteraction = function(element) {
        element.style.pointerEvents = "auto";
        element.style.cursor = "pointer";

        for (let index in element.soundInteractionListeners) {
            element.addEventListener(index, element.soundInteractionListeners[index], null);
        };


        for (let index in element.interactionListeners) {
            if (element.interactionListeners[index].isEnabled == false) {
                element.addEventListener(index, element.interactionListeners[index].clickFunc, false);
                element.interactionListeners[index].isEnabled = true;
            }
        }
    };

    performifyAllElements = function() {
        let tags = document.getElementsByTagName("div");
        let total = tags.length;
        for (let i = 0; i < total; i++ ) {
            tags[i].style["webkitTransformStyle"] = "preserve-3d";
        }
    };

    applyStyleToAllDivs = function(doc, styleName, styleValue) {
        let tags = doc.getElementsByTagName("div");
        let total = tags.length;
        for (let i = 0; i < total; i++ ) {
            tags[i].style[styleName] = styleValue;
        }
    };

    quickHideElement = function(element) {
        element.style.display = "none"
        element.style.visibility = "hidden"
        return;
        let device = "ios"
        //    var device = ""
    //    var device = "android"
        let transform = "rotate3d(0, 1, 0, 89.9deg) translate3d(0px, 0px, -100px)";

        switch (device) {
            case "ios":
                transform = "translate3d(0px, 0px, -50px) scale3d(0.6, 0.1, 1) rotate3d(0, 1, 0, 89.5deg) ";
            break;
            case "android":
                transform = "scale3d(1.1, 1.1, 1) rotate3d(0, 1, 0, 89.9deg) translate3d(0px, 0px, -100px)";
            break;
        }

        applyElementTransform(element, transform);
    };

    quickShowElement = function(element) {
        element.style.display = "";
        //    var transform = "";
        element.style.visibility = "visible"
    //    applyElementTransform(element, transform);
    };

    addClickFunction(element, clickFunc) {
        element.style.pointerEvents = "auto";
        element.style.cursor = "pointer";
        element.addEventListener('click', clickFunc);
    }

    addHoverFunction(element, cb) {
        element.style.pointerEvents = "auto";
        element.style.cursor = "pointer";
        element.addEventListener('mouseover',  cb);
        element.addEventListener('touchstart', cb);
    }

    addMouseMoveFunction(element, cb) {
        element.style.pointerEvents = "auto";
        element.style.cursor = "pointer";
        element.addEventListener('mousemove', cb, { passive: true});
        element.addEventListener('touchmove', cb, { passive: true});
    }

    addPointerExitFunction(element, cb) {
        element.style.pointerEvents = "auto";
        element.style.cursor = "pointer";
        element.addEventListener('touchend', cb);
        element.addEventListener('mouseout', cb);
    }

    addPressStartFunction(element, cb) {
        element.style.pointerEvents = "auto";
        element.style.cursor = "pointer";
        element.addEventListener('mousedown', cb);
        element.addEventListener('touchstart', cb);
    }

    addPressEndFunction(element, cb) {
        element.style.pointerEvents = "auto";
        element.style.cursor = "pointer";
        element.addEventListener('mouseup', cb);
        element.addEventListener('touchend', cb);
    //    element.addEventListener('mouseout', cb);
    //    element.addEventListener('touchcancel', cb);
    }

    translateElement3DPercent(element, x, y, z) {
        let trf = "translate3d("+x+"%, "+y+"%, "+z+")";
        if (element.style.transform !== trf) {
            element.style.transform = trf;
        }
    }


    buildCssTransform(x, y, z, rotY, scale, unit) {
        let trf = "translate3d("+MATH.decimalify(x, 10)+unit+", "+MATH.decimalify(y, 10)+unit+", "+z+")";

        if (typeof(rotY) === 'number') {
            trf += " rotate3d( 0, 0, 1,"+MATH.decimalify(rotY, 100)+"rad)"
        }

        if (typeof (scale) === 'number') {
            trf += " scale3d( "+scale+", "+scale+", 1)";
        }
        return trf;
    }

    transformElement3DPercent(element, x, y, z, rotY, scale) { // div, left, top, depth, eulerY

        let trf = this.buildCssTransform(x, y, z, rotY, scale, '%')

        if (element.style.transform !== trf) {
            element.style.transform = trf;
        }
    }


}

export { DomUtils };