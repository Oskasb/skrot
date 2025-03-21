import {
    BufferAttribute,
    DoubleSide, FrontSide, InstancedBufferAttribute,
    Mesh, Object3D,
    PlaneGeometry,
    Raycaster, Sprite, SRGBColorSpace, Texture,
    Vector2,
    Vector3
} from "../../../../../libs/three/Three.Core.js";
import {
    clamp,
    length,
    int,
    uint,
    time,
    color,
    cos,
    float,
    Fn,
    instancedArray,
    instanceIndex,
    max,
    min,
    negate,
    positionLocal,
    transformNormalToView,
    uniform,
    varyingProperty,
    positionWorld,
    positionView,
    vec2,
    vec3,
    vertexIndex,
    mul,
    add,
    sin,
    texture,
    uvec2,
    textureStore,
    vec4,
    normalLocal,
    blendColor,
    mix,
    floor,
    uv,
    sign,
    instancedBufferAttribute, ceil, round, dot, varying
} from "../../../../../libs/three/Three.TSL.js";
import {MeshPhongNodeMaterial, SpriteNodeMaterial} from "../../../../../libs/three/materials/nodes/NodeMaterials.js";
import {getFrame, loadImageAsset} from "../../../application/utils/DataUtils.js";
import MeshStandardNodeMaterial from "../../../../../libs/three/materials/nodes/MeshStandardNodeMaterial.js";
import {ENUMS} from "../../../application/ENUMS.js";
import {evt} from "../../../application/event/evt.js";
import {MATH} from "../../../application/MATH.js";
import {poolFetch} from "../../../application/utils/PoolUtils.js";
import {customOceanUv, customTerrainUv, getWorldBoxMax, terrainGlobalUv} from "../terrain/ComputeTerrain.js";
import {loadAssetMaterial} from "../../../application/utils/AssetUtils.js";
import {activateWorldEffects} from "../assets/WorldEffect.js";

let heightTx;

const tempObj = new Object3D()

class Ocean {
    constructor(store) {


        const WORLD_BOX_MAX = getWorldBoxMax();

        const scene = store.scene;
        const renderer = store.renderer;
        const camera = scene.camera;
        const envUnifs = store.env.uniforms;

        const TILE_SIZE = 10;
        const WIDTH = 100;
        const BOUNDS = WIDTH*TILE_SIZE;
        const BOUNDS_TILES = BOUNDS * TILE_SIZE;
        const camPos = new Vector3();

        const foamArray = new Float32Array( BOUNDS * BOUNDS );
        const foamStorage = instancedArray( foamArray ).label( 'Foam' );

        const splashCount = 500;

        const splashPosition = uniform( new Vector3() );
        const splashVelocity = uniform( new Vector3() );
        const splashNormal = uniform( new Vector3() );
        const splashIndex = uniform(0)

        const positionBuffer = instancedArray( splashCount, 'vec3' );
        const velocityBuffer = instancedArray( splashCount, 'vec3' );
        const scaleBuffer = instancedArray( splashCount);
        const sizeBuffer = instancedArray( splashCount);
        const ageBuffer = instancedArray( splashCount);
        const sunColor = uniform( envUnifs.sun );
        const fogColor = uniform( envUnifs.fog );
        const ambColor = uniform( envUnifs.ambient );
        const tpf = uniform(0.01);
        const hitDot = uniform(1);
        const ONE = uniform(1);
        const ZERO = uniform(0);
        const duration = uniform(3)


        function generateOcean(matSettings) {
            const waterMaterial = matSettings.material;
            console.log("Gen Ocean", matSettings, store.scene)
            // Dimensions of simulation grid.

        //    return;
        //    waterMaterial.envNode = store.scene.getEnvNode();
            let effectController;

            let p = 0;

            for ( let j = 0; j < BOUNDS; j ++ ) {
                for ( let i = 0; i < BOUNDS; i ++ ) {
                    let foam = 0;
                    foamArray[ p ] = foam;
                    p ++;
                }
            }

            let waterMesh, meshRay;

            let waveInfluence = new Vector3();

                effectController = {
                    mousePos: uniform( waveInfluence ).label( 'mousePos' ),
                    mouseSize: uniform( 30.0 ).label( 'mouseSize' ),
                    viscosity: uniform( 0.98 ).label( 'viscosity' ),
                    camPos: uniform(camPos).label( 'camPos' ),
                    spheresEnabled: true,
                    wireframe: false
                };


                // Water Geometry corresponds with buffered compute grid.
                const waterGeometry = new PlaneGeometry( 1, 1, WIDTH - 1, WIDTH - 1 );
                // material: make a THREE. = ShaderMaterial clone of THREE.MeshPhongMaterial, with customized position shader.

            waterMaterial.side = FrontSide;

            const nmTx = texture(waterMaterial.normalMap);
            waterMaterial.normalMap = null;

            waterMaterial.normalNode = Fn( () => {

                const posNode = positionLocal;
                const posx = posNode.y.add( posNode.y.mul(0.6).add(posNode.x).mul(0.02).sin().mul(20))
                const posy = posNode.x.add(posNode.y.mul(0.01).cos().mul(20))

                const wideWaveA = time.add(posx.add(posy.mul(0.0132)).div(0.15)).mul(0.013).sin();
                const wideWaveB =  time.mul(0.9).add(posy.add(posx.mul(0.0115)).div(0.11)).mul(0.012).cos();

                const waveAx = time.mul(0.9).add(posx.add(posy.mul(0.332)).div(0.45)).mul(0.33).sin().add(wideWaveA.mul(0.5));
                const waveBx = time.add(posy.add(posx.mul(0.135)).div(0.16)).mul(0.12).cos().add(wideWaveB.mul(0.5));

                const waveAx1 = time.add(waveAx.mul(0.24).add(posy.add(posx.mul(0.16)).mul(0.22)).div(2)).mul(0.23).cos();
                const waveBx1 = time.mul(2).add(waveBx.mul(0.12).add(posx.add(posy.mul(0.04)).mul(0.45)).div(1.2)).mul(0.7).sin();
                const waveAx2 = time.mul(5).add(waveAx.mul(0.14).add(posy.add(wideWaveA.mul(0.5)).mul(0.42)).div(3.2)).mul(0.13).cos();
                const waveBx2 = time.mul(3).add(waveBx.mul(0.09).add(posx.add(wideWaveB.mul(0.5)).mul(0.55)).div(7.5)).mul(0.7).sin();



                const wave0nm = vec3(waveAx1.add(waveAx2.mul(0.6)).add(wideWaveA.mul(0.8)), waveBx1.add(waveBx2.mul(0.6)).add(wideWaveB.mul(0.8)), 7).normalize();

                const txNormal = nmTx.sample(customOceanUv()).mul(2).sub(1)
                return transformNormalToView(txNormal.add(wave0nm).mul(0.5)) //.add(txNormal).normalize()); // vec3(txNormal.x, txNormal.z, txNormal.y) // transformNormalToView(vec3(txNormal.x, txNormal.z, txNormal.y));
            } )();


            function oceanFoam() {

                //const localPos = instancePosition //Local;
                //const camPos = positionWorld;
                const vPosition = varyingProperty( 'vec3', 'v_positionFinal' );
                const posx = vPosition.x //.sub(positionWorld.x)
                const posy = vPosition.y //.sub(positionWorld.z)
                const offset = posx.mul(0.3).add(posy.mul(0.3))
                const timeSin = time.mul(0.2).sin();
                return timeSin.mul(0.2);

                const waveA = cos(add(add(mul(timeSin, 4), add(posx, posy)), posx).mul(0.5));
                const waveB = sin(add(add(mul(timeSin, 4), mul(add(posx, posy), 1.1)), posy).mul(0.5));

                const waveAx = posx.add(time.add(posy.mul(0.1)).cos().mul(0.05));
                const waveBx = posy.add(time.add(posx.mul(0.1)).sin().mul(0.05));

                const waveSum = timeSin.mul(1.0).sub(0.5) // waveA.add(waveB) // .add(waveAx).add(waveBx);

                const indexX = min(BOUNDS, max(0, waveAx.mod(BOUNDS_TILES).div(TILE_SIZE)));
                const indexY = min(BOUNDS, max(0, waveBx.mod(BOUNDS_TILES).div(TILE_SIZE)));
                const indXFloor = floor(indexX)
                const indYFloor = floor(indexY)
                const tileDx = indexX.sub(indXFloor);
                const tileDy = indexY.sub(indYFloor);
                const uvIndex = indXFloor.mul(indYFloor)
                const foamMax = foamStorage.element( uvIndex );
                return waveSum;
                const foamFade = max(0, foamMax.mul(tileDx.mul(3.14).sin().mul(tileDy.mul(3.14).sin())));
                const modulate = foamFade.mul(time.mul(0.8).sin().add(posx.mul(2.6).sin().add(posy.mul(2.6).sin())).abs());
                const bubbleMod = time.mul(0.4).sin().add(1).mul(0.5).mul(22)

                const foam = max(0, foamFade.mul(tileDx.mul(bubbleMod).add(posx).sin().mul(tileDy.mul(bubbleMod).add(posy).sin()))).add(modulate);
                return foam;
                // return max(foam, min(1, height.mul(add(waveA.add(1).add(waveB.add(1)).mul(0.5), 2)).mul(4)));
            }

                waterMaterial.lights = true

                waterMaterial.rougnessNode_ = Fn( () => {

                    const posNode = positionLocal;
                    const posx = posNode.y
                    const posy = posNode.x
                    const shoreness = oceanShoreness();
                    const waveAx = posx.add(time.add(posy.mul(0.1)).cos().mul(5));
                    const waveBx = posy.add(time.add(posx.mul(0.1)).sin().mul(5));
                    const indexX = min(BOUNDS, max(0, waveAx.mod(BOUNDS_TILES).div(TILE_SIZE)));
                    const indexY = min(BOUNDS, max(0, waveBx.mod(BOUNDS_TILES).div(TILE_SIZE)));
                    const indXFloor = floor(indexX)
                    const indYFloor = floor(indexY)
                    const tileDx = indexX.sub(indXFloor);
                    const tileDy = indexY.sub(indYFloor);
                    const uvIndex = indXFloor.mul(indYFloor)
                    const foamMax = foamStorage.element( uvIndex );

                    const foamFade = max(0, foamMax.mul(tileDx.mul(3.14).sin().mul(tileDy.mul(3.14).sin())));
                    const modulate = foamFade.mul(time.mul(0.8).sin().add(posx.mul(2.6).sin().add(posy.mul(2.6).sin())).abs());
                    const bubbleMod = time.mul(0.4).sin().add(1).mul(0.5).mul(22)

                    const foam = max(0, foamFade.mul(tileDx.mul(bubbleMod).add(posx).sin().mul(tileDy.mul(bubbleMod).add(posy).sin()))).add(modulate).add(shoreness);

                    return foam;

                } )();


            waterMaterial.positionNode = Fn( () => {
                const { camPos } = effectController;
            //    const index = vertexIndex.toVar();
            //    const xIndex = floor(index.div(WIDTH));
            //    const yIndex = floor(index.sub(xIndex.mul(WIDTH)));
                const uvX = positionLocal.x // xIndex.div(WIDTH).sub(0.5)
                const uvY = positionLocal.y // yIndex.div(WIDTH).sub(0.5)
                const pX = uvX.mul(BOUNDS)
                const pZ = uvY.mul(BOUNDS)
                const camOffsetPos = vec3(floor(camPos.x.div(TILE_SIZE)).mul(TILE_SIZE), 0 , floor(camPos.z.div(TILE_SIZE)).mul(TILE_SIZE));
                const globalPos = vec3(pX, 0, pZ).add(camOffsetPos);

                const bnd = vec3(BOUNDS, 1, TILE_SIZE);

                const cX = bnd.y.sub(uvX.mul(2.2).abs()); // ;
                const cZ = bnd.y.sub(uvY.mul(2.2).abs());

                const edgeX = uvX.mul(uvX.abs().mul(2.2).pow(100).mul(100));
                const edgeZ = uvY.mul(uvY.abs().mul(2.2).pow(100).mul(100));

                const centerNess = max(0, cX.mul(cZ));

                const gain = 2;

                const height = time.add(pX.sub(camOffsetPos.x).mul(bnd.z.mul(3))).sin().add(pZ.sub(camOffsetPos.z).mul(bnd.z.mul(2))).cos().mul(gain);
                varyingProperty( 'vec3', 'v_normalView' ).assign(transformNormalToView( vec3(0.5, 0.5, height.mul(centerNess).div(gain)).normalize())  );


                const vPosition = vec3( globalPos.x.add(edgeX), globalPos.z.add(edgeZ), height.mul(centerNess));
                varyingProperty( 'vec3', 'v_positionFinal' ).assign(vPosition);
                varyingProperty( 'float', 'foam' ).assign(oceanFoam());
                return vPosition;

            } )()

                waterMesh = new Mesh( waterGeometry, waterMaterial );
                waterMesh.rotation.x = - Math.PI / 2;
                waterMesh.matrixAutoUpdate = false;
                waterMesh.frustumCulled = false;
                waterMesh.castShadow = false;
                waterMesh.receiveShadow = true;
                waterMesh.updateMatrix();
                scene.add( waterMesh );

        }

        loadAssetMaterial('material_ocean', generateOcean)


        function setupSplashes() {

            const texture = new Texture();
            texture.generateMipmaps = false;
            function tx1Loaded(image) {
                texture.colorSpace = SRGBColorSpace;
                texture.source.data = image;
                texture.flipY = false;
                texture.needsUpdate = true;
            }
            loadImageAsset('splash_img', tx1Loaded)

            const splashMaterial = new SpriteNodeMaterial( {
                sizeAttenuation: true, map:texture, alphaMap: texture, alphaTest: 0.01, transparent: true } );

            splashMaterial.colorNode = Fn( () => {
                const posx = positionLocal.x
                const posy = uv().y
                const posz = positionLocal.z
                const mod = time.mul(0.05).add( instanceIndex.mul(4.5)).sin().add(1.0);
                const sunShade = mix( fogColor, sunColor, min(1, max( 0, posy.pow(mod.add(4.8)))));
                const ambShade = mix(ambColor.mul(fogColor.normalize()), sunShade.mul(2),  min(1, max( 0, posy.pow(1.8))));
                const lowShade = mix(ambColor.mul(0.05), ambShade,  min(1, max( 0, posy.pow(0.6))));
                const age = ageBuffer.element(instanceIndex);
                return vec4(lowShade, mod.sin().add(1.2).mul(duration.sub(age)).mul(0.4));
            })()

            const computeUpdate = Fn( () => {

                const position = positionBuffer.element( instanceIndex );
                const velocity = velocityBuffer.element( instanceIndex );

                velocity.addAssign( vec3( 0.00, ZERO.sub(tpf.mul(splashIndex.cos().add(1.5).mul(1.5))), 0.00 ) );
                position.addAssign( velocity.mul(tpf));
                velocity.mulAssign( ONE.sub(tpf.mul(0.6)) );

                const scale = scaleBuffer.element(instanceIndex);
                const size = sizeBuffer.element(instanceIndex);
                const age = ageBuffer.element(instanceIndex);
                age.assign(age.add(tpf));
                scale.assign(max(0, size.mul(age.pow(0.2).mul(duration.sub(age.div(duration))))))
            } );

            const computeClearSplashes = Fn( () => {

                const foam = foamStorage.element(instanceIndex);
                foamStorage.element(instanceIndex).assign(foam.mul(0.99))

            } )().compute( foamArray.length );

            const applySplash = Fn( () => {

                const splashIndexY = floor(splashPosition.x.mod(BOUNDS_TILES).div(TILE_SIZE));
                const splashIndexX = floor(splashPosition.z.mul(-1).mod(BOUNDS_TILES).div(TILE_SIZE));
                const splashPosIndex = splashIndexX.mul(splashIndexY);
                const foam = foamStorage.element(splashPosIndex)
                foamStorage.element(splashPosIndex).assign(foam.add(0.1).pow(0.5));

                /*
                const randomPick = mul(BOUNDS_TILES, BOUNDS_TILES);
                const random = uv().dot(vec2(12.9898,78.233).mul(43758.5453123)).add(1).mul(0.5);
                const rndSelect = floor(randomPick.mul(random));
                foamStorage.element(rndSelect).assign(0.2);
*/
                const up = vec3(0, 0.05, 0);

                const hitSpeed = splashVelocity.length().mul(splashIndex.sin().add(1.5).mul(0.5));

                const position = positionBuffer.element( splashIndex );
                position.assign(splashPosition);
                const velocity = velocityBuffer.element( splashIndex );
                velocity.assign( splashNormal.add(up.mul(hitDot.add(0.05))).mul(hitSpeed).mul(0.25).add(splashVelocity.mul(1.2)));
                const scale = scaleBuffer.element(splashIndex);
                const size = sizeBuffer.element(splashIndex);
                size.assign(hitDot.mul(hitSpeed).add(hitDot).add(splashIndex.sin().add(2)).div(duration).mul(0.5))
                scale.assign(0);

                const age = ageBuffer.element(splashIndex);
                age.assign(0);

            } )().compute( 1 );

            const computeSplashes = computeUpdate().compute( splashCount );

            splashMaterial.color = store.env.fog.fog.color;
            splashMaterial.depthTest = true;
            splashMaterial.depthWrite = false;

            splashMaterial.positionNode = positionBuffer.toAttribute();

            splashMaterial.rotationNode = sizeBuffer.toAttribute().mul(99).add(time.sin().mul(0.1));
            splashMaterial.scaleNode = scaleBuffer.toAttribute();

            const particles = new Sprite( splashMaterial );
            particles.frustumCulled = false;
            particles.castShadow = false;
            particles.receiveShadow = false;
            particles.count = splashCount;
            console.log("Splash Particle count", splashCount)
            scene.add( particles );

        //    splashPositionAttribute.addUpdateRange(0, splashCount)

            let lastIndex = 0;

            let lingerChance = 0;

            function splashWater(e) {
                /*
                splashPosition.value.copy( e.pos );
                splashVelocity.value.copy( e.velocity );
                splashNormal.value.copy( e.normal )
                splashIndex.value = lastIndex;
                hitDot.value = e.hitDot;
                lastIndex++;
                if (lastIndex > splashCount) {
                    lastIndex = 0;
                }
                renderer.computeAsync( applySplash );
*/

                tempObj.up.copy(e.normal).multiplyScalar(8.6);
                tempObj.position.set(0, 0, 0);
                tempObj.lookAt(e.velocity);
                tempObj.position.copy(e.pos);
                tempObj.position.add(e.normal)

                activateWorldEffects(tempObj, splashList)

                if (Math.random() < lingerChance * e.hitDot) {
                    tempObj.up.y = 0;
                    e.velocity.y = 0;
                    tempObj.position.y+=0.25+Math.random();
                    tempObj.lookAt(e.velocity);
                    activateWorldEffects(tempObj, splashLingerList)
                    lingerChance = 0.002
                } else {
                    lingerChance += 0.0002
                }

            }
            const splashList = ['particles_splash_water']
            const splashLingerList = ['particles_splash_water_linger']
            evt.on(ENUMS.Event.SPLASH_OCEAN, splashWater)

            function update(){

                tpf.value = getFrame().tpf;

                let camera = ThreeAPI.getCamera();
                if (camera) {
                    let x= Math.floor(camera.position.x / TILE_SIZE);
                    let z = Math.floor(camera.position.z / TILE_SIZE);
                    camPos.x = x*TILE_SIZE;
                    camPos.z = -z*TILE_SIZE;
                }

                renderer.computeAsync( computeSplashes );
                if (Math.random() < (tpf.value * 4)) {
                    renderer.computeAsync( computeClearSplashes )
                }
            }

            ThreeAPI.addPostrenderCallback(update);

        }

        setupSplashes()

    }

}


export {
    Ocean
}