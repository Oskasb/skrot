import {NearestFilter, PostProcessing} from "../../../../../libs/three/Three.WebGPU.js";
import {
    blendColor,
    emissive,
    metalness,
    mrt,
    output,
    pass,
    transformedNormalView
} from "../../../../../libs/three/Three.TSL.js";
import {bloom} from "../../../../../libs/jsm/tsl/display/BloomNode.js";
import {ssr} from "../../../../../libs/jsm/tsl/display/SSRNode.js";
import {smaa} from "../../../../../libs/jsm/tsl/display/SMAANode.js";

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



            const ssrNode = initSSR(outputPass, scene, camera)
        //    outputPass.add( ssrNode );
           postProcessing.outputNode = outputPass.add( bloomPass );
            //    postProcessing.outputNode = outputPass.add( ssrNode );
            ThreeAPI.addPostProcess(postProcessing)
        }

        function initSSR(outputPass, scene, camera) {

            const scenePass = pass( scene, camera, { minFilter: NearestFilter, magFilter: NearestFilter } );
            scenePass.setMRT( mrt( {
                output: output,
                normal: transformedNormalView,
                metalness: metalness
            } ) );

            const scenePassColor = scenePass.getTextureNode( 'output' );
            const scenePassNormal = scenePass.getTextureNode( 'normal' );
            const scenePassDepth = scenePass.getTextureNode( 'depth' );
            const scenePassMetalness = scenePass.getTextureNode( 'metalness' );

            const ssrPass = ssr( scenePassColor, scenePassDepth, scenePassNormal, scenePassMetalness, camera );
            ssrPass.resolutionScale = 1.0;
            ssrPass.maxDistance.value = 1;
            ssrPass.opacity.value = 1;
            ssrPass.thickness.value = 0.03;
            // blend SSR over beauty

            return smaa( blendColor( scenePassColor, ssrPass ) );
        //    outputPass.add(outputNode)
        }


        this.call = {


            initBloom:initBloom
        }

    }

}

export {ThreeBloom}