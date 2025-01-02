import {OrbitControls} from "../../../../libs/jsm/controls/OrbitControls.js";
import {Vector3} from "../../../../libs/three/Three.Core.js";

class PlayerCamera {
    constructor(camera, renderer, player) {

        let orbitControls = new OrbitControls( camera, renderer.domElement );

        let lastTargetPos = new Vector3();
        let lastCamPos = new Vector3();
        lastCamPos.copy(camera.position);
        let posFrameDelta = new Vector3();

        function updateCamera() {
            lastCamPos.copy(orbitControls.target);
            orbitControls.target.copy(player.call.getObj3d().position);
            posFrameDelta.subVectors(orbitControls.target, lastCamPos)
            camera.position.add(posFrameDelta);
            orbitControls.update();

            lastCamPos.copy(camera.position);
        }


        function initCamera() {
            camera.position.set( - 24, 28, 2.7 );
            //    dynamics.addEventListener( 'change', render ); // use if there is no animation loop
            orbitControls.minDistance = 0.5;
            orbitControls.maxDistance = 2000;
            orbitControls.target.set( 0, 24 , 0);
            orbitControls.update();
            ThreeAPI.registerPrerenderCallback(updateCamera);
        }

        initCamera();

    }



}

export { PlayerCamera };