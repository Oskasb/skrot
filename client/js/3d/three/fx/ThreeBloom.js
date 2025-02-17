import {NearestFilter, PostProcessing} from "../../../../../libs/three/Three.WebGPU.js";
import {
    add,
    blendColor,
    emissive,
    metalness, mix,
    mrt,
    output,
    pass, renderOutput,
    transformedNormalView
} from "../../../../../libs/three/Three.TSL.js";
import {bloom} from "../../../../../libs/jsm/tsl/display/BloomNode.js";
import {ssr} from "../../../../../libs/jsm/tsl/display/SSRNode.js";
import {smaa} from "../../../../../libs/jsm/tsl/display/SMAANode.js";
import {PMREMGenerator} from "../../../../../libs/three/Three.js";

class ThreeBloom{
    constructor() {


        function initBloom(scene, camera, renderer) {

          //  return;

            const scenePass = pass( scene, camera, { minFilter: NearestFilter, magFilter: NearestFilter } );
            scenePass.setMRT( mrt( {
                output: output,
                normal: transformedNormalView,
                metalness: metalness,
                emissive:emissive
            } ) );
            /*
            const scenePass = pass( scene, camera );
            scenePass.setMRT( mrt( {
                output,
                emissive
            } ) );
*/
            const outputPass = scenePass.getTextureNode( 'output' );
        //    const scenePassColor = scenePass.getTextureNode( 'output' );
        //    const emissivePass = scenePass.getTextureNode( 'emissive' );

        //    const bloomPass = bloom( emissivePass, 1.8, 1.02, 0 );

        //    let ssrPass = initSSR(scene, camera, renderer, scenePass, outputPass)

            let postBloomProcessing = new PostProcessing( renderer );

            const bloomAll = bloom( outputPass, 0.2, 1, 0.85 );

         //   let blendedSsr = blendColor(outputPass, ssrPass).add(bloomAll);


       //     let blendedBloom = blendedSsr.add(bloomPass);



            postBloomProcessing.outputNode = outputPass.add(bloomAll)
            ThreeAPI.addPostProcess(postBloomProcessing)
        }

        function initSSR(scene, camera, renderer, scenePass, outputPass) {


            scene.environmentIntensity = 1.0;

            const scenePassColor = outputPass;
            const scenePassNormal = scenePass.getTextureNode( 'normal' );
            const scenePassDepth = scenePass.getTextureNode( 'depth' );
            const scenePassMetalness = scenePass.getTextureNode( 'metalness' );

            const ssrPass = ssr( scenePassColor, scenePassDepth, scenePassNormal, scenePassMetalness, camera );
            ssrPass.resolutionScale = 0.5;
            ssrPass.maxDistance.value = 4;
            ssrPass.opacity.value = 1;
            ssrPass.thickness.value = 0.01;

            return ssrPass;

        }


        this.call = {


            initBloom:initBloom
        }

    }

}

export {ThreeBloom}