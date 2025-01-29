import {jsonAsset} from "../utils/AssetUtils.js";
import {Vector2, Vector3} from "three/webgpu";
import {GroundBoundLodBox} from "./GroundBoundLodBox.js";
import {MATH} from "../MATH.js";
import {gridIndexForPos} from "../utils/GridUtils.js";

let tempIndexVec2 = new Vector2();

class GroundBoundLodGrid {
    constructor(fileName) {

        let settings = {};

        let lastPos = new Vector3();
        let indexPos = new Vector2();

        let pointAheadOfCamera = new Vector3();

        let activeLodBoxes = [];
        let inactiveLodBoxes = [];

        let deactivateBoxes = [];
        let cam = ThreeAPI.getCamera();

        let lastLookAt = new Vector3();
        let lastCamPos = new Vector3();

        function activateBoxAtIndex(indexPosVec2) {
            for (let i = 0; i < activeLodBoxes.length; i++) {
                let box = activeLodBoxes[i];
                if (box.indexPos.distanceToSquared(indexPosVec2) === 0) {
                    return box;
                }
            }

            if (inactiveLodBoxes.length === 0) {
                console.log("No more boxes...")
                return;
            }

            let box = inactiveLodBoxes.pop();
            box.setGridIndex(indexPosVec2);
            let isVisible = box.testLodBoxVisibility(cam.position);
            if (isVisible) {
                activeLodBoxes.push(box);
            } else {
                inactiveLodBoxes.push(box);
            }

        }

        function visibilityTestActiveBoxex() {
            for (let i = 0; i < activeLodBoxes.length; i++) {
                let lodBox = activeLodBoxes[i];
                let isVisible = lodBox.testLodBoxVisibility(cam.position)
                if (isVisible === false) {
                    deactivateBoxes.push(lodBox)
                }
            }

            while (deactivateBoxes.length) {
                let lodBox = deactivateBoxes.pop();
                MATH.splice(activeLodBoxes, lodBox);
                lodBox.deactivateLodBox();
                inactiveLodBoxes.push(lodBox);
            }

        }

        function debugDrawActiveBoxes() {
            for (let i = 0; i < activeLodBoxes.length; i++) {
                activeLodBoxes[i].debugDrawLodBox();
            }
        }

        function updateIndexGrid() {

            let sideTiles = settings['grid_side_tiles']
            for (let i = 0; i < sideTiles; i++) {
                for (let j = 0; j < sideTiles; j++) {
                    tempIndexVec2.copy(indexPos);
                    tempIndexVec2.x += Math.floor(sideTiles*0.5 -i)
                    tempIndexVec2.y += Math.floor(sideTiles*0.5 -j)
                    activateBoxAtIndex(tempIndexVec2)
                }
            }

        }


        function update() {


            let sideSize = settings['side_size']
            let gridTileSize = settings['grid_side_tiles']
            let gridTotalSize = sideSize * gridTileSize
            let centerDistanceMargined = (gridTotalSize - gridTileSize) * 0.5;

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
                return;
            }
            lastLookAt.copy(pointAheadOfCamera);
            lastCamPos.copy(cam.position)

            gridIndexForPos(pointAheadOfCamera, indexPos, settings['side_size']);
            updateIndexGrid()
        //    let box = getActiveBoxAtPos(pointAheadOfCamera);

            visibilityTestActiveBoxex()

        }

        function gridData(json) {
            for (let key in json) {
                settings[key] = json[key];
            }

            MATH.emptyArray(inactiveLodBoxes);
            MATH.emptyArray(activeLodBoxes);

            for (let i = 0; i < settings['grid_side_tiles']*settings['grid_side_tiles']; i++) {
                inactiveLodBoxes.push(new GroundBoundLodBox(settings));
            }

            console.log("Ground bound grid settings", settings);
            ThreeAPI.registerPrerenderCallback(update);
        }

        jsonAsset(fileName, gridData)

    }

}

export { GroundBoundLodGrid }