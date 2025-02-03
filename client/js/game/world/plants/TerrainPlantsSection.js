import {jsonAsset} from "../../../application/utils/AssetUtils.js";
import {unregisterGroundLodCallback} from "../../../application/grids/GroundBoundLodBox.js";
import {Box3} from "three";
import {Vector3} from "../../../../../libs/three/math/Vector3.js";
import {Vector2} from "three/webgpu";
import {centerByIndexPos, positionBoxAtIndexPos} from "../../../application/utils/GridUtils.js";
import {ENUMS} from "../../../application/ENUMS.js";
import {evt} from "../../../application/event/evt.js";
import {terrainAt} from "../../../3d/three/terrain/ComputeTerrain.js";
import {MATH} from "../../../application/MATH.js";
import {getSetting} from "../../../application/utils/StatusUtils.js";
import {poolFetch} from "../../../application/utils/PoolUtils.js";

const tempVec = new Vector3();
const tempVec2 = new Vector3();

class TerrainPlantsSection {
    constructor() {

        let pantsConfig = null;

        const box = new Box3()
        const center = new Vector3()
        const indexPos = new Vector2();

        let mayContainPlants = false;

        let plantTargetCount = 0;
        let distanceFraciton = 0;

        let activePlants = [];

        function processPlantsConfig() {

        }

        function setConfig(json) {
            pantsConfig = json;
            processPlantsConfig()
        }

        function removeSector() {

        }

        function updateActivePlants() {
            if (plantTargetCount !== activePlants.length) {
                updateActivePlants();
            }

            while (activePlants.length > plantTargetCount) {
                activePlants.pop().call.closePlant();
            }

            while (activePlants.length > plantTargetCount) {
                let plant = poolFetch('BatchedPlant');
                plant.call.init()
                activePlants.pop().call.closePlant();
            }

        }

        function unregisterCallbacks() {

        }

        function visibilityTestPlantSector(boxSize, sideSize, tilesXY, dens, plantsJson) {
            plantTargetCount = 0;
            center.copy(centerByIndexPos(indexPos, sideSize));
            tempVec.set(sideSize, sideSize, sideSize);
            let height = terrainAt(center)

            if (height < -1 || height > 1000) {

                tempVec2.set(center.x + sideSize*0.7, 0, center.z+ sideSize*0.7);
                let y = terrainAt(tempVec2)

                if (y < -1 || y > 1000) {

                    tempVec2.set(center.x - sideSize*0.7, 0, center.z+ sideSize*0.7);
                    let y = terrainAt(tempVec2)

                    if (y < -1 || y > 1000) {

                        tempVec2.set(center.x + sideSize*0.7, 0, center.z - sideSize*0.7);
                        let y = terrainAt(tempVec2)

                        if (y < -1 || y > 1000) {

                            tempVec2.set(center.x - sideSize*0.7, 0, center.z - sideSize*0.7);
                            let y = terrainAt(tempVec2)

                            if (y < -1 || y > 1000) {
                                return;
                            }
                        }
                    }
                }

            }

            const cam = ThreeAPI.getCamera();

            center.y = height;

            let maxDistance = tilesXY*sideSize*0.9
            let camDistance = MATH.distanceBetween(cam.position, center);

            if (camDistance > maxDistance) {
                evt.dispatch(ENUMS.Event.DEBUG_DRAW_LINE, {from:center, to:ThreeAPI.getCameraCursor().getPos(), color:'BLACK'})
                return;
            }

            distanceFraciton = (maxDistance - camDistance) / maxDistance
            let lodBias = getSetting(ENUMS.Settings.LOD_BIAS); // (50 = neutral)
            let biasFration = Math.pow(distanceFraciton, MATH.curveQuad(50 / lodBias))

            plantTargetCount = Math.floor(biasFration * dens)

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
                plantTargetCount = 0;
                evt.dispatch(ENUMS.Event.DEBUG_DRAW_LINE, {from:center, to:ThreeAPI.getCameraCursor().getPos(), color:'RED'})
            }

            if (plantTargetCount !== activePlants.length) {
                updateActivePlants();
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