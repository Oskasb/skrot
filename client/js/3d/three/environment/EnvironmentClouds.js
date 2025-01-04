import {BoxGeometry} from "../../../../../libs/three/geometries/BoxGeometry.js";
import {SpriteNodeMaterial, VolumeNodeMaterial} from "../../../../../libs/three/materials/nodes/NodeMaterials.js";
import {BackSide, LinearFilter, RedFormat, SRGBColorSpace} from "../../../../../libs/three/constants.js";
import {
    add,
    Break,
    Fn,
    If,
    instancedBufferAttribute, instanceIndex,
    materialReference, max, min, mix, positionLocal,
    smoothstep, time, uniform,
    vec3, vec4
} from "../../../../../libs/three/Three.TSL.js";
import {
    Color,
    Data3DTexture,
    InstancedBufferAttribute,
    Mesh, Sprite, Texture,
    TextureLoader,
    Vector3
} from "../../../../../libs/three/Three.Core.js";
import {ImprovedNoise} from "../../../../../libs/jsm/math/ImprovedNoise.js";
import {loadImageAsset} from "../../../application/utils/DataUtils.js";

class EnvironmentClouds {
    constructor(store) {
        let scene = store.scene;
        let camera = store.camera;
        let envUnifs = store.env.uniforms;

        const sunColor = uniform( envUnifs.sun );
        const fogColor = uniform( envUnifs.fog );
        const ambColor = uniform( envUnifs.ambient );

        const count = 1600;

        const positions = [];

        for ( let i = 0; i < count; i ++ ) {
            let x = 100000 * Math.random() - 50000;
            let y = 7500 * Math.random() * Math.random() + 3000;
            let z = 100000 * Math.random() - 50000
            positions.push( x, y, z);
            i++
            x += 300 * Math.random() - 150;
            y += 100 * Math.random() - 20;
            z += 300 * Math.random() - 150;
            positions.push( x, y, z);
            i++
            x += 300 * Math.random() - 150;
            y += 500 * Math.random() * Math.random() - 20;
            z += 300 * Math.random() - 150;
            positions.push( x, y, z);
            i++
            x += 200 * Math.random() - 100;
            y += 600 * Math.random() * Math.random()  - 40;
            z += 200 * Math.random() - 100;
            positions.push( x, y, z);
            i++
            x += 300 * Math.random() - 150;
            y += 100 * Math.random() - 250;
            z += 300 * Math.random() - 150;
            positions.push( x, y, z);
            i++
            x += 300 * Math.random() - 150;
            y += 100 * Math.random() * Math.random() - 250;
            z += 300 * Math.random() - 150;
            positions.push( x, y, z);
        }

        const positionAttribute = new InstancedBufferAttribute( new Float32Array( positions ), 3 );

        // texture

    //    let map = new TextureLoader().load( 'textures/sprites/snowflake1.png' );

        const texture = new Texture();
        texture.generateMipmaps = false;
        function tx1Loaded(image) {
            texture.colorSpace = SRGBColorSpace;
            texture.source.data = image;
            texture.flipY = false;
            texture.needsUpdate = true;
        }
        loadImageAsset('cloud_img', tx1Loaded)




        let material = new SpriteNodeMaterial( {
            sizeAttenuation: true, texture, alphaMap: texture, alphaTest: 0.02, transparent: true } );

        material.colorNode = Fn( () => {
            const posx = positionLocal.x
            const posy = positionLocal.y
            const posz = positionLocal.z
            const mod = posx.add(instanceIndex.mul(2).add(posx.mul(3))).sin().abs()
            const ambShade = mix( ambColor, fogColor, min(1, max( 0, posy.pow(mod.mul(5)).mul(0.65).add(0.35))));
            const sunShade = mix(ambShade, sunColor,  min(1, max( 0, posy.pow(0.76))));
            return sunShade;
        })()

        material.color = store.env.fog.fog.color;
        material.depthTest = true;
        material.depthWrite = false;
        material.positionNode = instancedBufferAttribute( positionAttribute );
        material.rotationNode = time.add( instanceIndex.mul(2.1) ).sin().mul(0.07);
        material.scaleNode = time.add( instanceIndex.mul(2.4) ).sin().mul(0.08).add(1.1).mul(5200);

        // sprites

        const particles = new Sprite( material );
        particles.frustumCulled = false;
        particles.count = count;
        scene.add( particles );

    }

}

export { EnvironmentClouds }