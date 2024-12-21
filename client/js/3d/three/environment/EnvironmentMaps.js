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

const refSpheeTx = await new TextureLoader()
    .setPath('./../../../../data/assets/images/textures/')
    .loadAsync('ref_sphere_1.png');

            refSpheeTx.generateMipmaps = false;
            refSpheeTx.mapping = EquirectangularReflectionMapping;


            const cube1Texture = await new TextureLoader()
                .setPath('./../../../../data/assets/images/textures/')
                .loadAsync('ref_sphere_1.png');

            cube1Texture.generateMipmaps = false;
            cube1Texture.mapping = EquirectangularReflectionMapping;

            //    cube1Texture.minFilter = LinearMipmapLinearFilter;

            const cube2Texture = await new TextureLoader()
                .setPath('./../../../../data/assets/images/textures/')
                .loadAsync('ref_sphere_2.png');

            cube2Texture.generateMipmaps = false;
            cube2Texture.mapping = EquirectangularReflectionMapping;

            // nodes and environment

            const adjustments = {
                mix: 0.8,
                procedural: 0.3,
                intensity: 0.8,
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

            scene.backgroundNode = getEnvironmentNode( positionWorldDirection, positionLocal );
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