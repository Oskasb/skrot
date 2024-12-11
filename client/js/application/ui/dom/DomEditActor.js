import {poolFetch, poolReturn} from "../../utils/PoolUtils.js";
import {configDataList, detachConfig} from "../../utils/ConfigUtils.js";
import {ENUMS} from "../../ENUMS.js";
import {Vector3} from "../../../../libs/three/math/Vector3.js";

let selectedTool = "MODELS";
let activeTools = []
let statsConfig = null;

let tempVec = new Vector3();

let toolsList = [
    "", "EQUIPMENT", "STATS", "ANIMATIONS", "CONFIG"
]


function loadConfigTemplate(statMap) {
    console.log("loadConfigTemplate", selectedTemplateId, statMap)

    let loadedTemplates = GameAPI.worldModels.getLoadedTemplates();
    //    console.log("loadTemplate Selected Template ", selectedTemplateId)
    let map = loadedTemplates[selectedTemplateId];
    let config = detachConfig(map.config);
    MATH.vec3ToArray(statMap.parent.getPos(), config.pos);
    statMap.parent.call.applyConfig(config)

}

function selectionUpdate(sel) {
    console.log("Edit Actor Selection ", sel);
}

function operateTool(statusMap, closeCB) {

    let tool = statusMap.tool

    while (activeTools.length) {
        let editTool = activeTools.pop();
        console.log("Close Tool ", editTool, activeTools);
        editTool.closeEditTool();
        poolReturn(editTool);
    }

    let activateTool;

    function toolReady(etool) {
        console.log("Tool Ready", tool, etool)
        activeTools.push(etool)
    }

    if (tool === "CONFIG") {
        ThreeAPI.getCameraCursor().getLookAroundPoint().copy(statusMap.parent.getPos())
        let cfgEdit = poolFetch('DomEditConfig');

        let map = {
            id:statusMap.config.edit_id,
            root:"game",
            folder:"actors",
            parent:statusMap.parent,
            config:statusMap.config,
            selectionUpdate:selectionUpdate,
            loadTemplate:loadConfigTemplate,
            selections:["", "TEMPLATE"]
        }
        cfgEdit.initEditTool(closeCB, map, toolReady);
    }


    if (tool === "EQUIPMENT") {
        ThreeAPI.getCameraCursor().getLookAroundPoint().copy(statusMap.parent.getPos())
        let cfgEdit = poolFetch('DomEditEquipment');

        let statsId = statusMap.config['stats_id']
        let config = statsConfig[statsId];

        let map = {
            id:statusMap.config.edit_id,
            root:"game",
            folder:"actors",
            parent:statusMap.parent,
            config:detachConfig(config),
            selectionUpdate:selectionUpdate,
            loadTemplate:loadConfigTemplate,
            selections:["", "TEMPLATE"]
        }
        cfgEdit.initEditTool(closeCB, map);
    }


    if (tool === "ANIMATIONS") {
        ThreeAPI.getCameraCursor().getLookAroundPoint().copy(statusMap.parent.getPos())
        let cfgEdit = poolFetch('DomEditEquipment');

        let statsId = statusMap.config['stats_id']
        let config = statsConfig[statsId];

        let map = {
            id:statusMap.config.edit_id,
            root:"game",
            folder:"actors",
            parent:statusMap.parent,
            config:detachConfig(config),
            selectionUpdate:selectionUpdate,
            loadTemplate:loadConfigTemplate,
            selections:["", "TEMPLATE"]
        }
        cfgEdit.initEditTool(closeCB, map);
    }

    if (activateTool) {
        activateTool.initEditTool(closeCB, toolReady);
    }

}



class DomEditActor {
    constructor() {
        this.statusMap = {
            root:'game',
            folder:'actors',
            tool:selectedTool
        };

        let statusMap = this.statusMap;
        let toolSelectDiv = null;



        let statsData = function(data) {
            statsConfig = data;
            console.log("statsConfig", statsConfig)
        }

        configDataList("GAME","CHARACTER_STATS", statsData)

        function toolClosedCB() {
        //    toolSelectDiv.value = "MODELS";
        }

        let applyTool = function() {
            operateTool(statusMap, toolClosedCB);
        }

        let htmlReady = function(htmlElem) {

            toolSelectDiv = htmlElem.call.getChildElement('tool');
            htmlElem.call.populateSelectList('tool', toolsList)
            ThreeAPI.registerPrerenderCallback(update);
            selectedTool = "";
        }

        let update = function() {
            if (toolSelectDiv.value !== selectedTool) {
                statusMap.tool = toolSelectDiv.value
                selectedTool = statusMap.tool;
                applyTool()
            }



        }

        let close = function() {
            ThreeAPI.unregisterPrerenderCallback(this.call.update);
            this.htmlElement.closeHtmlElement();
            poolReturn(this.htmlElement);
            this.htmlElement = null;
            poolReturn(this)
        }.bind(this);

        this.call = {
            htmlReady:htmlReady,
            update:update,
            close:close
        }

    }

    initEditTool(actor) {
        this.statusMap.parent = actor;
        this.statusMap.config = detachConfig(actor.config);
        this.htmlElement = poolFetch('HtmlElement')
        this.htmlElement.initHtmlElement('edit_actor', this.call.close, this.statusMap, 'edit_frame edit_actor', this.call.htmlReady);
    }


    closeEditTool() {
        this.call.close();
    }

}

export { DomEditActor }