import {jsonAsset} from "../../../application/utils/AssetUtils.js";
import {unregisterGroundLodCallback} from "../../../application/grids/GroundBoundLodBox.js";
import {Box3} from "three";
import {Vector3} from "../../../../../libs/three/math/Vector3.js";
import {Vector2} from "three/webgpu";
import {centerByIndexPos, positionBoxAtIndexPos} from "../../../application/utils/GridUtils.js";
import {ENUMS} from "../../../application/ENUMS.js";
import {evt} from "../../../application/event/evt.js";
import {terrainAt} from "../../../3d/three/terrain/ComputeTerrain.js";

const tempVec = new Vector3();

class TerrainPlantsSection {
    constructor() {

        let pantsConfig = null;

        const box = new Box3()
        const center = new Vector3()
        const indexPos = new Vector2();

        function processPlantsConfig() {

        }

        function setConfig(json) {
            pantsConfig = json;
            processPlantsConfig()
        }

        function removeSector() {

        }

        function unregisterCallbacks() {

        }

        function visibilityTestPlantSector(boxSize, sideSize) {

            center.copy(centerByIndexPos(indexPos, sideSize));
            tempVec.set(sideSize, sideSize, sideSize);
            let height = terrainAt(center)
            center.y = height;
            box.setFromCenterAndSize(center, tempVec);
            /*

            box.min.set(0, 0, 0);
            box.max.set(boxSize, boxSize, boxSize);
            center.copy(positionBoxAtIndexPos(box, indexPos, tempVec));
*/
            let isVisible = ThreeAPI.testBoxIsVisible(box);

            if (isVisible) {
                evt.dispatch(ENUMS.Event.DEBUG_DRAW_AABOX, {min:box.min, max:box.max, color:'GREEN'})
            } else {
                evt.dispatch(ENUMS.Event.DEBUG_DRAW_LINE, {from:center, to:ThreeAPI.getCameraCursor().getPos(), color:'RED'})
            }
            return isVisible;
        }

        function getIndexPos() {
            return indexPos;
        }

        this.call = {
            getIndexPos:getIndexPos,
            unregisterCallbacks:unregisterCallbacks,
            visibilityTestPlantSector:visibilityTestPlantSector
        }

    }
}

export { TerrainPlantsSection}