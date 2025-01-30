import {Vector2} from "three/webgpu";
import {Object3D} from "../../../../../libs/three/core/Object3D.js";
import {jsonAsset} from "../../../application/utils/AssetUtils.js";
import {terrainAt} from "../../../3d/three/terrain/ComputeTerrain.js";
import {evt} from "../../../application/event/evt.js";
import {ENUMS} from "../../../application/ENUMS.js";
import {registerGroundLodCallback, unregisterGroundLodCallback} from "../../../application/grids/GroundBoundLodBox.js";

const lodLevelDebugColors = [
    'WHITE',
    'RED',
    'BLUE',
    'ORANGE',
    'CYAN',
    'GREEN',
    'YELLOW',
    'BLACK'
]

function debugDrawTree(obj3d, lodLevel) {
    let color = lodLevelDebugColors[lodLevel];
    let y = terrainAt(obj3d.position);
    obj3d.position.y = y;

    evt.dispatch(ENUMS.Event.DEBUG_DRAW_LINE, {from:obj3d.position, to:ThreeAPI.getCameraCursor().getPos(), color:color})

}

class ForestTreeLodable {
    constructor() {
        let indexPos = new Vector2();
        let minLodLevel
        let obj3d = new Object3D();

        let lodLevel = 0;

        let debugDrawing = false;

        function debugUpdate() {
        //    if (debugDrawing === true) {
                debugDrawTree(obj3d, lodLevel)
        //    }
        }

        function setLodLevel(lodL) {
            lodLevel = lodL;

            if (lodLevel > minLodLevel) {
            //    closeLodTree()
                if (debugDrawing === false) {
                    ThreeAPI.registerPrerenderCallback(debugUpdate);
                    debugDrawing = true;
                } else {

                }
            } else {
                closeLodTree()
            }
        }

        function setTreeJson(json) {
        //    console.log("setTreeJson")
        }

        function initForestTree(fileName, trxObj3d, indPos, minLodLvl) {
            indexPos.copy(indPos);
            minLodLevel = minLodLvl;
            obj3d.position.copy(trxObj3d.position);
            obj3d.quaternion.copy(trxObj3d.quaternion);
            obj3d.scale.copy(trxObj3d.scale)
            jsonAsset(fileName, setTreeJson);
        }

        function closeLodTree() {
        //    console.log("Close closeLodTree")
            ThreeAPI.unregisterPrerenderCallback(debugUpdate);
            debugDrawing = false
        }

        this.call = {
            initForestTree:initForestTree,
            setLodLevel:setLodLevel
        }

    }


}

export { ForestTreeLodable }