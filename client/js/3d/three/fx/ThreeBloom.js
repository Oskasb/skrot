import {PostProcessing} from "../../../../../libs/three/Three.WebGPU.js";
import {emissive, mrt, output, pass} from "../../../../../libs/three/Three.TSL.js";
import {bloom} from "../../../../../libs/jsm/tsl/display/BloomNode.js";

class ThreeBloom{
    constructor() {


        function initBloom(scene, camera, renderer) {

            const scenePass = pass( scene, camera );
            scenePass.setMRT( mrt( {
                output,
                emissive
            } ) );

            const outputPass = scenePass.getTextureNode();
            const emissivePass = scenePass.getTextureNode( 'emissive' );

            const bloomPass = bloom( emissivePass, 1.4, 1.05, 0 );
            let postProcessing = new PostProcessing( renderer );
            postProcessing.outputNode = outputPass.add( bloomPass );

        //    renderer.setAnimationLoop( render );

            function render() {

                postProcessing.render();

            }


            ThreeAPI.addPostProcess(postProcessing)



        }

        this.call = {
            initBloom:initBloom
        }

    }

}

export {ThreeBloom}