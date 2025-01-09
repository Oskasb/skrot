
import {getFrame, loadImageAsset, loadModelAsset} from "../../../application/utils/DataUtils.js";
import {CanvasTexture, Mesh, Object3D, PlaneGeometry, Vector3} from "../../../../../libs/three/Three.Core.js";
import MeshStandardNodeMaterial from "../../../../../libs/three/materials/nodes/MeshStandardNodeMaterial.js";
import {
    floor,
    Fn, instancedArray,
    instanceIndex,
    max,
    positionLocal,
    time,
    uv,
    varyingProperty,
    vec3, vec4
} from "../../../../../libs/three/Three.TSL.js";
import {vertexIndex} from "../../../../../libs/three/nodes/core/IndexNode.js";
import {loadAsset} from "../../../application/utils/AssetUtils.js";
import {DoubleSide, DynamicDrawUsage, InstancedMesh} from "three";
import {mix, uniform} from "three/tsl";
import {evt} from "../../../application/event/evt.js";
import {ENUMS} from "../../../application/ENUMS.js";
import {aaBoxTestVisibility, borrowBox} from "../../../application/utils/ModelUtils.js";

let heightCanvas = document.createElement('canvas');
let heightmapContext;
let heightData;
let width;
let height;
let terrainGeometry;
let terrainMaterial;
let tilesMaterial;
let tile32mesh;
let terrainMesh;
const TILE_SIZE = 10;
let TILES_X;
let TILES_Y;
let BOUND_TILES;



const GEO_SEGS_XY = 32;
let SECTIONS_XY;

const HEIGHT_MIN =4 // -30;

const centerSize = 30;
const lodLayers = 5;
const gridOffsets = [[-1, -1], [-1, 0], [-1, 1], [0, -1], [0, 1], [1, -1], [1, 0], [1, 1]]
const layerScale = [1, 3, 9, 27, 81, 243]
let tempPoint = new Vector3();


const dummy = new Object3D();

const camPos = new Vector3();

const tilePosition = uniform( new Vector3() );
const tileScale = uniform( new Vector3() );
const tileIndex = uniform(0)

class ComputeTerrain {

    constructor(store) {

        let positionBuffer;
        let scaleBuffer;

        let renderer = store.renderer;
        const scaleFactor = centerSize*TILE_SIZE;
        const gridCenter = uniform(camPos, 'vec3');
        let tileGeo;


        const applyTileUpdate = Fn( () => {

            const tilePX = tilePosition.x;
            const tilePY = tilePosition.y;
            const tilePZ = tilePosition.z;

            const tileScaleX = tileScale.x;
            const tileScaleZ = tileScale.z;


        //    const position = positionBuffer.element( tileIndex );
        //    position.assign(vec3(0, 0, 0));

        //    let local = positionLocal;
        //    positionLocal.assign(vec3(local.x, 100, local.z));
        //    varyingProperty( 'vec3', 'v_normalView' ).assign( vec3(1, 100, 1 ))

        //    const scale = scaleBuffer.element( tileIndex );
        //    scale.assign(vec3(100, 1, 100))
        } )().compute( 1 );

        function updateTile(dummy, index) {
            tilePosition.value.copy( dummy.position );
            tileScale.value.copy( dummy.scale );
            tileIndex.value = index;
            renderer.computeAsync( applyTileUpdate );
        }

        function update(){

            let camera = ThreeAPI.getCamera();
            if (camera) {
                let x= Math.floor(camera.position.x / TILE_SIZE) * TILE_SIZE;
                let z = Math.floor(camera.position.z / TILE_SIZE) * TILE_SIZE;


                dummy.position.set(x, HEIGHT_MIN, z);
                dummy.scale.set(TILE_SIZE, 1, TILE_SIZE);

                tempPoint.copy(dummy.position);
                tempPoint.y = 20;
                let tileCount = 0;
                let visible = aaBoxTestVisibility(dummy.position, dummy.scale.x*centerSize+1, 2000, dummy.scale.z*centerSize+1)
                if (visible) {
                    updateTile(dummy, tileCount);
                    evt.dispatch(ENUMS.Event.DEBUG_DRAW_CROSS, {pos:dummy.position, size:7, color:'GREEN'})
                    evt.dispatch(ENUMS.Event.DEBUG_DRAW_LINE, {from:tempPoint, to:dummy.position, color:'CYAN'})
                //    let borrowedBox = borrowBox();
                //    evt.dispatch(ENUMS.Event.DEBUG_DRAW_AABOX, {min:borrowedBox.min, max:borrowedBox.max, color:'GREEN'})

                    dummy.updateMatrix();
                    tile32mesh.setMatrixAt(tileCount, dummy.matrix);
                    tileCount++
                }


                for (let l = 0; l < lodLayers; l++) {
                    let lodLayer = l;
                    for (let i = 0; i < gridOffsets.length; i++) {
                        let lodScale = layerScale[lodLayer];

                        let tx = x + scaleFactor*gridOffsets[i][0]*lodScale;
                        let tz = z + scaleFactor*gridOffsets[i][1]*lodScale
                        dummy.position.set(tx, HEIGHT_MIN, tz);


                        dummy.scale.set(TILE_SIZE*lodScale, 1, TILE_SIZE*lodScale);

                        visible = aaBoxTestVisibility(dummy.position, dummy.scale.x*centerSize, 2000, dummy.scale.z*centerSize)
                        if (visible) {
                            updateTile(dummy, tileCount);
                            evt.dispatch(ENUMS.Event.DEBUG_DRAW_CROSS, {pos:dummy.position, size:lodScale*4, color:'CYAN'})
                            evt.dispatch(ENUMS.Event.DEBUG_DRAW_LINE, {from:tempPoint, to:dummy.position, color:'CYAN'})
                       //     let borrowedBox = borrowBox();
                       //     evt.dispatch(ENUMS.Event.DEBUG_DRAW_AABOX, {min:borrowedBox.min, max:borrowedBox.max, color:'RED'})
                            dummy.updateMatrix();
                            tile32mesh.setMatrixAt(tileCount, dummy.matrix);
                            tileCount++
                        } else {
                            evt.dispatch(ENUMS.Event.DEBUG_DRAW_LINE, {from:tempPoint, to:dummy.position, color:'RED'})
                        }
                    }
                }


                if (camPos.x !== x*TILE_SIZE || camPos.z !== z*TILE_SIZE) {

                    tileGeo.count = tileCount;
                    camPos.x = x*TILE_SIZE;
                    camPos.z = z*TILE_SIZE;
                //    renderer.computeAsync( computeTiles().compute( tileCount ) );
                }
            }
        }


        const computeTiles = Fn( () => {

            const position = positionBuffer.element( instanceIndex );
            position.assign(vec3( 0, 0, 0));

            const origin = gridCenter;


        } );


        let tileCount = 0;

        function setupTerrain(tiles32geo) {
            BOUND_TILES = heightData.length / 4;
            TILES_X = Math.sqrt(BOUND_TILES);
            TILES_Y = Math.sqrt(BOUND_TILES);

            SECTIONS_XY = TILES_X / GEO_SEGS_XY;

            tileCount = 1;

            for (let l = 0; l < lodLayers; l++) {
                for (let i = 0; i < gridOffsets.length; i++) {
                    tileCount++
                }
            }

            tileGeo = tiles32geo.scene.children[0].geometry;
        //    tileGeo.computeVertexNormals();
            console.log("Setup Terrain geo:", SECTIONS_XY, tileGeo)


            terrainGeometry = new PlaneGeometry( TILES_X*TILE_SIZE, TILES_Y*TILE_SIZE, TILES_X - 1, TILES_Y - 1 );
            terrainMaterial = new MeshStandardNodeMaterial();
            tilesMaterial = new MeshStandardNodeMaterial();
            tilesMaterial.side = DoubleSide;
            positionBuffer = instancedArray( tileCount, 'vec3' );
            scaleBuffer = instancedArray( tileCount, 'vec3' );
        //    tilesMaterial.positionNode = positionBuffer.toAttribute();
        //    tilesMaterial.scaleNode = scaleBuffer.toAttribute();


            tilesMaterial.positionNode = Fn( () => {
                let localPos = positionLocal;

                return vec3(localPos.x, localPos.x.sin().mul(10).add(localPos.z.cos().mul(10)), localPos.z);

            } )();


            tilesMaterial.colorNode =  vec3(positionLocal.x.mul(0.0001).add(instanceIndex).sin().add(1).mul(0.5), positionLocal.y.mul(0.0001).sub(instanceIndex).cos().add(1).mul(0.5) , positionLocal.y.mul(0.0001).add(instanceIndex.mul(2)).cos().add(1).mul(0.5));

            terrainMaterial.transparent = true;

            tile32mesh = new InstancedMesh( tileGeo, tilesMaterial, tileCount );

            tile32mesh.instanceMatrix.setUsage( DynamicDrawUsage );
            tile32mesh.frustumCulled = false;

            terrainMesh = new Mesh( terrainGeometry, terrainMaterial );
            terrainMesh.rotation.x = - Math.PI / 2;
            terrainMesh.position.set(0 * TILES_X*TILE_SIZE*0.5, HEIGHT_MIN, 0 * TILES_Y*TILE_SIZE*0.5);
            terrainMesh.matrixAutoUpdate = false;
            terrainMesh.frustumCulled = false;
            terrainMesh.updateMatrix();


            const heightArray = new Float32Array(heightData.length / 4);

            for (let i = 0; i < heightArray.length; i++) {
                heightArray[i] = heightData[i*4] + heightData[i*4 + 1] *2 + heightData[i*4 + 2]*4;
            }

            const heightBuffer = instancedArray( heightArray ).label( 'Height' );

            terrainMaterial.positionNode = Fn( () => {
                const ix = floor(uv().y.mul(TILES_X));
                const iy = floor(uv().x.mul(TILES_Y));
                const idx = vertexIndex;
                const height = heightBuffer.element(idx);
                const pos = vec3(positionLocal.x, positionLocal.y, height);

                const tri = vec3(heightBuffer.element(idx.add(1)).sub(height), heightBuffer.element(idx.add(TILES_X)).sub(height), 1).normalize();

                varyingProperty( 'vec3', 'v_normalView' ).assign( tri );
                return pos;
            } )();

            terrainMaterial.colorNode = Fn( () => {
                return vec4(0.3, 0.4, 0.2, 0.5);
            } )();

/*
            "vec2 normalSamplerP0 = vec2(terrainSampler.x +shift*0.5 , terrainSampler.y +shift*0.5);",
                "vec4 normalSampleP0 = texture2D( heightmap, normalSamplerP0);",

                "vec2 normalSamplerP1 = vec2(normalSamplerP0.x - shift*1.0, normalSamplerP0.y);",
                "vec4 normalSampleP1 = texture2D( heightmap, normalSamplerP1);",

                "vec2 normalSamplerP2 = vec2(normalSamplerP0.x, normalSamplerP0.y - shift*1.0);",
                "vec4 normalSampleP2 = texture2D( heightmap, normalSamplerP2);",

                "vec3 triPoint0 = vec3( normalSamplerP0.x, normalSampleP0.x*0.01, normalSamplerP0.y);",
                "vec3 triPoint1 = vec3( normalSamplerP1.x, normalSampleP1.x*0.01, normalSamplerP1.y);",
                "vec3 triPoint2 = vec3( normalSamplerP2.x, normalSampleP2.x*0.01, normalSamplerP2.y);",

                "vec3 tangent = triPoint2 - triPoint0;",
                "vec3 biTangent = triPoint1 - triPoint0;",
                "vec3 fragNormal = normalize(cross(tangent, biTangent));",
  */
            ThreeAPI.addToScene(terrainMesh);
            ThreeAPI.addToScene(tile32mesh);
            ThreeAPI.addPostrenderCallback(update);

        }

        function tx1Loaded(img) {
            let tx = new CanvasTexture(img);
            tx.generateMipmaps = false;
            tx.flipY = false;

            let imgData = tx.source.data
            width = imgData.width;
            height = imgData.height;
            heightCanvas.width = width;
            heightCanvas.height = height;
            heightmapContext = heightCanvas.getContext('2d', { willReadFrequently: true } )
            heightmapContext.drawImage(imgData, 0, 0, width, height);
            heightData = heightmapContext.getImageData(0, 0, width, height).data;

            loadAsset('unit_grid_32', 'glb', setupTerrain)

            console.log("Heightmap image", tx, heightData);
        }

        loadImageAsset('heightmap_w01_20', tx1Loaded)

    }



}

export { ComputeTerrain }