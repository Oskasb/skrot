import {poolFetch, poolReturn} from "../../utils/PoolUtils.js";
import {Vector3} from "../../../../libs/three/math/Vector3.js";
import {Object3D} from "../../../../libs/three/core/Object3D.js";
import {paletteKeys} from "../../../game/visuals/Colors.js";

let tempVec = new Vector3();
let frustumFactor = 0.828;

let operationsList = [
    "",
    "FLATTEN",
    "ELEVATE",
    "HIDE"
]

function worldModelOperation(wModel, operation) {

    if (operation === "ELEVATE") {
        wModel.obj3d.position.y += 1;
        wModel.applyObj3dUpdate()
    }

    if (operation === "HIDE") {
        if (wModel.hidden !== true) {
            wModel.setHidden(true);
        } else {
            wModel.setHidden(false);
        }
    }

    if (operation === "FLATTEN") {
        wModel.applyObj3dUpdate();
        let box = wModel.box;
        ThreeAPI.alignGroundToAABB(box);
    }

}


class DomEditLocation {
    constructor() {

        this.targetObj3d = new Object3D();
        this.updateObj3d = new Object3D();

        this.statusMap = {

        };

        let statusMap = this.statusMap;

        let rootElem = null;

        let htmlElem;
        let applyOperationDiv = null;
        let nodeDivs = [];
        let selectedOperation = "";

        let initEditStatus = function(obj3d) {

        }.bind(this);
        let paletteVal = null;
        let worldModel = null;
        let operationSelect = null;


        let updateSelectedOperation = function() {
            console.log("updateSelectedOperation")
            if (selectedOperation === "") {
                applyOperationDiv.style.opacity = "0.4";
            } else {
                applyOperationDiv.style.opacity = "1";
            }
            applyOperationDiv.innerHTML = selectedOperation;
        }

        let applyOperation = function(e) {
            console.log("Apply", selectedOperation);
            worldModelOperation(worldModel, selectedOperation);
        }

        let getWorldModel = function() {
            return worldModel;
        }

        let htmlReady = function(htmlEl) {
            htmlElem = htmlEl;
            rootElem = htmlEl.call.getRootElement();
        }

        let update = function() {
        //    rootElem.style.transition = 'none';
        };

        let close = function() {
            while (nodeDivs.length) {
                DomUtils.removeDivElement(nodeDivs.pop());
            }
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
        this.htmlElement.initHtmlElement('edit_location', closeCb, this.statusMap, 'edit_frame edit_location', readyCb);
    }

    closeEditTool() {
        this.call.close();
        ThreeAPI.unregisterPrerenderCallback(this.call.update);
        this.htmlElement.closeHtmlElement();
        poolReturn(this.htmlElement);
        this.htmlElement = null;
    }

}

export { DomEditLocation }