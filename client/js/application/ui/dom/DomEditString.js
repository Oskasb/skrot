import {poolFetch, poolReturn} from "../../utils/PoolUtils.js";
import {detachConfig, saveConfigEdits, saveEncounterEdits} from "../../utils/ConfigUtils.js";
import {Object3D} from "../../../../libs/three/core/Object3D.js";

let select = []

class DomEditString {
    constructor() {

        let statusMap = null
        let rootElem = null;
        let htmlElem;
        let saveContainerDiv = null;
        let statusOutputDiv = null;
        let saveButtonDiv = null;
        let saveAsButtonDiv = null;
        let loadButtonDiv = null;

        let selectionId = "";
        let cursorObj3d = new Object3D();

        let createCursor = null
        let configEdit = null;

        let inputElem = null;
        let closeCursorCB = function() {

        }

        let closeCursor = function() {
            if (createCursor !== null) {
                createCursor.closeDomEditCursor();
                poolReturn(createCursor);
                createCursor = null;
            }
        }

        function updateSelectList() {

        }

        function applySave() {
            if (statusMap.out === statusMap.in) {
                console.log("Request save string", statusMap.in)
                statusMap.onSubmit(statusMap.in, statusMap);
            }
        }

        let loadConfig = null;

        function selectionUpdate(selectionId) {
            if (selectionId !== "") {
                let loadedTemplates = GameAPI.worldModels.getLoadedTemplates();
                let map = loadedTemplates[selectionId];
                loadConfig = detachConfig(map.config);
                loadConfig.edit_id = "";
                loadConfig.pos = statusMap.config.pos;
                loadConfig.rot = statusMap.config.rot;

            } else {
                loadConfig = null;
            }
        }

        let htmlReady = function(htmlEl) {
            htmlElem = htmlEl;
            MATH.emptyArray(select);
            select.push("");
            statusMap = htmlElem.statusMap;
            updateSelectList()

            rootElem = htmlEl.call.getRootElement();

            statusOutputDiv = htmlElem.call.getChildElement('output_status');

            for (let key in statusMap) {
                let elem = htmlElem.call.getChildElement(key);
                if (elem) {
                    elem.innerHTML = statusMap[key];
                }
            }

            inputElem = htmlElem.call.getChildElement('string');
            saveButtonDiv = htmlElem.call.getChildElement('save_button');
            DomUtils.addClickFunction(saveButtonDiv, applySave)
            saveContainerDiv = htmlElem.call.getChildElement('save_container');
            ThreeAPI.registerPrerenderCallback(update);

        }.bind(this);

        let indicateStringStatus = function() {

            if (statusMap.status === 'processing') {
            //    console.log("String not accepted", statusMap.in)
                saveContainerDiv.style.opacity = "0.5"
                DomUtils.addElementClass(statusOutputDiv, 'status_processing')
                DomUtils.removeElementClass(statusOutputDiv, 'status_valid')
                DomUtils.removeElementClass(statusOutputDiv, 'status_invalid')
            } else {
                DomUtils.removeElementClass(statusOutputDiv, 'status_processing')
            }

            if (statusMap.in === "") {
                statusMap.status = "NoValue";
                DomUtils.addElementClass(statusOutputDiv, 'status_invalid')
                DomUtils.removeElementClass(statusOutputDiv, 'status_valid')
                return;
            }

            if (statusMap.out !== statusMap.in) {
                console.log("String not accepted", statusMap.in)
                saveContainerDiv.style.opacity = "0.5"
                DomUtils.removeElementClass(statusOutputDiv, 'status_valid')
            } else {
                DomUtils.removeElementClass(statusOutputDiv, 'status_invalid')
                DomUtils.addElementClass(statusOutputDiv, 'status_valid')
                saveContainerDiv.style.opacity = ""
            }

        };

        let requestedString = "";

        function requestStringValidation() {
            if (requestedString !== statusMap.in) {
                requestedString = statusMap.in;
                statusMap.status = 'processing'
                statusMap.onUpdate(statusMap.in, validationResultCallback)
            }
        }

        function validationResultCallback(string, statusText, accepted) {
            statusMap.out = string;
            statusMap.status = statusText;
        }

        let update = function() {

            statusMap.in = inputElem.value;

            if (statusMap.out !== statusMap.in) {
                requestStringValidation();
            }
            indicateStringStatus()

            if (htmlElem.container.style.transform !== "") {
                htmlElem.container.style.transform = "";
            }

        };

        let close = function() {

        }

        this.call = {
            htmlReady:htmlReady,
            update:update,
            close:close
        }
    }

    initEditTool(closeCb, statusMap, onReady) {

        let readyCb = function() {
            this.call.htmlReady(this.htmlElement)
            if (typeof (onReady) === 'function') {
                onReady(this);
            }
        }.bind(this)
        this.htmlElement = poolFetch('HtmlElement')
        this.htmlElement.initHtmlElement('edit_string', closeCb, statusMap, 'edit_frame edit_string', readyCb);
    }

    closeEditTool() {
        this.encounter = null;
        this.call.close();
        ThreeAPI.unregisterPrerenderCallback(this.call.update);
        this.htmlElement.closeHtmlElement();
        poolReturn(this.htmlElement);
        this.htmlElement = null;
    }

}

export { DomEditString }