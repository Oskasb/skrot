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

            const scenePass = pass( scene, camera );
            scenePass.setMRT( mrt( {
                output,
                emissive
            } ) );

            const outputPass = scenePass.getTextureNode();
            const emissivePass = scenePass.getTextureNode( 'emissive' );

            const bloomPass = bloom( emissivePass, 1.4, 1.05, 0 );

            let ssrPass = initSSR(scene, camera, renderer)

            let postBloomProcessing = new PostProcessing( renderer );
        //    postBloomProcessing.outputNode = outputPass.add( bloomPass );
            //       ThreeAPI.addPostProcess(postBloomProcessing)
        //    outputPass.add( ssrNode );
        //    postBloomProcessing.outputNode = outputPass.add( bloomPass );

            //    console.log("BLOOM PASSES",ssrNode, bloomPass)

        //    postSsrProcessing.outputNode = scenePassColor.add( ssrNode );
         //

            postBloomProcessing.outputColorTransform = false;
       //    outputPass.add(bloomPass)
            const mixPasses = renderOutput( ssrPass);
        //    const fxaaPass = fxaa( outputPass );

            postBloomProcessing.outputNode = mixPasses;
            ThreeAPI.addPostProcess(postBloomProcessing)
        }

        function initSSR(scene, camera, renderer, bloomPass, outputPass) {

        //    let envMap = scene.userData.cube1Texture;
        //    const pmremGenerator = new PMREMGenerator( renderer );

       //     scene.environment = pmremGenerator.fromScene( scene.userData.reflectionScene ).texture;
            scene.environmentIntensity = 1.0;
        //    pmremGenerator.dispose();

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
            ssrPass.resolutionScale = 0.5;
            ssrPass.maxDistance.value = 12;
            ssrPass.opacity.value = 1;
            ssrPass.thickness.value = 0.02;
            // blend SSR over beauty

        //    let postSsrProcessing = new PostProcessing( renderer );

        //    outputPass.add(bloomPass)
       //     let ssrNode = bloomPass.add(ssrPass);
            return blendColor(scenePassColor, ssrPass);
            return ssrPass;
       //    ssrNode.add(bloomPass)
            postSsrProcessing.outputNode = ssrNode  ;
            ThreeAPI.addPostProcess(postSsrProcessing)
        //    outputPass.add(outputNode)
        }


        this.call = {


            initBloom:initBloom
        }

    }

}

export {ThreeBloom}