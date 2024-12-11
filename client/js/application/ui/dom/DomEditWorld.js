import {poolFetch, poolReturn} from "../../utils/PoolUtils.js";
import {Vector3} from "../../../../libs/three/math/Vector3.js";
import {notifyCameraStatus} from "../../../3d/camera/CameraFunctions.js";
import {GuiAxisSlider} from "../gui/widgets/GuiAxisSlider.js";
import {GuiAxisFeedback} from "../gui/widgets/GuiAxisFeedback.js";
import {ENUMS} from "../../ENUMS.js";
import {detachConfig} from "../../utils/ConfigUtils.js";
import {DomEditAssets} from "./DomEditAssets.js";

let classNames = {
    'GuiAxisSlider':GuiAxisSlider,
    'GuiAxisFeedback':GuiAxisFeedback
}



let selectedTool = "MODELS";
let activeTools = []
let inputSamplers = [];
let inputWidgets = [];

let controlValues = {
    CAM_TURN:0,
    CAM_PITCH:0,
    CAM_FORWARD:0,
    CAM_DISTANCE:0,
    CONTROL_FORWARD:0,
    CONTROL_STRAFE:0,
};

function attachInputSampler(controlKeys, inputSamplers) {

    for (let i = 0; i < controlKeys.length; i++) {
        let controlKey = controlKeys[i];
        if (typeof (controlKey) === 'string') {
            if (inputSamplers.indexOf(controlKey) === -1) {
                inputSamplers.push(controlKey);
            }
        }
    }
}

function attachInputWidget(inputConfig) {

    let widgets = inputWidgets;
    let controls = inputConfig['controls'] || [];
    let on_active = inputConfig['on_active'] || [];

    attachInputSampler(controls, inputSamplers)
    attachInputSampler(on_active, inputSamplers)

    let onUpdate = function(values) {
        for (let i = 0; i < values.length; i++) {
            if (controls[i]) {
                controlValues[controls[i]] = values[i];
            }
        }
        GameAPI.getPlayer().setStatusKey(ENUMS.PlayerStatus.CONTROL_VALUES, controlValues);
    }

    let onActivate = function(bool) {
        for (let i = 0; i < on_active.length; i++) {
            controlValues[on_active[i]] = bool;
        }
    }

    let widgetReadyCB = function(inputWidget) {
        //    console.log("WidgetReady:", inputWidget);
        //    inputWidget.guiWidget.applyWidgetOptions(inputConfig['options'])
        inputWidget.addInputUpdateCallback(onUpdate)
        inputWidget.addOnActivateCallback(onActivate)
        widgets.push(inputWidget)
    }

    let widget = new classNames[inputConfig['class_name']](inputConfig['options'])
    widget.initGuiWidget(inputConfig['widget_config'], widgetReadyCB)
}

let inputConfigs = [
    {"class_name": "GuiAxisSlider",
        "widget_config": "widget_thumbstick",
        "controls":["CONTROL_STRAFE","CONTROL_FORWARD"],
        "options":{
            "anchor": "stick_bottom_right",
            "icon": "directional_arrows",
            "axis": [1, 1],
            "axis_keys": [["a", "d"],["w", "s"]],
            "release": [1, 1],
            "range": [0.08, 0.08]
        }
    },
    {"class_name": "GuiAxisSlider",
        "widget_config": "widget_thumbstick_small",
        "controls":[null,"CAM_FORWARD"],
        "options":{
            "anchor": "stick_more_bottom_right",
            "icon": "vertical_arrows",
            "axis": [0, 1],
            "axis_keys": [[],["r", "f"]],
            "release": [1, 1],
            "range": [0.05, 0.05]
        }
    }
]

function operateTool(tool, closeCB) {

    while (activeTools.length) {
        let editTool = activeTools.pop();
        console.log("Close Tool ", editTool, activeTools);
        editTool.closeEditTool();
        poolReturn(editTool);
    }

    let activateTool;

    if (tool === "MODELS" || tool === "--select--" || tool === "") {
        activateTool = poolFetch('DomEditModel');
    }

    if (tool === "ENVIRNMNT") {
        activateTool = poolFetch('DomEnvEdit');
        activateTool.setStatusMap(ThreeAPI.getEnvironment().getStatusMap())
    }

    if (tool === "TERRAIN") {
        activateTool = poolFetch('DomEditTerrain');
    }

    if (tool === "LOCATION") {
        activateTool = poolFetch('DomEditLocation');
    }

    if (tool === "ENCOUNTER") {
        activateTool = poolFetch('DomEditEncounter');
    }

    if (tool === "ADVENTURE") {
        activateTool = poolFetch('DomEditAdventure');
    }

    function toolReady(etool) {
        console.log("Tool Ready", tool, etool)
        activeTools.push(etool)
    }

    activateTool.initEditTool(closeCB, toolReady);

}

let toolsList = [
    "MODELS",
    "ENVIRNMNT",
    "TERRAIN",
    "LOCATION",
    "ENCOUNTER",
    "ADVENTURE"
]

class DomEditWorld {
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

            let locationsData = GameAPI.worldModels.getActiveLocationData();
            let worldModels = GameAPI.worldModels.getActiveWorldModels();
            toolSelectDiv = htmlElem.call.getChildElement('tool');
            htmlElem.call.populateSelectList('tool', toolsList)
            console.log([worldModels, locationsData]);
            ThreeAPI.registerPrerenderCallback(update);

            let selectedActor = GameAPI.getGamePieceSystem().selectedActor;
            if (selectedActor) {
                selectedActor.setStatusKey(ENUMS.ActorStatus.TRAVEL_MODE, ENUMS.TravelMode.TRAVEL_MODE_INACTIVE)
            }
            selectedTool = "";

            let assetEditor = new DomEditAssets();
            assetEditor.initDomEditAssets()

        }

        let update = function() {
            if (toolSelectDiv.value !== selectedTool) {
                statusMap.tool = toolSelectDiv.value
                selectedTool = statusMap.tool;
                applyTool()
            }
        }

        let close = function() {

            let selectedActor = GameAPI.getGamePieceSystem().selectedActor;
            if (selectedActor) {
                selectedActor.setStatusKey(ENUMS.ActorStatus.TRAVEL_MODE, ENUMS.TravelMode.TRAVEL_MODE_WALK)
            }

        }

        this.call = {
            htmlReady:htmlReady,
            update:update,
            close:close
        }

    }

    initDomEditWorld(closeCb) {

        for (let i = 0; i < inputConfigs.length; i++) {
            attachInputWidget(inputConfigs[i]);
        }

        notifyCameraStatus( ENUMS.CameraStatus.CAMERA_MODE, ENUMS.CameraControls.CAM_EDIT, null)
        this.htmlElement = poolFetch('HtmlElement')
        this.htmlElement.initHtmlElement('edit_world', closeCb, this.statusMap, 'edit_frame', this.call.htmlReady);
    }

    closeDomEditWorld() {

        while (inputWidgets.length) {
            inputWidgets.pop().removeGuiWidget();
        }

        this.call.close();
        ThreeAPI.unregisterPrerenderCallback(this.call.update);
        this.htmlElement.closeHtmlElement();
        poolReturn(this.htmlElement);
        this.htmlElement = null;
    }

}

export { DomEditWorld }