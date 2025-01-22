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
    smoothstep, time, uniform, uv,
    vec3, vec4
} from "../../../../../libs/three/Three.TSL.js";
import {
    InstancedBufferAttribute,
    Mesh, Object3D, Sprite, Texture,
    Vector3
} from "../../../../../libs/three/Three.Core.js";
import {loadImageAsset} from "../../../application/utils/DataUtils.js";
import {MATH} from "../../../application/MATH.js";

let tempCenter = new Vector3(0, 0, 0);
let tempVec = new Vector3();

class EnvironmentClouds {
    constructor(store) {
        let scene = store.scene;
        let camera = store.camera;
        let envUnifs = store.env.uniforms;

        const sunColor = uniform( envUnifs.sun );
        const fogColor = uniform( envUnifs.fog );
        const ambColor = uniform( envUnifs.ambient );

        let count = 0;

        const positions = [];

        let size = 40000;
        let height = 3000;
        let elevation = 1800;
        let layerHeight = 300;
        let clouds = 4;

        let cloudWidth = 1200;
        let cloudHeight = 1200;
        let cloudSizeVec = new Vector3(cloudWidth, cloudHeight, cloudWidth);

        let tempObj = new Object3D();

        function addCloudPuff(center, puffIndex, cloudIndex, cloudMass) {
            let offset = MATH.sillyRandomVector(puffIndex+cloudIndex);
            tempVec.copy(offset);

            let height = tempVec.y;
            let edgeness = tempVec.length();
                tempVec.y = tempVec.y*2;
            tempVec.normalize();
            tempVec.y = MATH.clamp(Math.abs(tempVec.y)-MATH.curveSqrt(edgeness*1.2) , 0, cloudHeight );
            tempVec.multiplyScalar(MATH.curveQuad(cloudMass+0.4*edgeness))
            tempVec.multiply(cloudSizeVec)
            tempVec.applyQuaternion(tempObj.quaternion)
            tempVec.add(center);
            positions.push( tempVec.x, tempVec.y, tempVec.z);
            count++;
        }

        function buildCloud(index) {
            tempObj.quaternion.set(0,  0, 0, 1)
            tempObj.rotateY(index)
            let centerX = MATH.sillyRandomBetween(-size, size, index);
            let centerZ = MATH.sillyRandomBetween(-size, size, index+2);
            let centerY = MATH.sillyRandomBetween(elevation, elevation+layerHeight, index+4);
            tempCenter.set(centerX, centerY, centerZ);
            let cloudMass = MATH.curveQuad(MATH.sillyRandomBetween(1.2, 1.4,index+1));
            let puffCount = Math.ceil(MATH.curveCube(cloudMass) * 40);
            for (let i = 0; i < puffCount; i++) {
                addCloudPuff(tempCenter, i, index, cloudMass);
            }
        }

        for (let i = 0; i < clouds; i++) {
            buildCloud(i);
        }

        const positionAttribute = new InstancedBufferAttribute( new Float32Array( positions ), 3 );


        const texture = new Texture();
        texture.generateMipmaps = false;
        function tx1Loaded(image) {
            texture.colorSpace = SRGBColorSpace;
            texture.source.data = image;
            texture.flipY = true;
            texture.needsUpdate = true;
        }
        loadImageAsset('cloud_img', tx1Loaded)




        let material = new SpriteNodeMaterial( {
            sizeAttenuation: true, texture, alphaMap: texture, alphaTest: 0.01, transparent: true } );

        material.colorNode = Fn( () => {
            const posx = positionLocal.x.mul(8)
            const posy = uv().y.mul(uv().x)
            const posz = positionLocal.z
            const sunShade = mix( fogColor, sunColor.add(vec3(0.5, 0.5, 0.5)).mul(15), min(1, max( 0, posy.pow(1.8))))
            const ambShade = mix(ambColor.mul(fogColor.normalize()), sunShade,  min(1, max( 0, posy.pow(1.2))));
            const lowShade = mix(ambColor.mul(vec3(-0.5, -0.5, 0.2)), ambShade.mul(0.3),  min(1, max( 0, uv().y.pow(0.5))));
            return vec4(lowShade, 0.5);
        })()

        material.color = store.env.fog.fog.color;
        material.depthTest = true;
        material.depthWrite = false;
        material.positionNode = instancedBufferAttribute( positionAttribute );
    //    material.rotationNode = instanceIndex.mul(0.02).mod(1).mul(0.07);
        material.scaleNode = 1800 // instanceIndex.add(200).mul(0.5);


        const particles = new Sprite( material );
        particles.frustumCulled = false;
        particles.count = count;
        console.log("Cloud Particle count", count)
        scene.add( particles );

    }

}

export { EnvironmentClouds }