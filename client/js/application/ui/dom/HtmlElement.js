import {updateKeyState} from "../input/KeyboardState.js";
import {getSetting} from "../../utils/StatusUtils.js";
import {MATH} from "../../MATH.js";
import {
    addClickFunction,
    buildCssTransform,
    createDivElement, createIframeElement,
    getElementById, getRefDiv, removeElement,
    removeElementChildren, rootFontSize
} from "./DomUtils.js";

let index = 0;

let activeRootElements = [];
let colorScale = 1;
let defaultBaseTransform = "rotate3d(0, 0, 0, 1.0rad) translate3d(0, 0, 0)";

function updateValueElem(key, value, iframe, lastStatus) {

        if (lastStatus[key] !== value) {
            lastStatus[key] = value
            let elem = iframe.getElementById(key+'_value');
            console.log("updateValueElem Range", value)
            if (elem) {
                if (elem.innerHTML !== value) {
                    elem.innerHTML = value;
                }
            }
        }

}

function updateColorElem(key, value, iframe) {
    let valueElem = iframe.getElementById(key+'_value');
    if (valueElem) {
        valueElem.style.backgroundColor = value;
    }
}

function windowResized(iframe, width, height) {
    if (width > height) {
        iframe.body.style.fontSize = height*0.008+'pt';
    } else {
        iframe.body.style.fontSize = width*0.008+'pt';
    }
}

class HtmlElement {
    constructor() {
        let closed = false;
        this.id = "";
        this.container = null;
        this.iframe = null;
        this.statusMap = null;
        this.editStatus = null;
        this.onCloseCallbacks = [];
        let width = null;
        let height = null;
        let iframeDocument = null;

        let lastStatus = {};

        let baseTransform = defaultBaseTransform;
            let outTransform = "rotate3d(1, 0, 0, 1.0rad) translate3d(0, 400em, 0) scale3d(0, 0, 0)";

        let update = function() {

            closed = false;
            if (!iframeDocument) {
                return;
            }

            if (width !== innerWidth || height !== innerHeight) {
                width = innerWidth;
                height = innerHeight;
                windowResized(iframeDocument, width, height)
                this.container.style.fontSize = rootFontSize();
            }

            let statusMap = this.statusMap;



            for (let key in statusMap) {
                let elem = iframeDocument.getElementById(key);
                if (elem) {

                    if (elem.type === 'text') {
                        statusMap[key] = elem.value;
                        updateValueElem(key, elem.value, iframeDocument, lastStatus)


                    } else if (elem.type === 'range') {
                        if (typeof (statusMap[key]) === 'number') {
                            statusMap[key] = parseFloat(elem.value);
                        } else {
                            statusMap[key] = elem.value;
                        }

                        updateValueElem(key, elem.value, iframeDocument, lastStatus)
                    } else if (elem.type === 'color') {
                        updateColorElem(key, ThreeAPI.toRgb(statusMap[key][0], statusMap[key][1], statusMap[key][2]), iframeDocument)
                        MATH.hexToRGB(elem.value, statusMap[key], colorScale)
                    } else {

                        let list = elem.getAttribute('list')
                        if (list) {
                            updateValueElem(key, elem.value, iframeDocument, lastStatus)
                            statusMap[key] = elem.value;
                            return;
                            return;
                        }
                        let name = elem.getAttribute('name')
                        if (name) {
                            updateValueElem(key, elem.value, iframeDocument, lastStatus)
                            statusMap[key] = elem.value;
                            return;
                        }

                        let value = statusMap[key]
                        let innerHtml = value;
                        if (typeof (value) === 'object') {
                            innerHtml = "";
                            if (typeof (value.length) === 'number') {

                                for (let i = 0; i < value.length; i++) {
                                    let data = value[i];
                                    if (typeof (data) === 'number') {
                                        innerHtml += ': '+data
                                    } else if (typeof (data) === 'string') {
                                        if (i === 0) {
                                            innerHtml += data
                                        } else {
                                            innerHtml += '<br>'+data
                                        }

                                    } else {
                                        innerHtml += data+'<br>';
                                    }

                                }
                            } else {
                                for (let key in value) {
                                    innerHtml += key+': '+value[i]+'<br>'
                                }
                            }
                        }
                        if (elem.innerHTML !== innerHtml) {
                            elem.innerHTML = innerHtml;
                        }
                    }
                }
            }

        }.bind(this);

        let setIframe = function(iDoc) {
            width = null;
            height = null;
            iframeDocument = iDoc;
        }

        let getIframe = function() {
            return iframeDocument;
        }

        let getRootElement = function() {
            return getElementById(this.id)
        }.bind(this);

        let getChildElement = function(id) {
            if (iframeDocument) {
                return iframeDocument.getElementById(id);
            }

        }

        let createElement = function(tagName) {
            if (iframeDocument) {
                return iframeDocument.createElement(tagName);
            }
        }

        let populateSelectList = function(id, list) {
            let selectElem = getChildElement(id);
            removeElementChildren(selectElem);
            list.forEach(function(item){
                let option = createElement('option');
                option.value = item;
                option.innerHTML = item || "--Select--";
                selectElem.appendChild(option);
            });
        }

        let close = function() {
            if (closed === false) {
                for (let key in lastStatus) {
                    lastStatus[key] = null;
                }
                closed = true;
                this.hideHtmlElement();
                while (this.onCloseCallbacks.length) {
                    this.onCloseCallbacks.pop()(this);
                }
            }
        }.bind(this)

        let setBaseTransform = function(trf) {
            if (this.container.style.transform !== trf) {
                baseTransform = trf;
                this.container.style.transform = baseTransform;
            }
        }.bind(this)

        function getBaseTRansform() {
            return baseTransform;
        }

        function getOutTransform() {
            return outTransform;
        }

        function applyTransformSettings(settingKeyX, settingKeyY, settingKeyScale) {
            let offsetX = getSetting(settingKeyX)*10;
            let offsetY = getSetting(settingKeyY)*10;
            let offsetScale = 1 + getSetting(settingKeyScale) / 100

            let trf = buildCssTransform(offsetX, offsetY, 0, 0, offsetScale, 'em')

            setBaseTransform(trf);
        }

        this.call = {
            getChildElement:getChildElement,
            createElement:createElement,
            getOutTransform:getOutTransform,
            getBaseTRansform:getBaseTRansform,
            setBaseTransform:setBaseTransform,
            setIframe:setIframe,
            getIframe:getIframe,
            populateSelectList:populateSelectList,
            getRootElement:getRootElement,
            update:update,
            applyTransformSettings:applyTransformSettings,
            close:close
        }

    }

    initStatusMap(statusMap) {
        this.statusMap = statusMap;
        this.editStatus = {};
        for (let key in statusMap) {
            this.editStatus[key] = statusMap[key];
        }
    }

    initHtmlElement(url, onCloseCB, statusMap, styleClass, readyCb) {
        let containerClass = styleClass || 'full_screen'

        MATH.emptyArray(this.onCloseCallbacks);

        if (this.container !== null) {
            this.closeHtmlElement();
        }


        this.statusMap = statusMap;
        this.editStatus = {};
        for (let key in statusMap) {
            this.editStatus[key] = statusMap[key];
        }
        index++;
        this.id = url+"_"+index;
        let file = "client/html/"+url+".html";

        this.iframe = null;

        let onLoad = function() {

            //    container.style.rotate = "360deg";

            this.showHtmlElement()

            let iframeDocument = this.container.contentDocument || this.container.contentWindow.document;

            this.container.style.transform = this.call.getOutTransform()

            setTimeout(function() {
                iframeDocument.addEventListener('keydown', function(event) {
                    updateKeyState(event.key, true, event);
                });

                iframeDocument.addEventListener('keyup', function(event) {
                    updateKeyState(event.key, false, event);
                });
            }, 100)

        //    this.container.style.scale = 0;
            this.call.setIframe(iframeDocument);
            let closeAnchor = iframeDocument.getElementById('anchor_close');
            if (!closeAnchor) {
                closeAnchor = iframeDocument.getElementById('container');
            }

            if (typeof (onCloseCB) === 'function') {
                let closeButton = createDivElement(closeAnchor, this.id+'_close', "", "button_close")
                closeButton.style.pointerEvents = "auto";
                closeButton.style.cursor = "pointer";
                addClickFunction(closeButton, onCloseClick)
                this.onCloseCallbacks.push(onCloseCB);
            }

            let backdrop = iframeDocument.getElementById('backdrop')
            if (backdrop) {
                addClickFunction(backdrop, onCloseClick)
            }


        //    console.log("Iframe Loaded", file, this);
            for (let key in statusMap) {
                let elem = iframeDocument.getElementById(key);
                if (elem) {
                    if (elem.type === 'range') {
                        elem.value = statusMap[key];

                        updateValueElem(key, elem.value, iframeDocument, statusMap)
                    }
                    if (elem.type === 'color') {
                        elem.value = MATH.rgbToHex(statusMap[key][0]/colorScale, statusMap[key][1]/colorScale,statusMap[key][2]/colorScale);
                        updateColorElem(key, elem.value, iframeDocument)
                    }
                    let list = elem.getAttribute('list')

                    if (list) {
                        console.log(elem, list)
                    }
                }
            }

            if (typeof (readyCb) === 'function') {
                readyCb(this);
            }

            if (activeRootElements.indexOf(this.container) === -1) {
                activeRootElements.push(this.container)
            } else {
                console.log("This should not happen, check", activeRootElements, this.container);
            }


            ThreeAPI.addPrerenderCallback(this.call.update);

        }.bind(this)

        let onCloseClick = function(e) {
        //    console.log("Close Clicked", e, this);
            this.call.close()

        }.bind(this);

        this.container = createIframeElement(document.body, this.id, file, containerClass, onLoad)
        this.container.style.display = "none";
        this.container.style.visibility = "hidden";
        this.container.style.opacity = 0;
        let rebuild = function() {

            if (this.container) {
                removeElement(this.container);
                this.container = createIframeElement(document.body, this.id, file, containerClass, onLoad)
            } else {
                if (reload) {
                    clearInterval(reload);
                }
            }

        }.bind(this);

   //     let reload = setInterval(rebuild, 2000)



        return rebuild;

    }

    showHtmlElement(t) {
        let container = this.container;
        if (container.showing === true) {
            return;
        }
        container.showing = true
        let time = t || 0.2
        let baseTransform = this.call.getBaseTRansform()
        container.style.transition = "all "+time+"s cubic-bezier(0.1, 0.4, 0.1, 1.2)"
        container.style.transform = baseTransform;
        container.style.display = "";
        setTimeout(function() {
            container.style.visibility = "visible";
            container.style.opacity = 1;
            container.style.scale = 1;
            container.style.transform = baseTransform;
        }, 1)
    }

    hideHtmlElement(t) {
        if (this.container !== null) {
            let time = t || 1.0
            let container = this.container

            if (container.showing === false) {
                return;
            }
            container.showing = false

            container.style.transition = "all "+time+"s cubic-bezier(0.1, 0.4, 0.1, 1.2)"
            container.style.scale = 0;
            container.style.opacity = 0;
            let outTrf = this.call.getOutTransform()
            setTimeout(function() {
                container.style.transform = outTrf;
            },1)

        }
    }

    hideOtherRootElements() {
        for (let i = 0; i < activeRootElements.length; i++) {
            if (activeRootElements[i] !== this.container) {
                activeRootElements[i].style.opacity = 0;
            }
        }
    }

    revealHiddenRootElements() {
        for (let i = 0; i < activeRootElements.length; i++) {
            if (activeRootElements[i] !== this.container) {
                activeRootElements[i].style.opacity = 1;
            }
        }
    }

    closeHtmlElement() {
        this.call.close()
        if (this.container !== null) {
            this.container.showing = null;
            MATH.splice(activeRootElements, this.container);
            removeElement(this.container);
        }
        this.container = null;
        this.statusMap = null;
        this.editStatus = null;
        ThreeAPI.unregisterPrerenderCallback(this.call.update);
    }

}

export {HtmlElement}