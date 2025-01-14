import {ENUMS} from "../../ENUMS.js";
import {Vector3} from "../../../../../libs/three/math/Vector3.js";
import {poolReturn} from "../../utils/PoolUtils.js";
import {isDev} from "../../utils/DebugUtils.js";
import {MATH} from "../../MATH.js";
import {addClickFunction, createIframeElement, removeDivElement, rootFontSize} from "./DomUtils.js";

let tempVec = new Vector3();
let frustumFactor = 0.828;

class DomWorldButtonLayer {
    constructor() {

        let visibleElements = [];
        let worldElements = null;
        let buttonDivs = [];
        let label = "init";
        let onClick = null;

        function init(wElements, lbl, clickFunc) {
            label = lbl;
            onClick = clickFunc;
            worldElements = wElements;
            MATH.emptyArray(visibleElements);
            ThreeAPI.registerPrerenderCallback(update)
        }

        function buttonIframeLoaded(iframe) {
            buttonDivs.push(iframe);
            let iframeDocument = iframe.contentDocument || iframe.contentWindow.document;
            let btn = iframeDocument.getElementById('button_spatial');
            btn.innerHTML = label;
            addClickFunction(btn, onClick);

        }

        function update() {

            MATH.emptyArray(visibleElements);

                let camCursorDist = MATH.distanceBetween(ThreeAPI.getCameraCursor().getPos(), ThreeAPI.getCamera().position)

            if (!worldElements) {
                return;
            }

            for (let i = 0; i < worldElements.length; i++) {
                    let pos = worldElements[i].getPos();
                    let distance = MATH.distanceBetween(ThreeAPI.getCameraCursor().getPos(), pos)
                    if (distance < 2500 + camCursorDist * 0.5) {
                        if (ThreeAPI.testPosIsVisible(pos)) {
                            visibleElements.push(worldElements[i]);
                        }
                    }
                }

            let iframes = visibleElements.length;

                if (buttonDivs.length < iframes) {
                    createIframeElement('canvas_window', 'wbl_' + visibleElements.length, "edit_button_spatial.html", 'layer_button', buttonIframeLoaded)
                    iframes++
                }

            while (buttonDivs.length > visibleElements.length) {
                removeDivElement(buttonDivs.pop());
            }

            for (let i = 0; i < visibleElements.length; i++) {
                let worldElement = visibleElements[i];
                let div = buttonDivs[i];
                if (div) {
                    let pos = worldElement.getPos();
                    div.value = worldElement;

                    let iframeDocument = div.contentDocument || div.contentWindow.document;

                    let btn = iframeDocument.getElementById('button_spatial');
                    if (btn) {
                        btn.value = worldElement;
                        if (iframeDocument.body.style.fontSize !== rootFontSize()) {
                            iframeDocument.body.style.fontSize = rootFontSize()
                        }

                        if (typeof (worldElement.getLabel) === 'function') {
                            let lbl = worldElement.getLabel();
                            if (btn.innerHTML !== lbl) {
                                btn.innerHTML = lbl;
                            }
                        }
                    }

                    ThreeAPI.toScreenPosition(pos, tempVec);
                    let posX = tempVec.x*(100/frustumFactor)
                    let posY = -tempVec.y*(100/frustumFactor)
                    div.style.top = 50 + posY*1+"%";
                    div.style.left = 50 + posX*1+"%";

                    if (isDev()) {
                        evt.dispatch(ENUMS.Event.DEBUG_DRAW_LINE, {from:ThreeAPI.getCameraCursor().getPos(), to:pos, color:'YELLOW'});
                        tempVec.x = pos.x;
                        tempVec.z = pos.z;
                        tempVec.y = 0;
                        evt.dispatch(ENUMS.Event.DEBUG_DRAW_LINE, {from:pos, to:tempVec, color:'YELLOW'});
                    }
                }
            }

        }

        let close = function() {
            ThreeAPI.unregisterPrerenderCallback(update)
            while (buttonDivs.length) {
                removeDivElement(buttonDivs.pop());
            }
            poolReturn(this);
        }.bind(this);

        this.call = {
            init:init,
            update:update,
            close:close
        }

    }

    initWorldButtonLayer(elementList, label, onClick) {
        this.call.init(elementList, label, onClick);
    }

    closeWorldButtonLayer() {
        this.call.close();
    }

}

export {DomWorldButtonLayer}