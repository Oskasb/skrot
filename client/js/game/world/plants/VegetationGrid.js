import {Vector3} from "../../../../../libs/three/math/Vector3.js";
import {jsonAsset} from "../../../application/utils/AssetUtils.js";
import {Vector2} from "three/webgpu";
import {MATH} from "../../../application/MATH.js";
import {getSetting} from "../../../application/utils/StatusUtils.js";
import {TerrainPlantsSection} from "./TerrainPlantsSection.js";
import {gridIndexForPos} from "../../../application/utils/GridUtils.js";
import {ENUMS} from "../../../application/ENUMS.js";


class VegetationGrid {
    constructor(fileName) {
        const center = new Vector3()
        const indexPos = new Vector2();

        const pointAheadOfCamera = new Vector3();
        const activeLodBoxes = [];
        const inactiveLodBoxes = [];
        const deactivateBoxes = [];
        const cam = ThreeAPI.getCamera();
        const lastLookAt = new Vector3();
        const lastCamPos = new Vector3();

        const vegTilesSide = 7;

        const availableVegTiles = [];
        const activeTiles = [];

        let json = null;

        function tileByIndexXY(x, y) {
            for (let i = 0; i < activeTiles.length; i++) {
                let iPos = activeTiles[i].call.getIndexPos();
                if (iPos.x === x && iPos.y === y) {
                    return activeTiles[i];
                }
            }

            let tile = availableVegTiles.pop();
            if (!tile) {
                tile = new TerrainPlantsSection();
            }
            tile.call.getIndexPos().set(x, y);

            return tile;

        }

        function updateVegGridSections(boxSize, dens, sideSize) {



            for (let i = 0; i < vegTilesSide; i++) {
                for (let j = 0; j < vegTilesSide; j++) {

                    let indexX = i + indexPos.x - Math.floor(vegTilesSide * 0.5);
                    let indexY = j + indexPos.y - Math.floor(vegTilesSide * 0.5);

                    let tile = tileByIndexXY(indexX, indexY);
                    let isVis = tile.call.visibilityTestPlantSector(boxSize, sideSize, vegTilesSide, dens, json);
                    if (isVis === false) {
                        availableVegTiles.push(tile);
                    }
                }
            }
        }

        function update() {

            let boxSize = 5 * getSetting(ENUMS.Settings.VEGETATION_RANGE) || 15;
            let dens = getSetting(ENUMS.Settings.VEGETATION_DENSITY) || 5;

            let sideSize = boxSize * vegTilesSide;
            let centerDistanceMargined = sideSize * vegTilesSide * 0.45;

            pointAheadOfCamera.set(0, 0, -1);
            pointAheadOfCamera.applyQuaternion(cam.quaternion);
            pointAheadOfCamera.y = 0;
            pointAheadOfCamera.normalize();
            pointAheadOfCamera.multiplyScalar(centerDistanceMargined);
            pointAheadOfCamera.add(cam.position)

            let lookDist = MATH.distanceBetween(pointAheadOfCamera, lastLookAt)
            let camPosDist = MATH.distanceBetween(cam.position, lastCamPos)

            if (lookDist < sideSize * 0.5 && camPosDist < sideSize * 0.5) {
                //    debugDrawActiveBoxes()
            //    return;
            } else {
                lastLookAt.copy(pointAheadOfCamera);
                lastCamPos.copy(cam.position)
                gridIndexForPos(pointAheadOfCamera, indexPos, sideSize);
            }

            updateVegGridSections(boxSize, dens, sideSize)
        }

        function onJson(jsn) {
            json = jsn;
            ThreeAPI.registerPrerenderCallback(update);
        }


        jsonAsset(fileName, onJson)
    }
}

export { VegetationGrid }