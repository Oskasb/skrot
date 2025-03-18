import {OrbitControls} from "../../../../libs/jsm/controls/OrbitControls.js";
import {ENUMS} from "../../application/ENUMS.js";
import {evt} from "../../application/event/evt.js";
import {cameraFunctions} from "../../3d/camera/CameraFunctions.js";
import {Vector3} from "three/webgpu";
import {MATH} from "../../application/MATH.js";


const lowFreqSpatialCallbacks = [];
const lowResPoint = [0, 0, 0];


class PlayerCamera {
    constructor(camera, renderer, player) {

        const orbitControls = new OrbitControls( camera, renderer.domElement );

        orbitControls.camera = camera;
        let camFunction = null;
        let selectedPoint = null;
        let params = null;
        let currentControllable = null;

        const distanceTraveledTestVec3 = new Vector3();

        function updateCamera() {


            if (camFunction !== null) {
                const target = player.call.getPlayerControllable()
                if (currentControllable !== target) {
                    camFunction = 'CAM_ORBIT';
                    currentControllable = target;
                    return;
                }
                cameraFunctions[camFunction](target, orbitControls, selectedPoint, params)
            } else {
                cameraFunctions['CAM_WORLD'](player.call.getObj3d().position, orbitControls)
            }
            ThreeAPI.getCameraCursor().getPos().copy(orbitControls.target)

            if (MATH.distanceBetween(camera.position, distanceTraveledTestVec3) > 100) {
                distanceTraveledTestVec3.copy(camera.position)
                MATH.posToLowResPoint(camera.position, lowResPoint)
                MATH.callAll(lowFreqSpatialCallbacks, lowResPoint)
            }

        }

        function initCamera() {
            camera.position.set( 1369, 52, 3525 );
            orbitControls.target.set( 1402, 41 , 3565);
            ThreeAPI.getCameraCursor().getPos().copy(orbitControls.target)
            player.call.getObj3d().position.copy(orbitControls.target)
            orbitControls.update();
            ThreeAPI.registerPrerenderCallback(updateCamera);
        }

        function setCameraSelection(mode) {
            console.log("setCameraSelection", mode)
            if (typeof (mode.select) === 'string') {
                camFunction = mode.select;
            } else {
                if (mode.select['point']) {
                    selectedPoint = mode.select['point'];
                    params = mode.select
                    camFunction = 'CAM_POINT'
                    orbitControls.minDistance = params.init || 25;
                    orbitControls.maxDistance = params.init || 25;
                    orbitControls.update();
                }
            }

        }

        evt.on(ENUMS.Event.CAMERA_SELECTION, setCameraSelection);

        initCamera();
        return orbitControls;
    }

}

function registerLowFrequencySpatialCallback(cb) {
    if (lowFreqSpatialCallbacks.indexOf(cb) === -1) {
        lowFreqSpatialCallbacks.push(cb);
    }
}

export {
    PlayerCamera,
    registerLowFrequencySpatialCallback
};