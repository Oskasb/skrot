
import {getFrame, loadImageAsset, loadModelAsset} from "../../../application/utils/DataUtils.js";
import {CanvasTexture, Mesh, PlaneGeometry, Vector3} from "../../../../../libs/three/Three.Core.js";
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
import {aaBoxTestVisibility, borrowBox} from "../../../application/utils/ModelUtils.js";
import {InstancedMesh} from "three";

let heightCanvas = document.createElement('canvas');
let heightmapContext;
let heightData;
let width;
let height;
let terrainGeometry;
let terrainMaterial;
let terrainMesh;
let TILE_SIZE = 10;
let TILES_X;
let TILES_Y;
let BOUND_TILES;

let GEO_SEGS_XY = 32;
let SECTIONS_XY;


let centerSize = 30;
let lodLayers = 5;
let gridOffsets = [[-1, -1], [-1, 0], [-1, 1], [0, -1], [0, 1], [1, -1], [1, 0], [1, 1]]
let layerScale = [1, 3, 9, 27, 81, 243]
let tempPoint = new Vector3();

const camPos = new Vector3();

class ComputeTerrain {

    constructor() {


        function update(){

            let camera = ThreeAPI.getCamera();
            if (camera) {
                let x= Math.floor(camera.position.x / TILE_SIZE);
                let z = Math.floor(camera.position.z / TILE_SIZE);
                camPos.x = x*TILE_SIZE;
                camPos.z = -z*TILE_SIZE;
            }

            let scaleFactor = centerSize

            for (let l = 0; l < lodLayers; l++) {
                let lodLayer = l;

                for (let i = 0; i < gridOffsets.length; i++) {
                    let lodScale = layerScale[lodLayer]
                }
            }

        }



        function setupTerrain(tiles32geo) {
            BOUND_TILES = heightData.length / 4;
            TILES_X = Math.sqrt(BOUND_TILES);
            TILES_Y = Math.sqrt(BOUND_TILES);

            SECTIONS_XY = TILES_X / GEO_SEGS_XY;

            let count = 1;
            for (let l = 0; l < lodLayers; l++) {
                let lodLayer = l;
                for (let i = 0; i < gridOffsets.length; i++) {
                    let lodScale = layerScale[lodLayer]
                    count++
                }
            }


            let tileGeo = tiles32geo.scene.children[0].geometry;
            console.log("Setup Terrain geo:", SECTIONS_XY, tileGeo)

            return;

            terrainGeometry = new PlaneGeometry( TILES_X*TILE_SIZE, TILES_Y*TILE_SIZE, TILES_X - 1, TILES_Y - 1 );
            terrainMaterial = new MeshStandardNodeMaterial();
            terrainMaterial.transparent = true;


            let tile32mesh = new InstancedMesh( tileGeo, terrainMaterial, count );

            terrainMesh = new Mesh( terrainGeometry, terrainMaterial );
            terrainMesh.rotation.x = - Math.PI / 2;
            terrainMesh.position.set(0 * TILES_X*TILE_SIZE*0.5, -30, 0 * TILES_Y*TILE_SIZE*0.5);
            terrainMesh.matrixAutoUpdate = false;
            terrainMesh.frustumCulled = false;
            terrainMesh.updateMatrix();




            const heightArray = new Float32Array(heightData.length / 4);

            for (let i = 0; i < heightArray.length; i++) {
                heightArray[i] = heightData[i*4];
            }

            const heightBuffer = instancedArray( heightArray ).label( 'Height' );
            const rgbaBuffer = instancedArray( heightData ).label( 'Rgba' );

            terrainMaterial.positionNode = Fn( () => {
                const ix = floor(uv().y.mul(TILES_X));
                const iy = floor(uv().x.mul(TILES_Y));
                const idx = vertexIndex;
                const r = heightBuffer.element(idx);
                const pos = vec3(positionLocal.x, positionLocal.y, positionLocal.z.add(r.mul(2)));

                const tri = vec3(heightBuffer.element(idx.add(1)).sub(r), heightBuffer.element(idx.add(TILES_X)).sub(r), 1).normalize();

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