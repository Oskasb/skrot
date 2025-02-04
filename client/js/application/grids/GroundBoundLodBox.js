import {Box3} from "three";
import {Vector2, Vector3} from "three/webgpu";
import {centerByIndexPos, gridIndexForPos, positionBoxAtIndexPos} from "../utils/GridUtils.js";
import {ENUMS} from "../ENUMS.js";
import {evt} from "../event/evt.js";
import {MATH} from "../MATH.js";
import {lodGridCalls} from "./LodGridCalls.js";
import {getSetting} from "../utils/StatusUtils.js";

const drawBox = {}

const lodIndexCallbacks = []
const activeLodLevels = [];

function registerIndexPos(indexPos) {
    if (!lodIndexCallbacks[indexPos.x]) {
        lodIndexCallbacks[indexPos.x] = [];
        activeLodLevels[indexPos.x] = [];
    }

    if (!lodIndexCallbacks[indexPos.x][indexPos.y]) {
        lodIndexCallbacks[indexPos.x][indexPos.y] = [];
        activeLodLevels[indexPos.x][indexPos.y] = 0;
    }

}

function callLodUpdate(indexPos, lodLevel) {
    if (!lodIndexCallbacks[indexPos.x]) {
        registerIndexPos(indexPos)
    }

    let cbs = lodIndexCallbacks[indexPos.x][indexPos.y];
    activeLodLevels[indexPos.x][indexPos.y] = lodLevel;
    MATH.callAll(cbs, lodLevel);

}

const lodLevelDebugColors = [
    'BLACK',
    'RED',
    'BLUE',
    'ORANGE',
    'CYAN',
    'GREEN',
    'YELLOW',
    'BLACK'
]

class GroundBoundLodBox {
    constructor(settings) {
        this.settings = settings;
        this.sideSize = settings['side_size']
        this.maxDistance = settings['grid_side_tiles'] * this.sideSize;
        this.lodLevels = settings['lod_levels'];
        this.indexPos = new Vector2();
        this.center = new Vector3();
        this.size = new Vector3(this.sideSize, this.sideSize*2, this.sideSize)
        this.box = new Box3();
        this.lastLodLevel = 0;
        this.lodLevel = 0;

        const lodBox = this;

        let debugDrawLodBox = function() {

            drawBox.min = lodBox.box.min;
            drawBox.max = lodBox.box.max;
            drawBox.color = lodLevelDebugColors[lodBox.lodLevel];

            if (!drawBox.color) {
                console.log("Bad color", lodBox.lodLevel, lodLevelDebugColors);
            }

            let from = ThreeAPI.getCameraCursor().getPos();
            evt.dispatch(ENUMS.Event.DEBUG_DRAW_LINE, {from:from, to:lodBox.center, color:drawBox.color})
            evt.dispatch(ENUMS.Event.DEBUG_DRAW_AABOX, drawBox)
        }

   //     ThreeAPI.registerPrerenderCallback(debugDrawLodBox)

        let deactivateLodBox = function() {
            let center = centerByIndexPos(lodBox.indexPos, lodBox.sideSize);
            let from = ThreeAPI.getCameraCursor().getPos();
        //    evt.dispatch(ENUMS.Event.DEBUG_DRAW_LINE, {from:from, to:center, color:'RED'})
            this.lodLevel = 0;
            lodBox.callLodUpdate()
            lodGridCalls[settings['register_lod_call']](lodBox, false);
        }

        function setGridIndex(gridIndex) {

            lodBox.indexPos.copy(gridIndex);
            let tempCenter = positionBoxAtIndexPos(lodBox.box, lodBox.indexPos, lodBox.size)
            lodBox.center.copy(tempCenter);
            lodBox.lodLevel = 0;
            lodGridCalls[settings['register_lod_call']](lodBox, true);
        }

        this.call = {
            deactivateLodBox:deactivateLodBox,
            setGridIndex:setGridIndex
        }

    }





    callLodUpdate() {
        if (this.lastLodLevel !== this.lodLevel) {
            callLodUpdate(this.indexPos, this.lodLevel);
        }

        this.lastLodLevel = this.lodLevel;
    }

    testLodBoxVisibility(camPos) {
        let isVisible = ThreeAPI.testBoxIsVisible(this.box);

        if (isVisible) {
            let camDistance = MATH.distanceBetween(camPos, this.center);
            if (camDistance > this.maxDistance) {
                this.lodLevel = 0;
                isVisible = false;
            } else {
                let distanceFraciton = (this.maxDistance + this.sideSize*2 - camDistance) / this.maxDistance
                let lodBias = getSetting(ENUMS.Settings.LOD_BIAS); // (50 = neutral)
                let biasFration = Math.pow(distanceFraciton, MATH.curveQuad(50 / lodBias))
                this.lodLevel = MATH.clamp(Math.floor(this.lodLevels * biasFration), 0, this.lodLevels);
            }

        } else {
            this.lodLevel = 0;
        }

        this.callLodUpdate()

        return isVisible;
    }



}

function registerGroundLodCallback(indexPos, lodCb) {
    registerIndexPos(indexPos)

    let cbs = lodIndexCallbacks[indexPos.x][indexPos.y];
    if (cbs.indexOf(lodCb) === -1) {
        cbs.push(lodCb);
    }

    lodCb(activeLodLevels[indexPos.x][indexPos.y]);

}

function unregisterGroundLodCallback(indexPos, lodCb) {
    registerIndexPos(indexPos)
  //  console.log("unregisterGroundLodCallback", indexPos.x, indexPos.y)
    MATH.splice(lodIndexCallbacks[indexPos.x][indexPos.y], lodCb);
}

export {
    GroundBoundLodBox,
    registerGroundLodCallback,
    unregisterGroundLodCallback
}