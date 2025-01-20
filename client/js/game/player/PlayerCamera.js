import {OrbitControls} from "../../../../libs/jsm/controls/OrbitControls.js";
import {Vector3} from "../../../../libs/three/Three.Core.js";
import {isPressed, keyToValue} from "../../application/ui/input/KeyboardState.js";
import {MATH} from "../../application/MATH.js";
import {getFrame} from "../../application/utils/DataUtils.js";
import {terrainAt} from "../../3d/three/terrain/ComputeTerrain.js";
import {ENUMS} from "../../application/ENUMS.js";
import {evt} from "../../application/event/evt.js";
import {debugDrawPhysicalWorld} from "../../application/utils/PhysicsUtils.js";

class PlayerCamera {
    constructor(camera, renderer, player) {

        let orbitControls = new OrbitControls( camera, renderer.domElement );

        let lastTargetPos = new Vector3();
        let lastCamPos = new Vector3();
        lastCamPos.copy(camera.position);
        let posFrameDelta = new Vector3();

        function updateCamera() {

        //    debugDrawPhysicalWorld()

            lastCamPos.copy(orbitControls.target);
            orbitControls.target.copy(player.call.getObj3d().position);
            posFrameDelta.subVectors(orbitControls.target, lastCamPos)
            camera.position.add(posFrameDelta);
            orbitControls.update();

            lastCamPos.copy(camera.position);
            ThreeAPI.getCameraCursor().getPos().copy(orbitControls.target)
        }


        function initCamera() {
            camera.position.set( 1178, 60, 3475 );
            //    dynamics.addEventListener( 'change', render ); // use if there is no animation loop
            orbitControls.minDistance = 0.5;
            orbitControls.maxDistance = 8000;
            orbitControls.target.set( 1178, 40 , 3425);
            ThreeAPI.getCameraCursor().getPos().copy(orbitControls.target)
            player.call.getObj3d().position.copy(orbitControls.target)
            orbitControls.update();
            ThreeAPI.registerPrerenderCallback(updateCamera);
        }

        initCamera();
        return orbitControls;
    }



}

export { PlayerCamera };