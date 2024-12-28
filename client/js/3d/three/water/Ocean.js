import {Mesh, PlaneGeometry, Raycaster, Vector2} from "../../../../../libs/three/Three.Core.js";
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
    vertexIndex
} from "../../../../../libs/three/Three.TSL.js";
import {MeshPhongNodeMaterial} from "../../../../../libs/three/materials/nodes/NodeMaterials.js";

class Ocean {
    constructor(store) {

        let scene = store.scene;
        let renderer = store.renderer;
        let camera = scene.camera;
        let envUnifs = store.env.uniforms;

        function generateOcean() {

            // Dimensions of simulation grid.
            const WIDTH = 128;

            // Water size in system units.
            const BOUNDS = 1024*8;
            const BOUNDS_HALF = BOUNDS * 0.5;

            const waterMaxHeight = 10;

            let mouseMoved = false;
            const mouseCoords = new Vector2();
            let effectController;

            let waterMesh, meshRay;
            let computeHeight, computeSmooth, computeSphere;


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
                    mousePos: uniform( new Vector2( 10000, 10000 ) ).label( 'mousePos' ),
                    mouseSize: uniform( 30.0 ).label( 'mouseSize' ),
                    viscosity: uniform( 0.95 ).label( 'viscosity' ),
                    spheresEnabled: true,
                    wireframe: false
                };

                // Initialize height storage buffers
                const heightArray = new Float32Array( WIDTH * WIDTH );
                const prevHeightArray = new Float32Array( WIDTH * WIDTH );

                let p = 0;
                for ( let j = 0; j < WIDTH; j ++ ) {

                    for ( let i = 0; i < WIDTH; i ++ ) {

                        const x = i * 128 / WIDTH;
                        const y = j * 128 / WIDTH;

                        const height = noise( x, y );

                        heightArray[ p ] = height;
                        prevHeightArray[ p ] = height;

                        p ++;

                    }

                }

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

                const { viscosity, mousePos, mouseSize } = effectController;

                const height = heightStorage.element( instanceIndex ).toVar();
                const prevHeight = prevHeightStorage.element( instanceIndex ).toVar();

                const { north, south, east, west } = getNeighborValuesTSL( instanceIndex, heightStorage );

                const neighborHeight = north.add( south ).add( east ).add( west );
                neighborHeight.mulAssign( 0.5 );
                neighborHeight.subAssign( prevHeight );

                const newHeight = neighborHeight.mul( viscosity );

                // Get 2-D compute coordinate from one-dimensional instanceIndex.
                const x = float( instanceIndex.modInt( WIDTH ) ).mul( 1 / WIDTH );
                const y = float( instanceIndex.div( WIDTH ) ).mul( 1 / WIDTH );

                // Mouse influence
                const centerVec = vec2( 0.5 );
                // Get length of position in range [ -BOUNDS / 2, BOUNDS / 2 ], offset by mousePos, then scale.
                const mousePhase = clamp( length( ( vec2( x, y ).sub( centerVec ) ).mul( BOUNDS ).sub( mousePos ) ).mul( Math.PI ).div( mouseSize ), 0.0, Math.PI );

                newHeight.addAssign( cos( mousePhase ).add( 1.0 ).mul( 0.28 ) );

                prevHeightStorage.element( instanceIndex ).assign( height );
                heightStorage.element( instanceIndex ).assign( newHeight );

            } )().compute( WIDTH * WIDTH );

                // Water Geometry corresponds with buffered compute grid.
                const waterGeometry = new PlaneGeometry( BOUNDS, BOUNDS, WIDTH - 1, WIDTH - 1 );
                // material: make a THREE.ShaderMaterial clone of THREE.MeshPhongMaterial, with customized position shader.
                const waterMaterial = new MeshPhongNodeMaterial();

                waterMaterial.lights = true;
                waterMaterial.colorNode = color( 0x0040C0 );
                waterMaterial.specularNode = color( 0x111111 );
                waterMaterial.shininess = Math.max( 50, 1e-4 );
                waterMaterial.positionNode = Fn( () => {

                    // To correct the lighting as our mesh undulates, we have to reassign the normals in the position shader.
                    const { normalX, normalY } = getNormalsFromHeightTSL( vertexIndex, heightStorage );

                    varyingProperty( 'vec3', 'v_normalView' ).assign( transformNormalToView( vec3( normalX, negate( normalY ), 1.0 ) ) );

                    return vec3( positionLocal.x, positionLocal.y, heightStorage.element( vertexIndex ) );

                } )();

                waterMesh = new Mesh( waterGeometry, waterMaterial );
                waterMesh.rotation.x = - Math.PI / 2;
                waterMesh.matrixAutoUpdate = false;
                waterMesh.updateMatrix();

                scene.add( waterMesh );



            renderer.computeAsync( computeHeight );


        }

        generateOcean();

    }

}

export {Ocean}