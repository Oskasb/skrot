
import {loadImageAsset} from "../../../application/utils/DataUtils.js";
import {CanvasTexture, Mesh, PlaneGeometry} from "../../../../../libs/three/Three.Core.js";
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

class ComputeTerrain {

    constructor() {

        function setupTerrain() {
            BOUND_TILES = heightData.length / 4;
            TILES_X = Math.sqrt(BOUND_TILES);
            TILES_Y = Math.sqrt(BOUND_TILES);
            terrainGeometry = new PlaneGeometry( TILES_X*TILE_SIZE, TILES_Y*TILE_SIZE, TILES_X - 1, TILES_Y - 1 );
            terrainMaterial = new MeshStandardNodeMaterial();

            terrainMesh = new Mesh( terrainGeometry, terrainMaterial );
            terrainMesh.rotation.x = - Math.PI / 2;
            terrainMesh.position.set(TILES_X*TILE_SIZE*0.5, -30, TILES_Y*TILE_SIZE*0.5);
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
                return vec4(0.3, 0.4, 0.2, 1);
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
            console.log("Heightmap image", tx, heightData);
            setupTerrain();
        }

        loadImageAsset('heightmap_w01_20', tx1Loaded)

    }



}

export { ComputeTerrain }