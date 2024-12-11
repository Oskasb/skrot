import {poolFetch, poolReturn} from "../../utils/PoolUtils.js";
import {ConfigData} from "../../utils/ConfigData.js";
import {detachConfig} from "../../utils/ConfigUtils.js";
import {DomEditActor} from "./DomEditActor.js";
import {ENUMS} from "../../ENUMS.js";
import {Vector3} from "../../../../libs/three/math/Vector3.js";

let selectedTool = "";
let activeTools = []
let addToolStatusMap = {}

let actorConfigs = null;
let buttonLayer = null;

let actorTool = null;
let tempVec = new Vector3();

function listifyConfig(cfg) {
    let list = [""];
    for (let key in cfg) {
        list.push(key)
    }
    return list;
}


function actorSelectionUpdate(s) {
    if (s !== "") {
        if (typeof (actorConfigs[s]) === 'object') {
            addToolStatusMap.config = detachConfig(actorConfigs[s].data);
            console.log("Select Asset ", s, addToolStatusMap.config)
        } else {
            console.log("Templates for assets not yet ready.. needs a location from configUtil when loaded.")
        }
    }
}

function loadActorTemplate(t) {
    console.log("Load Actor Template", t)
}

function activateActorSelection(selectionId) {

    function activated(a) {

    //    GameAPI.getPlayerParty().addPartyActor(a);
    //    GameAPI.getGamePieceSystem().setSelectedGameActor(a);
    }

    function actorLoaded(actor) {
        console.log(actor.actorStatus.statusMap.EQUIPPED_ITEMS)
        actor.activateGameActor(activated)
    }

    console.log("Activate Actor Selection", selectionId)

    let pos = ThreeAPI.getCameraCursor().getLookAroundPoint()

    evt.dispatch(ENUMS.Event.LOAD_ACTOR, {id: selectionId, pos:pos, callback:actorLoaded});

}


function closeButtonLayer() {
    if (buttonLayer !== null) {
        buttonLayer.closeWorldButtonLayer();
        buttonLayer = null;
    }
}

function operateTool(tool, closeCB) {

    while (activeTools.length) {
        let editTool = activeTools.pop();
        console.log("Close Tool ", editTool, activeTools);
        editTool.closeEditTool();
        poolReturn(editTool);
    }

    closeButtonLayer()

    if (actorTool !== null) {
        actorTool.closeEditTool();
        actorTool = null;
    }

    let activateTool;

    if (tool === "ACTOR") {

        // let actorConfigs = new ConfigData("GAME", "ACTORS").parseConfigData()[actorId].data;

        actorConfigs = new ConfigData("GAME", "ACTORS").parseConfigData();

        addToolStatusMap.selectList = listifyConfig(actorConfigs)

        addToolStatusMap.parent = {};

        addToolStatusMap.root = "game";
        addToolStatusMap.folder = "actors";
        addToolStatusMap.config = null;

        addToolStatusMap.selectionUpdate = actorSelectionUpdate;
        addToolStatusMap.loadTemplate = loadActorTemplate;
        addToolStatusMap.activateSelection = activateActorSelection;

        activateTool = poolFetch('DomEditAdd');
        activateTool.call.setStatusMap(addToolStatusMap);


        function actorSelected(e) {
            console.log("Actor Edit Selection ", e.target.value);
            closeButtonLayer()
            actorTool = poolFetch('DomEditActor');
            actorTool.initEditTool(e.target.value);
        }


        let activeActors = GameAPI.getGamePieceSystem().getActors();

        buttonLayer = poolFetch('DomWorldButtonLayer');
        buttonLayer.initWorldButtonLayer(activeActors, tool, actorSelected)


        //    activateTool = poolFetch('DomEditActor');
    }

    if (tool === "ASSET_") {
        activateTool = poolFetch('DomEditTerrain');
    }

    if (tool === "GEOMETRY_") {
        activateTool = poolFetch('DomEditLocation');
    }

    function toolReady(etool) {
        console.log("Tool Ready", tool, etool)
        activeTools.push(etool)
    }

    if (activateTool) {
        activateTool.initEditTool(closeCB, toolReady);
    }

}

let toolsList = [
    "",
    "ACTOR",
    "ASSET",
    "GEOMETRY"
]

class DomEditAssets {
    constructor() {
        this.statusMap = {
            tool:selectedTool
        };

        let statusMap = this.statusMap;
        let toolSelectDiv = null;

        function toolClosedCB() {
        //    toolSelectDiv.value = "MODELS";
        }

        let applyTool = function() {
            operateTool(statusMap.tool, toolClosedCB);
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


            if (statusMap.tool === 'ACTOR') {
                let activeActors = GameAPI.getGamePieceSystem().getActors();
                let cPos = ThreeAPI.getCameraCursor().getLookAroundPoint();
                tempVec.copy(cPos);
                tempVec.y += 1;
                for (let i = 0; i < activeActors.length; i++) {
                    evt.dispatch(ENUMS.Event.DEBUG_DRAW_LINE, {from:activeActors[i].getPos(), to:tempVec, color:'GREEN'});
                }
            }


        }

        let close = function() {
            ThreeAPI.unregisterPrerenderCallback(this.call.update);
            this.htmlElement.closeHtmlElement();
            poolReturn(this.htmlElement);
            this.htmlElement = null;
            closeButtonLayer()

        }.bind(this);

        this.call = {
            htmlReady:htmlReady,
            update:update,
            close:close
        }

    }

    initDomEditAssets() {
        this.htmlElement = poolFetch('HtmlElement')
        this.htmlElement.initHtmlElement('edit_assets', this.call.close, this.statusMap, 'edit_frame edit_assets', this.call.htmlReady);
    }


}

export { DomEditAssets }