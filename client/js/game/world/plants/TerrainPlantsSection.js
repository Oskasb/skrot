import {jsonAsset} from "../../../application/utils/AssetUtils.js";
import {unregisterGroundLodCallback} from "../../../application/grids/GroundBoundLodBox.js";
import {Box3} from "three";
import {Vector3} from "../../../../../libs/three/math/Vector3.js";
import {Object3D, Vector2} from "three/webgpu";
import {centerByIndexPos, positionBoxAtIndexPos} from "../../../application/utils/GridUtils.js";
import {ENUMS} from "../../../application/ENUMS.js";
import {evt} from "../../../application/event/evt.js";
import {groundAt, terrainAt} from "../../../3d/three/terrain/ComputeTerrain.js";
import {MATH} from "../../../application/MATH.js";
import {getSetting} from "../../../application/utils/StatusUtils.js";
import {poolFetch} from "../../../application/utils/PoolUtils.js";

const tempVec = new Vector3();
const tempVec2 = new Vector3();

const tempObj = new Object3D();
const groundData = {};

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
            while (activePlants.length > plantTargetCount) {
                activePlants.pop().call.closePlant();
            }
        }

        function updateActivePlants(plantsJson) {

            removeSector()


            let offset = 0;



            while (activePlants.length !== plantTargetCount) {
            //    console.log(activePlants.length, plantTargetCount)
                let seed = activePlants.length + offset;
                let plant = poolFetch('BatchedPlant');
                let pos = MATH.sillyRandomPointInBox(box, seed);

                groundAt(pos, groundData);
                let height = terrainAt(pos, tempVec);


                if (groundData.z < 0.01 && tempVec.y > 0.8) {

                    pos.y = height;


                    let biomeIndex = Math.floor(groundData.x * 1.8);
                    let vegIndex = Math.floor(groundData.y * 7);



                    tempObj.position.copy(pos);

                    tempObj.quaternion.set(0, 0, 0, 1);
               //     tempObj.rotateX(MATH.sillyRandom(seed)*MATH.TWO_PI);
                    tempObj.rotateZ(-tempVec.x);
                    tempObj.rotateX(tempVec.z);
                    tempObj.rotateY(seed*0.5);
                //    tempObj.lookAt(tempVec)

                    let biomes = plantsJson['biomes'];

                    let list = biomes[biomeIndex][vegIndex] // plantsJson['plants'];
                    let entry = MATH.getSillyRandomArrayEntry(list, seed)

                    //    evt.dispatch(ENUMS.Event.DEBUG_DRAW_LINE, {from:center, to:pos, color:'YELLOW'})


                    plant.call.init(entry, tempObj)
                    activePlants.push(plant);
                } else {
                    plantTargetCount--
                    offset++;
                }


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
                                removeSector()
                                return false;
                            }
                        }
                    }
                }

            }

            const cam = ThreeAPI.getCamera();

            center.y = height;

            let maxDistance = tilesXY*sideSize*0.7
            let camDistance = MATH.distanceBetween(cam.position, center);

            if (camDistance > maxDistance) {
            //    evt.dispatch(ENUMS.Event.DEBUG_DRAW_LINE, {from:center, to:ThreeAPI.getCameraCursor().getPos(), color:'BLACK'})
                removeSector()
                return false;
            }

            distanceFraciton = 1 - MATH.calcFraction(0, maxDistance * 1.2, camDistance);
            let lodBias = getSetting(ENUMS.Settings.LOD_BIAS); // (50 = neutral)
            let biasFration = Math.pow(distanceFraciton, MATH.curveQuad( 2 - (lodBias / 50)))

            plantTargetCount = Math.floor(biasFration * dens * 50)

            box.setFromCenterAndSize(center, tempVec);
            /*

            box.min.set(0, 0, 0);
            box.max.set(boxSize, boxSize, boxSize);
            center.copy(positionBoxAtIndexPos(box, indexPos, tempVec));
*/



            let isVisible = true // ThreeAPI.testBoxIsVisible(box);

            if (isVisible) {
        //        evt.dispatch(ENUMS.Event.DEBUG_DRAW_AABOX, {min:box.min, max:box.max, color:'GREEN'})
            } else {
                removeSector()
                plantTargetCount = 0;
            //    evt.dispatch(ENUMS.Event.DEBUG_DRAW_LINE, {from:center, to:ThreeAPI.getCameraCursor().getPos(), color:'RED'})
            }

            if (plantTargetCount !== activePlants.length) {
                updateActivePlants(plantsJson);
            }

            if (plantTargetCount === 0) {
                return false;
            } else {
                return true;
            }

        }

        function getIndexPos() {
            return indexPos;
        }

        function setIndexPos(x, y) {
            removeSector()
            plantTargetCount = 0;
            indexPos.set(x, y);
        }

        this.call = {
            getIndexPos:getIndexPos,
            setIndexPos:setIndexPos,
            unregisterCallbacks:unregisterCallbacks,
            visibilityTestPlantSector:visibilityTestPlantSector
        }

    }
}

export { TerrainPlantsSection}