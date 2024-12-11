import {poolFetch, poolReturn} from "../../utils/PoolUtils.js";
import {detachConfig, generateEditId, saveEncounterEdits, saveWorldModelEdits} from "../../utils/ConfigUtils.js";
import {getEditIndex} from "../../../../../Server/game/utils/EditorFunctions.js";
import {WorldModel} from "../../../game/gameworld/WorldModel.js";


class DomEditAdd {
    constructor() {

        let statusMap = null
        let rootElem = null;
        let htmlElem;
        let applyContainerDiv = null;
        let selectList = null;
        let addButtonDiv = null;
        let selectionId = "";

        function applyAdd() {

            if (addButtonDiv.innerHTML === 'TEMPLATE') {
                templateEdit = poolFetch('DomEditTemplate')

                let map = {
                    id:generateEditId(),
                    parent:statusMap.parent,
                    config:statusMap.config,
                    root:statusMap.root,
                    folder:statusMap.folder,
                    onSelect:statusMap.selectionUpdate,
                    onLoad:statusMap.loadTemplate
                }

                let closeTmpl = function() {
                    poolReturn(templateEdit);
                }

                templateEdit.initEditTool(closeTmpl, map)

            } else {
                statusMap.activateSelection(selectionId);
            }

        }

        let htmlReady = function(htmlEl) {
            htmlElem = htmlEl;
            rootElem = htmlEl.call.getRootElement();

            selectList = htmlElem.call.getChildElement('select_list');

            applyContainerDiv = htmlElem.call.getChildElement('apply_container');

            console.log("populateSelectList", statusMap)

            if (statusMap.selectList[0] !== "") {
                statusMap.selectList.unshift("");
            }

            htmlElem.call.populateSelectList('select_list', statusMap.selectList)
            addButtonDiv = htmlElem.call.getChildElement('add_button');
            DomUtils.addClickFunction(addButtonDiv, applyAdd)
            ThreeAPI.registerPrerenderCallback(update);
            applySelection(selectionId)
        }.bind(this);


        let templateEdit = null;
        let applySelection = function(id) {
            selectionId = id;
            if (id === "") {

            //    applyContainerDiv.style.display = "none"
                addButtonDiv.innerHTML = 'TEMPLATE';
            } else {
                if (templateEdit !== null) {
                    templateEdit.closeEditTool();
                    templateEdit = null;
                }
            //    applyContainerDiv.style.display = ""
                addButtonDiv.innerHTML = 'ADD';
            }
            statusMap.selectionUpdate(selectionId);
        };

        let update = function() {
            if (selectionId !== selectList.value) {
                applySelection(selectList.value);
            }
        };

        let close = function() {

        }

        function setStatusMap(sMap) {
            statusMap = sMap;
        }

        function getStatusMap() {
            return statusMap;
        }

        this.call = {
            setStatusMap:setStatusMap,
            getStatusMap:getStatusMap,
            htmlReady:htmlReady,
            update:update,
            close:close
        }
    }

    initEditTool(closeCb, onReady) {

        let readyCb = function() {
            this.call.htmlReady(this.htmlElement)
            if (typeof (onReady) === 'function') {
                onReady(this);
            }
        }.bind(this)
        this.htmlElement = poolFetch('HtmlElement')
        this.htmlElement.initHtmlElement('edit_add', closeCb, null, 'edit_frame edit_add', readyCb);
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

export { DomEditAdd }