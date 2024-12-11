import { EffectComposer } from "../../../../libs/addons/postprocessing/EffectComposer.js";
import { SSRPass } from "../../../../libs/addons/postprocessing/SSRPass.js";
import { OutputPass} from "../../../../libs/addons/postprocessing/OutputPass.js";
import { ReflectorForSSRPass} from "../../../../libs/addons/objects/ReflectorForSSRPass.js";
import { PlaneGeometry } from "../../../../libs/three/geometries/PlaneGeometry.js";

let groundRefGeometry
let groundReflector
let composer
let ssrPass

class SsrFx {
    constructor(renderer, scene, camera) {

        groundRefGeometry = new PlaneGeometry(10000, 10000, 1, 1);
        groundReflector = new ReflectorForSSRPass( groundRefGeometry, {
            clipBias: 0.0003,
            textureWidth: window.innerWidth,
            textureHeight: window.innerHeight,
            color: 0x888888,
            useDepthTexture: true,
        } );

        groundReflector.material.depthWrite = false;
        groundReflector.rotation.x = - Math.PI / 2;
        groundReflector.visible = false;

    //    scene.add(groundReflector);

        composer = new EffectComposer( renderer );
        ssrPass = new SSRPass( {
            renderer,
            scene,
            camera,
            width: innerWidth,
            height: innerHeight,

            groundReflector: groundReflector ,
            selects:  null
        } );

        composer.addPass( ssrPass );
        composer.addPass( new OutputPass() );


        function onWindowResize() {
            composer.setSize( window.innerWidth, window.innerHeight );
            groundReflector.getRenderTarget().setSize( window.innerWidth, window.innerHeight );
            groundReflector.resolution.set( window.innerWidth, window.innerHeight );
        }

    //    window.addEventListener( 'resize', onWindowResize );
    }

    getGroundReflector() {
        return groundRefGeometry
    }


}

export {SsrFx}