import {
    CubeTextureLoader, EquirectangularReflectionMapping,
    ImageBitmapLoader,
    LinearMipmapLinearFilter,
    Matrix4, Texture, TextureLoader
} from "../../../../../libs/three/Three.Core.js";
import {RGBMLoader} from "../../../../../libs/jsm/loaders/RGBMLoader.js";
import {
    hue,
    mix, normalWorld,
    pmremTexture,
    positionLocal,
    positionWorld,
    positionWorldDirection,
    reference,
    reflectVector, saturation, uniform
} from "../../../../../libs/three/Three.TSL.js";

class EnvironmentMaps {
    constructor(scene) {

        async function init() {

            const cube1Texture = await new TextureLoader()
                .setPath('../../../data/assets/images/textures/')
                .loadAsync('ref_sphere.png');

            cube1Texture.generateMipmaps = false;
            cube1Texture.mapping = EquirectangularReflectionMapping;

            //    cube1Texture.minFilter = LinearMipmapLinearFilter;

            const cube2Urls = [ 'posx.jpg', 'negx.jpg', 'posy.jpg', 'negy.jpg', 'posz.jpg', 'negz.jpg' ];
            const cube2Texture = await new CubeTextureLoader()
                .setPath( '../../../../../data/assets/test/Park2/' )
                .loadAsync( cube2Urls );

            cube2Texture.generateMipmaps = true;
            cube2Texture.minFilter = LinearMipmapLinearFilter;

            // nodes and environment

            const adjustments = {
                mix: 0.2,
                procedural: 0.2,
                intensity: 1,
                hue: 0,
                saturation: 1
            };

            const mixNode = reference( 'mix', 'float', adjustments );
            const proceduralNode = reference( 'procedural', 'float', adjustments );
            const intensityNode = reference( 'intensity', 'float', adjustments );
            const hueNode = reference( 'hue', 'float', adjustments );
            const saturationNode = reference( 'saturation', 'float', adjustments );

            const rotateY1Matrix = new Matrix4();
            const rotateY2Matrix = new Matrix4();

            const getEnvironmentNode = ( reflectNode, positionNode ) => {

                const custom1UV = reflectNode.xyz.mul( uniform( rotateY1Matrix ) );
                const custom2UV = reflectNode.xyz.mul( uniform( rotateY2Matrix ) );
                const mixCubeMaps = mix( pmremTexture( cube1Texture, custom1UV ), pmremTexture( cube2Texture, custom2UV ), positionNode.y.add( mixNode ).clamp() );

                const proceduralEnv = mix( mixCubeMaps, normalWorld, proceduralNode );

                const intensityFilter = proceduralEnv.mul( intensityNode );
                const hueFilter = hue( intensityFilter, hueNode );
                return saturation( hueFilter, saturationNode );

            };

            const blurNode = uniform( 0 );

            scene.environmentNode = getEnvironmentNode( reflectVector, positionWorld );

            scene.backgroundNode = getEnvironmentNode( positionWorldDirection, positionLocal ).context( {
                getTextureLevel: () => blurNode
            } );
        }



        function activateEnvMaps() {
            init();
        };


        this.call = {
            activateEnvMaps:activateEnvMaps
        }
    }
}

export {
    EnvironmentMaps
}