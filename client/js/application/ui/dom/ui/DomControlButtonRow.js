import {poolFetch} from "../../../utils/PoolUtils.js";
import {
    addElementClass, createDivElement, removeElementClass
} from "../DomUtils.js";
import {InputDragPointer} from "../pointer/InputDragPointer.js";
import {selectCalls} from "../../../../game/player/Selections.js";

class DomControlButtonRow {
    constructor() {

        let htmlElement;
        let _this = this;
        let statusMap;

        let currentSelection = null;

        function update() {


            for (let i =0; i < statusMap['selections'].length; i++) {
                let selection = statusMap['selections'][i];
                let select = selection['select'];
                if (typeof (selection['select']) !== 'string') {
                    select = select['point'];
                }


                let inputDragPointer =  statusMap[select].pointer
                inputDragPointer.call.updateKeyState();
                let surface = statusMap[select].surface
                let inputElement = statusMap[select].inputElement

                let isActive = statusMap[select].active;
                let pressActive = inputDragPointer.call.getActive();

                if (pressActive !== isActive) {
                    if (pressActive) {
                        console.log("DomControlButtonRow", statusMap);
                        addElementClass(inputElement, 'button_input_pressed');
                        currentSelection = select;
                        statusMap[select].active = pressActive;
                        selectCalls[selection.call](selection['select']);
                    }
                }

                if (isActive && currentSelection !== select) {
                    statusMap[select].active = false;
                    inputDragPointer.call.setActive(false);
                    removeElementClass(inputElement, 'button_input_pressed');
                }

            }

        }

        function setupListeners() {
            const container = htmlElement.call.getChildElement('row_container')

            console.log("statusMap", statusMap);

            for (let i =0; i < statusMap['selections'].length; i++) {
                let selection = statusMap['selections'][i];
                let label = selection['label'] || "Label";
                let select = selection['select'];
                if (typeof (selection['select']) !== 'string') {
                    select = select['point'];
                }
                let surface = createDivElement(container, "surface_"+i, null, 'row_button_surface')
                let inputElement =createDivElement(surface, "btn_"+i, label, 'button_input_feedback')
                let opts = [
                    {axis:"PRESS", min:0, max:1, origin: 0, margin:0.5},
                ]
                let inputDragPointer = new InputDragPointer()
                inputDragPointer.call.activatePressSurface(surface, inputElement, statusMap, opts)
                statusMap[select] = {
                    active:false,
                    pointer:inputDragPointer,
                    surface:surface,
                    inputElement:inputElement
                }
                if (selection.init) {
                    inputDragPointer.call.setActive(selection.init)
                }
            }


        }

        function initElement(sMap, url, styleClass, onReady) {
            statusMap = sMap;
            function elemReady(htmlEl) {
                htmlElement = htmlEl;
                setupListeners()
                onReady(_this)
            }

            let element = poolFetch('HtmlElement');
            element.initHtmlElement(url, null, statusMap, styleClass, elemReady);
        }

        function closeElement() {
            htmlElement.closeHtmlElement()
            ThreeAPI.unregisterPrerenderCallback(update);
        }

        this.call = {
            update:update,
            initElement:initElement,
            closeElement:closeElement
        }
    }
}

export { DomControlButtonRow }