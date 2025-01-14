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

        let keyMoveVec3 = new Vector3();

        function updateKeyMove() {
            let forward = keyToValue('w');
            let back = keyToValue('s');
            let left = keyToValue('a');
            let right = keyToValue('d');
            keyMoveVec3.set(right-left, 0, back-forward);

        }


        function updateCamera() {
            updateKeyMove();
            keyMoveVec3.applyQuaternion(camera.quaternion);
            keyMoveVec3.y = 0;
            keyMoveVec3.multiplyScalar(MATH.distanceBetween(camera.position, orbitControls.target) * getFrame().tpf);
            player.call.getObj3d().position.add(keyMoveVec3);
            let y = terrainAt(player.call.getObj3d().position, keyMoveVec3)
            player.call.getObj3d().position.y = y;
            keyMoveVec3.multiplyScalar(5);
            keyMoveVec3.add(player.call.getObj3d().position);

            evt.dispatch(ENUMS.Event.DEBUG_DRAW_LINE, {from: player.call.getObj3d().position, to:keyMoveVec3, color:'YELLOW'});
            evt.dispatch(ENUMS.Event.DEBUG_DRAW_CROSS, {pos: player.call.getObj3d().position, size:1, color:'YELLOW'});
       //     debugDrawPhysicalWorld()

            lastCamPos.copy(orbitControls.target);
            orbitControls.target.copy(player.call.getObj3d().position);
            posFrameDelta.subVectors(orbitControls.target, lastCamPos)
            camera.position.add(posFrameDelta);
            orbitControls.update();

            lastCamPos.copy(camera.position);
            ThreeAPI.getCameraCursor().getPos().copy(orbitControls.target)
        }


        function initCamera() {
            camera.position.set( - 24, 28, 2.7 );
            //    dynamics.addEventListener( 'change', render ); // use if there is no animation loop
            orbitControls.minDistance = 0.5;
            orbitControls.maxDistance = 2000;
            orbitControls.target.set( 2000, 24 , 2000);
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