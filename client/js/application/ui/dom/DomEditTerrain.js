import {poolFetch, poolReturn} from "../../utils/PoolUtils.js";
import {Vector3} from "../../../../libs/three/math/Vector3.js";
import {Object3D} from "../../../../libs/three/core/Object3D.js";
import {paletteKeys} from "../../../game/visuals/Colors.js";
import {MATH} from "../../MATH.js";
import {isPressed} from "../input/KeyboardState.js";


let tempVec = new Vector3();
let frustumFactor = 0.828;


let tools = [
    "FLATTEN",
    "ADD",
    "SUBTRACT",
    "GROUND"
]

let editEvent = {};

function operateEdit(tool, pos, statusMap, drawStrength) {
    editEvent.operation = tool;
    editEvent.pos = pos;
    editEvent.radius = parseFloat(statusMap.radius);
    editEvent.sharpness = parseFloat(statusMap.sharpness);
    editEvent.noise = parseFloat(statusMap.noise);
    editEvent.strength = parseFloat(statusMap.strength) * drawStrength;
    editEvent.biome = statusMap.biome;

    console.log("Operate Terrain Edit ", editEvent)
    evt.dispatch(ENUMS.Event.TERRAIN_APPLY_EDIT, editEvent);
}

class DomEditTerrain {
    constructor() {

        let targetObj3d = new Object3D();
        this.updateObj3d = new Object3D();

        this.statusMap = {
            radius:5,
            sharpness:0.5,
            strength:25,
            noise:0,
            biome:[0, 0, 0],
            draw: 0
        };

        let visualEdgeCircle = null;

        let statusMap = this.statusMap;

        let rootElem = null;

        let htmlElem;
        let applyOperationDiv = null;
        let selectedTool = "FLATTEN";
        let toolSelect = null;
        let sampleBackdropDiv = null;
        let sampleButtonDiv = null;
        let biomeSelect = null;
        let sliderNoiseDiv = null;
        let sliderDrawDiv = null;

        let colorPanelDiv = null;

        let updateSelectedTool = function() {
            if (selectedTool === "GROUND") {
                colorPanelDiv.style.display = "none";
            }

            selectedTool = toolSelect.value

            if (selectedTool === "GROUND") {
                colorPanelDiv.style.display = "block";
            }
            applyOperationDiv.innerHTML = selectedTool;
        }

        let applyOperation = function(e) {
            console.log("Apply", selectedTool);
            operateEdit(selectedTool, targetObj3d.position, statusMap, 1)
        }

        let applyRebuild = function(e) {
            ThreeAPI.getTerrainSystem().rebuildTerrainData();
        }

        function applyDrawFromTo(from, to, pixelDistance) {

            for (let i = 0; i < pixelDistance; i++) {
                let fraction = MATH.calcFraction(0, pixelDistance, i);
                tempVec.copy(to).sub(from);
                tempVec.normalize();
                tempVec.multiplyScalar(pixelDistance*fraction)
                tempVec.add(from);
                operateEdit(selectedTool, tempVec, statusMap, statusMap.draw)
            }



        }

        function applySampledGround() {
            let hex = MATH.rgbToHex(groundData[0], groundData[1], groundData[2])
            biomeSelect.value = hex;
        }



        let htmlReady = function(htmlEl) {
            htmlElem = htmlEl;
            rootElem = htmlEl.call.getRootElement();
            htmlElem.call.populateSelectList('tool', tools)
            toolSelect = htmlElem.call.getChildElement('tool');
            sampleBackdropDiv = htmlElem.call.getChildElement('sample_backdrop');
            sampleButtonDiv = htmlElem.call.getChildElement('sample');
            applyOperationDiv = htmlElem.call.getChildElement('apply_tool');
            colorPanelDiv = htmlElem.call.getChildElement('color_panel');
            sliderNoiseDiv = htmlElem.call.getChildElement('noise');
            sliderDrawDiv = htmlElem.call.getChildElement('draw');
            colorPanelDiv.style.display = "none";
            biomeSelect = htmlElem.call.getChildElement('biome');
            DomUtils.addClickFunction(applyOperationDiv, applyOperation);
            DomUtils.addClickFunction(sampleButtonDiv, applySampledGround);
            visualEdgeCircle = poolFetch('VisualEdgeCircle')
            visualEdgeCircle.on();

            let applyRebuildDiv = htmlElem.call.getChildElement('rebuild');
            DomUtils.addClickFunction(applyRebuildDiv, applyRebuild);
            ThreeAPI.registerPrerenderCallback(update);
            statusMap.draw = 0;
            updateSelectedTool();
        }

        let groundData = [0, 0, 0, 0];
        let drawResolution = 1;
        let lastDrawPoint = new Vector3();
        let pressDistance = 0;
        let spaceWasPressed = false;
        let sliderValue =0;
        let update = function() {



            if (selectedTool === "GROUND") {
                ThreeAPI.terrainAt(targetObj3d.position, null, groundData);
                sampleBackdropDiv.style.backgroundColor = MATH.rgbaFromArray(groundData);
                drawResolution = 0.5;
            } else {
                drawResolution = 1;
            }
        //    rootElem.style.transition = 'none';
            MATH.roundVectorPlane(ThreeAPI.getCameraCursor().getPos(), targetObj3d.position, drawResolution);
            visualEdgeCircle.setPosition(targetObj3d.position);
            visualEdgeCircle.setRadius(statusMap.radius);

            if (toolSelect.value !== selectedTool) {
                updateSelectedTool()
            }

            let spacePressed = isPressed(' ');
            let pixelDistance = MATH.planePointsBetweenVectors(lastDrawPoint, targetObj3d.position)

            if (spacePressed === true) {
                statusMap.draw = 1;
                spaceWasPressed = true;
                pressDistance+=pixelDistance;
                sliderDrawDiv.value = 1
            } else {
                if (pressDistance === 0 && spaceWasPressed === true) {
                    applyOperation();
                }

                if (statusMap.draw !== 1) {
                    sliderValue = statusMap.draw;
                } else {
                    sliderDrawDiv.value = sliderValue;
                }
                pressDistance = 0;
                spaceWasPressed = false;
            }



            if (pixelDistance > 0) {
                if (statusMap.draw !== 0) {
                    applyDrawFromTo(lastDrawPoint, targetObj3d.position, pixelDistance);
                }
                MATH.roundVectorPlane(targetObj3d.position, lastDrawPoint, drawResolution);
            }

        };

        let close = function() {
            visualEdgeCircle.off();
            poolReturn(visualEdgeCircle);
            visualEdgeCircle = null;
        }

        this.call = {
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
        this.htmlElement.initHtmlElement('edit_terrain', closeCb, this.statusMap, 'edit_frame edit_terrain', readyCb);
    }

    closeEditTool() {
        this.call.close();
        ThreeAPI.unregisterPrerenderCallback(this.call.update);
        this.htmlElement.closeHtmlElement();
        poolReturn(this.htmlElement);
        this.htmlElement = null;
    }

}

export { DomEditTerrain }