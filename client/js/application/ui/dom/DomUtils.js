import {MATH} from "../../MATH.js";

let rect = {
    centerX:0,
    centerY:0,
    width:0,
    height:0,
    x:0,
    y:0
};

let refDiv;

    function setRefDiv(div) {
        refDiv = div;
    }

    function getRefDiv() {
        return refDiv;
    }

    function getWindowBoundingRect() {
        return document.body.getBoundingClientRect();
    }

    function xyInsideRect(x, y, rect) {
        if (rect.x < x && rect.x+rect.width > x) {
            if (rect.y < y && rect.y+rect.height > y) {
                return true;
            }
        }
        return false;
    }

    function getElementCenter(element, iframeBody) {
        let bodyRect = getWindowBoundingRect();
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

    function getElementById(id) {
        return document.getElementById(id);
    }

    function rootFontSize() {
        return refDiv.style.fontSize;
    }

    function removeDivElement(div) {
        if (div.parentNode) div.parentNode.removeChild(div);
    }

    function clearDivArray(array) {
            while(array.length) {
                removeDivElement(array.pop());
            }
    }

    function setDivElementParent(id, parentId) {
        var divId = document.getElementById(id);
        var parentDiv = document.getElementById(parentId);
        parentDiv.appendChild(divId)

    }

    function applyElementStyleParams(element, styleParams) {
        for(let index in styleParams) {
            element.style[index] = styleParams[index];
        }
    }

    function removeElementStyleParams(element, styleParams) {
        for(let index in styleParams) {
            element.style[index] = "";
        }
    }

    function  addElementClass(element, styleClass) {
        element.classList.add(styleClass);
    }

    function removeElementClass(element, styleClass) {
        element.classList.remove(styleClass);
    }

    function setElementClass(element, styleClass) {
    //    setTimeout(function() {
            element.className = styleClass; //  "game_base "+styleClass;
    //    }, 0);
    }

    function createDivElement(parent, id, html, styleClass) {
        if (typeof(parent) === "string") parent = document.getElementById(parent);
        let newdiv = createElement(parent, id, 'div', html, styleClass);
        return newdiv;
    }

    function createCanvasElement(parentId, id, source, styleClass, loadedCallback) {
        let  parent = document.getElementById(parentId);
        let  canvas = createElement(parent, id, 'canvas', "", styleClass)
        let  image = new Image()
        image.setAttribute('src', source);
        canvas.setAttribute('name', id);
        image.onload = function(){
            canvas.image = image;
            loadedCallback();
        };

        return canvas;
    }

    function createIframeElement(parent, id, source, styleClass, loadedCallback) {
        if (typeof (parent) === 'string') {
             parent = document.getElementById(parent);
        }

        let  iframe = createElement(parent, id, 'iframe', "", styleClass)
        iframe.setAttribute('src', source);
        iframe.setAttribute('name', id);
        iframe.onload = function(){
            loadedCallback(iframe);
        };

        return iframe;
    }

    function createElement(parent, id, type, html, styleClass) {
        let index = parent.getElementsByTagName("*");
        let elem = document.createElement(type, [index]);
        elem.setAttribute('id', id);
        elem.className = styleClass; // "game_base "+styleClass;

        if (html) {
            setElementHtml(elem, html)
        }

        parent.appendChild(elem);
        return elem;
    }


    function createTextInputElement(parent, id, varName, styleClass) {
        let index = parent.getElementsByTagName("*");
        let newdiv = document.createElement('input', [index]);

        newdiv.setAttribute('id', id);
        newdiv.setAttribute('type', "text");
        newdiv.setAttribute('name', varName);

        newdiv.className = styleClass;

        parent.appendChild(newdiv);
        return newdiv;
    }

    function setElementHtml(element, text) {
        if (typeof(element) == "string") element = getElementById(element);

        setTimeout(function() {
            element.innerHTML = text;
        },1)
    }

    function setElementBackgroundImg(element, url) {
        setTimeout(function() {
            element.style.backgroundImage = "url("+url+")";
        },1)
    }

    function applyElementTransform(element, transform, time) {
        if (!time) time = 0;
        let transformPrefix = getTransformPrefix();
 //       setTimeout(function() {
            element.style[transformPrefix] = transform;
 //       },time)
    }

    function setElementTransition(element, transition) {
        let transitionPrefix = getTransitionPrefix();
        element.style[transitionPrefix] = transition;
    }

    function removeElement(element) {
        removeElementChildren(element);
        removeDivElement(element);
    }

    function getChildCount(element) {
        if (element.childNodes) {
            return element.childNodes.length
        }
        return 0;
    }

    function removeElementChildren(element) {
        if (element.childNodes )
        {
            while ( element.childNodes.length >= 1 )
            {
                element.removeChild(element.firstChild);
            }
        }
    }


    function addElementClickFunction(element, cFunc) {

        disableElementInteraction(element);
        element.interactionListeners = {};

        let inType = "click";


        element.interactionListeners[inType] = {clickFunc:cFunc, isEnabled:false};
        registerInputSoundElement(element, inType, "UI_HOVER", "UI_ACTIVE", "UI_CLICK", "UI_OUT");
        enableElementInteraction(element);
    }


    function disableElementInteraction(element) {

        element.style.pointerEvents = "none";
        element.style.cursor = "";

        for (let index in element.soundInteractionListeners) {
            element.removeEventListener(index, element.soundInteractionListeners[index], null);
        }


        for (let index in element.interactionListeners) {

            if (element.interactionListeners[index].isEnabled == true) {
                element.removeEventListener(index, element.interactionListeners[index].clickFunc, false);
                element.interactionListeners[index].isEnabled = false;
            }
        }
    }

    function enableElementInteraction(element) {
        element.style.pointerEvents = "auto";
        element.style.cursor = "pointer";

        for (let index in element.soundInteractionListeners) {
            element.addEventListener(index, element.soundInteractionListeners[index], null);
        }


        for (let index in element.interactionListeners) {
            if (element.interactionListeners[index].isEnabled == false) {
                element.addEventListener(index, element.interactionListeners[index].clickFunc, false);
                element.interactionListeners[index].isEnabled = true;
            }
        }
    }

    function performifyAllElements() {
        let tags = document.getElementsByTagName("div");
        let total = tags.length;
        for (let i = 0; i < total; i++ ) {
            tags[i].style["webkitTransformStyle"] = "preserve-3d";
        }
    }

    function applyStyleToAllDivs(doc, styleName, styleValue) {
        let tags = doc.getElementsByTagName("div");
        let total = tags.length;
        for (let i = 0; i < total; i++ ) {
            tags[i].style[styleName] = styleValue;
        }
    }

    function quickHideElement(element) {
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
    }

    function quickShowElement(element) {
        element.style.display = "";
        //    var transform = "";
        element.style.visibility = "visible"
    //    applyElementTransform(element, transform);
    }

    function addClickFunction(element, clickFunc) {
        element.style.pointerEvents = "auto";
        element.style.cursor = "pointer";
        element.addEventListener('click', clickFunc);
    }

    function addHoverFunction(element, cb) {
        element.style.pointerEvents = "auto";
        element.style.cursor = "pointer";
        element.addEventListener('mouseover',  cb);
        element.addEventListener('touchstart', cb);
    }

    function addMouseMoveFunction(element, cb) {
        element.style.pointerEvents = "auto";
        element.style.cursor = "pointer";
        element.addEventListener('mousemove', cb, { passive: true});
        element.addEventListener('touchmove', cb, { passive: true});
    }

    function addPointerExitFunction(element, cb) {
        element.style.pointerEvents = "auto";
        element.style.cursor = "pointer";
        element.addEventListener('touchend', cb);
        element.addEventListener('mouseout', cb);
    }

    function addPressStartFunction(element, cb) {
        element.style.pointerEvents = "auto";
        element.style.cursor = "pointer";
        element.addEventListener('mousedown', cb);
        element.addEventListener('touchstart', cb);
    }

    function addPressEndFunction(element, cb) {
        element.style.pointerEvents = "auto";
        element.style.cursor = "pointer";
        element.addEventListener('mouseup', cb);
        element.addEventListener('touchend', cb);
        element.addEventListener('mouseout', cb);
        element.addEventListener('touchcancel', cb);
    }

    function translateElement3DPercent(element, x, y, z) {



        if (!element.parent) {
            element.style.transformStyle = 'preserve-3d'
            element.parent = element.offsetParent
            element.parent.style.transformStyle = 'preserve-3d';
            element.parentHeight = parent.offsetHeight;
            element.parentWidth = parent.offsetWidth;

        }

        if (Math.random() < 0.01) {
            element.parentHeight = element.parent.offsetHeight;
            element.parentWidth = element.parent.offsetWidth;
        }

        let parentHeight = element.parentHeight;
        let parentWidth = element.parentWidth;
        let pxX = parentWidth * x / 100;
        let pxY = parentHeight * y / 100;
        let trf = "translate3d("+pxX+"px, "+pxY+"px, "+z+"px)";
        if (element.style.transform !== trf) {
            element.style.transform = trf;
        }
    }


    function buildCssTransform(x, y, z, rotY, scale, unit) {
        let trf = "translate3d("+MATH.decimalify(x, 10)+unit+", "+MATH.decimalify(y, 10)+unit+", "+z+")";

        if (typeof(rotY) === 'number') {
            trf += " rotate3d( 0, 0, 1,"+MATH.decimalify(rotY, 100)+"rad)"
        }

        if (typeof (scale) === 'number') {
            trf += " scale3d( "+scale+", "+scale+", 1)";
        }
        return trf;
    }

    function transformElement3DPercent(element, x, y, z, rotY, scale) { // div, left, top, depth, eulerY

        let trf = buildCssTransform(x, y, z, rotY, scale, '%')

        if (element.style.transform !== trf) {
            element.style.transform = trf;
        }
    }

    function pointerEventToPercentX(e) {
        let x = e.pageX;
        if (e.touches) {
          x = e.touches[0].pageX;
        }

        let width = e.target.offsetWidth;
        return MATH.percentify(x, width)

    }

function pointerEventToPercentY(e) {
    let y = e.pageY;
    if (e.touches) {
        y = e.touches[0].pageY;
    }
    let height = e.target.offsetHeight;
    return MATH.percentify(y, height)
}


export {
    setRefDiv,
    getRefDiv,
    getWindowBoundingRect,
    xyInsideRect,
    getElementCenter,
    getElementById,
    rootFontSize,
    removeDivElement,
    clearDivArray,
    setDivElementParent,
    applyElementStyleParams,
    removeElementStyleParams,
    addElementClass,
    removeElementClass,
    setElementClass,
    createDivElement,
    createCanvasElement,
    createIframeElement,
    createElement,
    createTextInputElement,
    setElementHtml,
    setElementBackgroundImg,
    applyElementTransform,
    setElementTransition,
    removeElement,
    getChildCount,
    removeElementChildren,
    addElementClickFunction,
    disableElementInteraction,
    enableElementInteraction,
    performifyAllElements,
    applyStyleToAllDivs,
    quickHideElement,
    quickShowElement,
    addClickFunction,
    addHoverFunction,
    addMouseMoveFunction,
    addPointerExitFunction,
    addPressStartFunction,
    addPressEndFunction,
    translateElement3DPercent,
    transformElement3DPercent,
    buildCssTransform,
    pointerEventToPercentX,
    pointerEventToPercentY
};