import {BoxGeometry} from "../../../../../libs/three/geometries/BoxGeometry.js";
import {SpriteNodeMaterial, VolumeNodeMaterial} from "../../../../../libs/three/materials/nodes/NodeMaterials.js";
import {BackSide, LinearFilter, RedFormat, SRGBColorSpace} from "../../../../../libs/three/constants.js";
import {
    Break,
    Fn,
    If,
    instancedBufferAttribute, instanceIndex,
    materialReference,
    smoothstep, time, uniform,
    vec3
} from "../../../../../libs/three/Three.TSL.js";
import {
    Color,
    Data3DTexture,
    InstancedBufferAttribute,
    Mesh, Sprite,
    TextureLoader,
    Vector3
} from "../../../../../libs/three/Three.Core.js";
import {ImprovedNoise} from "../../../../../libs/jsm/math/ImprovedNoise.js";
import {loadImageAsset} from "../../../application/utils/DataUtils.js";

class EnvironmentClouds {
    constructor(store) {
        let scene = store.scene;
        let envUnifs = store.env.uniforms;



        const count = 10000;

        const positions = [];

        for ( let i = 0; i < count; i ++ ) {
            positions.push( 10000 * Math.random() - 5000, 500 * Math.random() + 1000, 10000 * Math.random() - 5000 );
        }

        const positionAttribute = new InstancedBufferAttribute( new Float32Array( positions ), 3 );

        // texture

    //    let map = new TextureLoader().load( 'textures/sprites/snowflake1.png' );

        function tx1Loaded(map) {
            map.colorSpace = SRGBColorSpace;

            console.log("tx Map ", map);

            let material = new SpriteNodeMaterial( { sizeAttenuation: true, map, alphaMap: map, alphaTest: 0.1, transparent: true } );
            material.color.setHSL( 1.0, 0.3, 0.7, SRGBColorSpace );
            material.positionNode = instancedBufferAttribute( positionAttribute );
            material.rotationNode = time.add( instanceIndex ).sin();
            material.scaleNode = uniform( 15 );

            // sprites

            const particles = new Sprite( material );
            particles.frustumCulled = false;
            particles.count = count;
            scene.add( particles );


        }

        loadImageAsset('ref_sphere_5', tx1Loaded)


    }

}

export { EnvironmentClouds }