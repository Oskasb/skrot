import {OrbitControls} from "../../../../libs/jsm/controls/OrbitControls.js";
import {ENUMS} from "../../application/ENUMS.js";
import {evt} from "../../application/event/evt.js";
import {cameraFunctions} from "../../3d/camera/CameraFunctions.js";

class PlayerCamera {
    constructor(camera, renderer, player) {

        let orbitControls = new OrbitControls( camera, renderer.domElement );

        orbitControls.camera = camera;

        let camFunction = null;

        function updateCamera() {
            if (camFunction !== null) {
                cameraFunctions[camFunction](player.call.getPlayerControllable(), orbitControls)
            } else {
                cameraFunctions['CAM_WORLD'](player.call.getObj3d().position, orbitControls)
            }
            ThreeAPI.getCameraCursor().getPos().copy(orbitControls.target)
        }

        function initCamera() {
            camera.position.set( 1199, 52, 3495 );
            orbitControls.target.set( 1202, 44 , 3465);
            ThreeAPI.getCameraCursor().getPos().copy(orbitControls.target)
            player.call.getObj3d().position.copy(orbitControls.target)
            orbitControls.update();
            ThreeAPI.registerPrerenderCallback(updateCamera);
        }

        function setCameraSelection(mode) {
            console.log("setCameraSelection", mode)
            camFunction = mode.select;
        }

        evt.on(ENUMS.Event.CAMERA_SELECTION, setCameraSelection);

        initCamera();
        return orbitControls;
    }

}

export { PlayerCamera };