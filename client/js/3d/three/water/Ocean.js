import {Mesh, PlaneGeometry, Raycaster, Vector2, Vector3} from "../../../../../libs/three/Three.Core.js";
import {SimplexNoise} from "../../../../../libs/jsm/math/SimplexNoise.js";
import {
    clamp,
    length,
    int,
    uint,
    color, cos, float,
    Fn, instancedArray, instanceIndex, max, min, negate, positionLocal,
    transformNormalToView,
    uniform,
    varyingProperty, vec2, vec3,
    vertexIndex, mul, add, sin, texture, uvec2, textureStore, vec4, normalLocal, blendColor, mix
} from "../../../../../libs/three/Three.TSL.js";
import {MeshPhongNodeMaterial} from "../../../../../libs/three/materials/nodes/NodeMaterials.js";
import {getFrame} from "../../../application/utils/DataUtils.js";
import MeshStandardNodeMaterial from "../../../../../libs/three/materials/nodes/MeshStandardNodeMaterial.js";
import {StorageTexture} from "../../../../../libs/three/Three.WebGPU.js";

class Ocean {
    constructor(store) {

        let scene = store.scene;
        let renderer = store.renderer;
        let camera = scene.camera;
        let envUnifs = store.env.uniforms;

        function generateOcean() {

            // Dimensions of simulation grid.
            const WIDTH = 64;

            // Water size in system units.
            const BOUNDS = 1024*64;
            const BOUNDS_HALF = BOUNDS * 0.5;

            const waterMaxHeight = 1;

            let mouseMoved = false;
            const mouseCoords = new Vector2();
            let effectController;

            let time = 0;

            let waterMesh, meshRay;
            let computeHeight, computeSmooth, computeSphere;

            let waveInfluence = new Vector3();

            const simplex = new SimplexNoise();


            function noise( x, y ) {

                let multR = waterMaxHeight;
                let mult = 0.025;
                let r = 0;
                for ( let i = 0; i < 15; i ++ ) {

                    r += multR * simplex.noise( x * mult, y * mult );
                    multR *= 0.53 + 0.025 * i;
                    mult *= 1.25;

                }

                return r;

            }


                effectController = {
                    mousePos: uniform( waveInfluence ).label( 'mousePos' ),
                    mouseSize: uniform( 30.0 ).label( 'mouseSize' ),
                    viscosity: uniform( 0.98 ).label( 'viscosity' ),
                    time: uniform( time ).label( 'time' ),
                    spheresEnabled: true,
                    wireframe: false
                };

                // Initialize height storage buffers
                const heightArray = new Float32Array( WIDTH * WIDTH );
                const prevHeightArray = new Float32Array( WIDTH * WIDTH );
/*
                let p = 0;
                for ( let j = 0; j < WIDTH; j ++ ) {

                    for ( let i = 0; i < WIDTH; i ++ ) {

                        const x = i * 128 / WIDTH;
                        const y = j * 128 / WIDTH;

                        const height = 1 // noise( x, y );

                        heightArray[ p ] = height;
                        prevHeightArray[ p ] = height;

                        p ++;

                    }

                }
*/
                const heightStorage = instancedArray( heightArray ).label( 'Height' );
                const prevHeightStorage = instancedArray( prevHeightArray ).label( 'PrevHeight' );

                // Get Indices of Neighbor Values of an Index in the Simulation Grid
                const getNeighborIndicesTSL = ( index ) => {

                    const width = uint( WIDTH );

                    // Get 2-D compute coordinate from one-dimensional instanceIndex. The calculation will
                    // still work even if you dispatch your compute shader 2-dimensionally, since within a compute
                    // context, instanceIndex is a 1-dimensional value derived from the workgroup dimensions.

                    // Cast to int to prevent unintended index overflow upon subtraction.
                    const x = int( index.modInt( WIDTH ) );
                    const y = int( index.div( WIDTH ) );

                    // The original shader accesses height via texture uvs. However, unlike with textures, we can't
                    // access areas that are out of bounds. Accordingly, we emulate the Clamp to Edge Wrapping
                    // behavior of accessing a DataTexture with out of bounds uvs.

                    const leftX = max( 0, x.sub( 1 ) );
                    const rightX = min( x.add( 1 ), width.sub( 1 ) );

                    const bottomY = max( 0, y.sub( 1 ) );
                    const topY = min( y.add( 1 ), width.sub( 1 ) );

                    const westIndex = y.mul( width ).add( leftX );
                    const eastIndex = y.mul( width ).add( rightX );

                    const southIndex = bottomY.mul( width ).add( x );
                    const northIndex = topY.mul( width ).add( x );

                    return { northIndex, southIndex, eastIndex, westIndex };

                };

                // Get simulation index neighbor values
                const getNeighborValuesTSL = ( index, store ) => {

                    const { northIndex, southIndex, eastIndex, westIndex } = getNeighborIndicesTSL( index );

                    const north = store.element( northIndex );
                    const south = store.element( southIndex );
                    const east = store.element( eastIndex );
                    const west = store.element( westIndex );

                    return { north, south, east, west };

                };

                // Get new normals of simulation area.
                const getNormalsFromHeightTSL = ( index, store ) => {

                    const { north, south, east, west } = getNeighborValuesTSL( index, store );

                    const normalX = ( west.sub( east ) ).mul( WIDTH / BOUNDS );
                    const normalY = ( south.sub( north ) ).mul( WIDTH / BOUNDS );

                    return { normalX, normalY };

                };

            computeHeight = Fn( () => {

                const { viscosity, mousePos, mouseSize, time } = effectController;
                const x = float( instanceIndex.modInt( WIDTH ) ).mul( 1 / WIDTH );
                const y = float( instanceIndex.div( WIDTH ) ).mul( 1 / WIDTH );
                const height = heightStorage.element( instanceIndex ).toVar();
                const prevHeight = prevHeightStorage.element( instanceIndex ).toVar();

                const { north, south, east, west } = getNeighborValuesTSL( instanceIndex, heightStorage );

                const posx = mul(x, BOUNDS)
                const posy = mul(y, BOUNDS)
                const waveA = mul(cos(add(add(mul(mousePos.z, 1.124), add(posx, posy)), posx)),0.02).add(0.02);
                const waveB = mul(sin(add(add(mul(mousePos.z, 0.835), mul(add(posx, posy), 0.8)), posy)), 0.02).add(0.02)
                const neighborHeight = north.add( south ).add( east ).add( west );
                neighborHeight.mulAssign( 0.49 );
                neighborHeight.subAssign( mul(prevHeight, 0.99).add(waveA).add(waveB) );

                const newHeight = neighborHeight.mul( viscosity ).add(0.99);

                // Get 2-D compute coordinate from one-dimensional instanceIndex.


                // Mouse influence
                const centerVec = vec2( 0.5 );
                // Get length of position in range [ -BOUNDS / 2, BOUNDS / 2 ], offset by mousePos, then scale.
                const mousePhase = clamp( length( ( vec2( x, y ).sub( centerVec ) ).mul( BOUNDS ).sub( mousePos.xy ) ).mul( Math.PI ).div( mouseSize ), 0.0, Math.PI );

                newHeight.addAssign( cos( mousePhase) ).add(2.0 ).mul( 0.1  );

                prevHeightStorage.element( instanceIndex ).assign( height );
                heightStorage.element( instanceIndex ).assign( newHeight );

            } )().compute( WIDTH * WIDTH );

                // Water Geometry corresponds with buffered compute grid.
                const waterGeometry = new PlaneGeometry( BOUNDS, BOUNDS, WIDTH - 1, WIDTH - 1 );
                // material: make a THREE.ShaderMaterial clone of THREE.MeshPhongMaterial, with customized position shader.
                const waterMaterial = new MeshStandardNodeMaterial();


            const width = 512, height = 512;

            const storageTexture = new StorageTexture( width, height );
            //storageTexture.minFilter = THREE.LinearMipMapLinearFilter;

            // create function

            const computeTexture = Fn( ( { storageTexture } ) => {

                const posX = instanceIndex.modInt( width );
                const posY = instanceIndex.div( width );
                const indexUV = uvec2( posX, posY );

                // https://www.shadertoy.com/view/Xst3zN

                const x = float( posX ).div( 50.0 );
                const y = float( posY ).div( 50.0 );

                const v1 = x.sin().abs();
                const v2 = y.sin().abs();
                const v3 = x.add( y ).sin();
                const v4 = x.mul( x ).add( y.mul( y ) ).sqrt().add( 5.0 ).sin();
                const v = v1.add( v2, v3, v4 );

                const r = v.sin().abs();
                const g = v.add( Math.PI ).sin().abs();
                const b = v.add( Math.PI ).sub( 0.5 ).sin().abs();

                textureStore( storageTexture, indexUV, vec4( r, g, b, 1 ) ).toWriteOnly();

            } );

            waterMaterial.normalNode = Fn( () => {
                const { mousePos } = effectController;
                const time = mousePos.z;
                const posx = positionLocal.x
                const posy = positionLocal.y
                const waveA = cos(add(add(mul(time, 8.5), add(posx, posy)), posx).mul(0.01));
                const waveB = sin(add(add(mul(time, 7.2), mul(add(posx, posy), 0.9)), posy).mul(0.007));

                const waveAp = waveA.add(cos(posy.mul(0.001)));
                const waveBp = waveB.add(sin(posx.mul(0.001)));

                const bigWaveNm = vec3(waveAp, 5, waveBp).normalize();

                const timeSin = time.sin();
                const timeCos = time.cos();

                const waveA1 = timeSin.mul(0.1).add(cos(add(posy.mul(0.008), posx.mul(0.013)).add(time.mul(0.2))))
                const waveB1 = timeCos.mul(0.1).add(sin(add(posx.mul(0.007), posy.mul(0.011)).add(time.mul(0.2))));

                const waveA2 = timeCos.mul(0.24).add(cos(add(posy.mul(0.02), posx.mul(0.033)).add(time.mul(0.4))))
                const waveB2 = timeSin.mul(0.22).add(cos(add(posx.mul(0.025), posy.mul(0.023)).add(time.mul(0.4))))

                const waveA3 = timeCos.mul(0.34).add(cos(add(posy.mul(0.04), posx.mul(0.13)).add(time.mul(0.45))))
                const waveB3 = timeSin.mul(0.42).add(sin(add(posx.mul(0.044), posy.mul(0.11)).add(time.mul(0.85))))

                const waveA4 = timeCos.mul(0.44).add(cos(add(posy.mul(0.082), posx.mul(0.193)).add(time.mul(0.95))))
                const waveB4 = timeSin.mul(0.52).add(sin(add(posx.mul(0.097), posy.mul(0.14)).add(time.mul(0.35))))

                const waveA5 = time.mul(0.44).sin().add(cos(add(posy.mul(0.32), posx.mul(0.293)).add(time.mul(0.75))))
                const waveB5 = time.mul(0.42).cos().add(sin(add(posx.mul(0.49), posy.mul(0.223)).add(time.mul(0.55))))

                const waveA6 = time.mul(0.24).sin().add(cos(add(posy.mul(0.52), posx.mul(0.593)).add(time.mul(0.55))))
                const waveB6 = time.mul(0.22).cos().add(sin(add(posx.mul(0.59), posy.mul(0.423)).add(time.mul(0.85))))

                const wave6Nm = vec3(waveA6, 18, waveB6).normalize();
                const wave5Nm = vec3(waveA5, 18, waveB5).normalize();
                const wave4Nm = vec3(waveA4, 14, waveB4).normalize();
                const wave3Nm = vec3(waveA3, 11, waveB3).normalize();
                const wave2Nm = vec3(waveA2, 11, waveB2).normalize();

                const wave1Nm =  vec3(waveA1, 11, waveB1).normalize();

//                const finalNm = bigWaveNm.add(mediumNm).add(detailNm).add(detail2Nm).add(detail3Nm);
                const finalNm = bigWaveNm.add(wave1Nm).add(wave2Nm).add(wave3Nm).add(wave4Nm).add(wave5Nm).add(wave6Nm);
//                finalColor.add(r.mul(0.2), 1, b.mul(0.2));

                return finalNm.normalize();

            } )();

        //    const computeTx = computeTexture( { storageTexture } ).compute( width * height );
        //    renderer.computeAsync( computeTx );

                waterMaterial.lights = true;
                waterMaterial.colorNode = mix(store.env.ambient.color, store.env.sun.color, store.env.ambient.color.b);
       //     waterMaterial.colorNode = texture( storageTexture );
            waterMaterial.metalness = 0.97;
            waterMaterial.envMapIntensity = 0.99;
            waterMaterial.roughness = 0.17;

            waterMaterial.positionNode = Fn( () => {


                    // To correct the lighting as our mesh undulates, we have to reassign the normals in the position shader.
                    const { normalX, normalY } = getNormalsFromHeightTSL( vertexIndex, heightStorage );

                    varyingProperty( 'vec3', 'v_normalView' ).assign( transformNormalToView( vec3( normalX, mul( normalY, mul(BOUNDS / WIDTH, 5.9) ).add(1.1), 1.0 ).normalize() ) );

                    return vec3( positionLocal.x, positionLocal.y, heightStorage.element( vertexIndex ) );

                } )();

                waterMesh = new Mesh( waterGeometry, waterMaterial );
                waterMesh.rotation.x = - Math.PI / 2;
                waterMesh.matrixAutoUpdate = false;
                waterMesh.updateMatrix();

                scene.add( waterMesh );


            function update(){
                time = getFrame().gameTime
             //   waveInfluence.x = Math.sin(time * 1.8)*50;
             //   waveInfluence.y = Math.cos(time * 1.3)*600;
                waveInfluence.z = time;
            //    renderer.computeAsync( computeHeight );
            }


                ThreeAPI.addPostrenderCallback(update);

        }

        generateOcean();

    }

}

export {Ocean}