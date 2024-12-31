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
            const emissivePass = scenePass.getTextureNode( 'emissive' );

            const bloomPass = bloom( emissivePass, 1.6, 1.05, 0 );

            let ssrPass = initSSR(scene, camera, renderer, scenePass, outputPass)

            let postBloomProcessing = new PostProcessing( renderer );

            let blendedSsr = blendColor(outputPass, ssrPass);
            let blendedBloom = blendedSsr.add(bloomPass);

            postBloomProcessing.outputNode = blendedBloom // outputPass.add(bloomPass)
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
            ssrPass.maxDistance.value = 12;
            ssrPass.opacity.value = 0.9;
            ssrPass.thickness.value = 0.001;

            return ssrPass;

        }


        this.call = {


            initBloom:initBloom
        }

    }

}

export {ThreeBloom}