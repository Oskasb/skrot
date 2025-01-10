
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
import {Box3, DoubleSide, DynamicDrawUsage, InstancedMesh} from "three";
import {min, mix, uniform} from "three/tsl";
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
const TILE_SIZE = 80;
let TILES_X;
let TILES_Y;
let BOUND_VERTS;



const GEO_SEGS_XY = 32;
let SECTIONS_XY;

const HEIGHT_MIN = -60;
const HEIGHT_MAX = 255+255*2+255*4+HEIGHT_MIN;

const centerSize = 30;
const lodLayers = 4;
const gridOffsets = [[-1, -1], [-1, 0], [-1, 1], [0, -1], [0, 1], [1, -1], [1, 0], [1, 1]]
const layerScale = [1, 3, 9, 27, 81, 243]
let tempPoint = new Vector3();


const dummy = new Object3D();

const camPos = new Vector3();

const tilePosition = uniform( new Vector3() );
const tileScale = uniform( new Vector3() );
const tileIndex = uniform(0)
const ONE = uniform(1);
const ZERO = uniform(0);
const TEXEL_SIZE = uniform(TILE_SIZE);

const HALF_TILE_SIZE = uniform(GEO_SEGS_XY / 2);

const worldBox = new Box3();

const CAMERA_POS = uniform(new Vector3()).label('CAMERA_POS');

const camLookPoint = new Vector3();

class ComputeTerrain {

    constructor(store) {

   //     return;

        let positionBuffer;
        let scaleBuffer;
        let renderer = store.renderer;
        const scaleFactor = centerSize*TILE_SIZE;
        const gridCenter = uniform(camPos, 'vec3');
        let tileGeo;

        const applyTileUpdate = Fn( () => {

            const position = positionBuffer.element( tileIndex );
            position.assign(tilePosition);

            const scale = scaleBuffer.element( tileIndex );
            scale.assign(tileScale)
        } )().compute( 1 );

        function updateTile(dummy, index) {
            tilePosition.value.copy( dummy.position );
            tileScale.value.copy( dummy.scale );
            tileIndex.value = index;
            renderer.computeAsync( applyTileUpdate );
        }

        const tileDimensions = [];

        function setTileDimensions(tileIndex, obj3d) {

            if (!tileDimensions[tileIndex]) {
                tileDimensions[tileIndex] = new Object3D();
            }

            let tileLastPos = tileDimensions[tileIndex].position;
            let hasUpdate = false;

            if (obj3d.position.x !== tileLastPos.x || obj3d.position.z !== tileLastPos.z) {
                hasUpdate = true;
            } else {
                let tileLastScale = tileDimensions[tileIndex].scale;
                if (obj3d.scale.x !== tileLastScale.x || obj3d.scale.z !== tileLastScale.z) {
                    hasUpdate = true;
                }
            }

            if (hasUpdate) {
                tileDimensions[tileIndex].position.copy(obj3d.position);
                tileDimensions[tileIndex].scale.copy(obj3d.scale);
                obj3d.updateMatrix();
                tile32mesh.setMatrixAt(tileIndex, obj3d.matrix);
                updateTile(obj3d, tileIndex);
            }

        }

        function update(){

            let camera = ThreeAPI.getCamera();
            if (camera) {

                camLookPoint.set(0, 0, -(TILE_SIZE*centerSize*1.5));
                camLookPoint.applyQuaternion(camera.quaternion);
                camLookPoint.add(camera.position);

                let x= Math.floor(camLookPoint.x / TILE_SIZE) * TILE_SIZE;
                let z = Math.floor(camLookPoint.z / TILE_SIZE) * TILE_SIZE;

                dummy.position.set(x, HEIGHT_MIN, z);
                dummy.scale.set(TILE_SIZE, 1, TILE_SIZE);

                let tileCount = 0;

                setTileDimensions(tileCount, dummy);
                tileCount++

                for (let l = 0; l < lodLayers; l++) {
                    let lodLayer = l;
                    for (let i = 0; i < gridOffsets.length; i++) {
                        let lodScale = layerScale[lodLayer];

                        let tileX = x;
                        let tileZ = z;

                        if (lodScale !== 1) {
                            tileX = Math.floor(camLookPoint.x / (TILE_SIZE*lodScale)) * (TILE_SIZE*lodScale);
                            tileZ = Math.floor(camLookPoint.z / (TILE_SIZE*lodScale)) * (TILE_SIZE*lodScale);
                        }

                        let tx = tileX + scaleFactor*gridOffsets[i][0]*lodScale;
                        let tz = tileZ + scaleFactor*gridOffsets[i][1]*lodScale

                        dummy.position.set(tx, HEIGHT_MIN, tz);
                        dummy.scale.set(TILE_SIZE*lodScale, 1, TILE_SIZE*lodScale);

                        let visible = aaBoxTestVisibility(dummy.position, dummy.scale.x*centerSize, HEIGHT_MAX, dummy.scale.z*centerSize)

                        if (visible) {
                            let tileBox = borrowBox();
                            let intersects = worldBox.intersectsBox(tileBox);
                            if (intersects) {
                                setTileDimensions(tileCount, dummy);
                                tileCount++
                            }
                        }
                    }
                }

                if (camPos.x !== x*TILE_SIZE || camPos.z !== z*TILE_SIZE) {
                    camPos.x = x*TILE_SIZE;
                    camPos.z = z*TILE_SIZE;
                    CAMERA_POS.value.copy(camPos);
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
            BOUND_VERTS = heightData.length / 4;
            TILES_X = Math.sqrt(BOUND_VERTS) -1;
            TILES_Y = Math.sqrt(BOUND_VERTS) -1;

            SECTIONS_XY = TILES_X / GEO_SEGS_XY;
            const CENTER_SIZE = uniform(centerSize);
            const MAP_BOUNDS = uniform(TILES_X * centerSize);
            const MAP_TEXELS_SIDE = uniform(TILES_X+1);
            const TOTAL_TEXELS = uniform(BOUND_VERTS);

            worldBox.min.set(0, HEIGHT_MIN, 0);
            worldBox.max.set(MAP_BOUNDS.value, HEIGHT_MAX, MAP_BOUNDS.value);

            tileCount = 1;

            for (let l = 0; l < lodLayers; l++) {
                for (let i = 0; i < gridOffsets.length; i++) {
                    tileCount++
                }
            }

            tileGeo = tiles32geo.scene.children[0].geometry;
        //    tileGeo.computeVertexNormals();
            console.log("Setup Terrain geo:", SECTIONS_XY, tileGeo)

            tilesMaterial = new MeshStandardNodeMaterial();
            tilesMaterial.side = DoubleSide;
            positionBuffer = instancedArray( tileCount, 'vec3' );
            scaleBuffer = instancedArray( tileCount, 'vec3' );
        //    tilesMaterial.positionNode = positionBuffer.toAttribute();
        //    tilesMaterial.scaleNode = scaleBuffer.toAttribute();

            tilesMaterial.positionNode = Fn( () => {
                const scale = scaleBuffer.element(instanceIndex);
                const localPos = positionLocal.mul(scale);
                const tileCenterPos = positionBuffer.element(instanceIndex);
                const localFlip = vec3(localPos.x.mul(1), 0, localPos.z);
                const pxX = floor(localFlip.x.div(TILE_SIZE)).add(tileCenterPos.x.div(TILE_SIZE)) // .add(camPos.x))
                const pxY = floor(localFlip.z.div(TILE_SIZE)).add(tileCenterPos.z.div(TILE_SIZE)) // .div(1))
                const texelX = min(MAP_TEXELS_SIDE, max(0, pxX));
                const texelY = min(MAP_TEXELS_SIDE, max(0, pxY)).mul(MAP_TEXELS_SIDE); // floor(MAP_TEXELS_SIDE.sub(tileCenterPos.z.div(TEXEL_SIZE)));
                const idx = texelY.add(texelX);
                const height = heightBuffer.element(idx);
                return vec3(positionLocal.x, height, positionLocal.z);
            } )();


            tilesMaterial.colorNode =  vec3(ZERO.add(instanceIndex).mul(0.02).mod(1),0 , ZERO.add(instanceIndex).mul(0.11).mod(1));

            tile32mesh = new InstancedMesh( tileGeo, tilesMaterial, Math.floor(tileCount*0.65) );

            tile32mesh.instanceMatrix.setUsage( DynamicDrawUsage );
            tile32mesh.frustumCulled = false;


            const heightArray = new Float32Array(heightData.length / 4);

            for (let i = 0; i < heightArray.length; i++) {
                heightArray[i] = heightData[i*4] + heightData[i*4 + 1] *2 + heightData[i*4 + 2]*4;
            }

            const heightBuffer = instancedArray( heightArray ).label( 'Height' );

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
        //    ThreeAPI.addToScene(terrainMesh);
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