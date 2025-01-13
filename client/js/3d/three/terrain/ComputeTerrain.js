
import {getFrame, loadImageAsset, loadModelAsset} from "../../../application/utils/DataUtils.js";
import {CanvasTexture, Mesh, Object3D, PlaneGeometry, Vector3} from "../../../../../libs/three/Three.Core.js";
import MeshStandardNodeMaterial from "../../../../../libs/three/materials/nodes/MeshStandardNodeMaterial.js";
import {
    add, cross,
    floor,
    Fn, instancedArray,
    instanceIndex,
    max,
    positionLocal,
    time, transformNormalToView,
    uv,
    varyingProperty,
    vec3, vec4
} from "../../../../../libs/three/Three.TSL.js";
import {vertexIndex} from "../../../../../libs/three/nodes/core/IndexNode.js";
import {loadAsset, loadAssetMaterial} from "../../../application/utils/AssetUtils.js";
import {BackSide, Box3, DoubleSide, DynamicDrawUsage, FrontSide, InstancedMesh} from "three";
import {min, mix, normalLocal, texture, uniform, vec2} from "three/tsl";
import {evt} from "../../../application/event/evt.js";
import {ENUMS} from "../../../application/ENUMS.js";
import {aaBoxTestVisibility, borrowBox} from "../../../application/utils/ModelUtils.js";
import * as TerrainFunctions from "./TerrainFunctions.js";
import {setHeightTxOcean} from "../water/Ocean.js";

let heightCanvas = document.createElement('canvas');
let heightmapContext;
let heightData;
const terrainParams = {}
let terrainScale = new Vector3(1, 1, 1);
terrainParams.tx_width = null;
terrainParams.groundTxWidth  = null
terrainParams.unitScale = 1;
terrainParams.minHeight = 0;
terrainParams.maxHeight = 1;

let heightArray = null;
let width;
let height;
let terrainGeometry;
let terrainMaterial;
let tilesMaterial;
let tile32mesh;
let terrainMesh;
const TILE_SIZE = 80;
const TILE_SIZE_HALF = TILE_SIZE / 2;
let TILES_X;
let TILES_Y;
let BOUND_VERTS;

const GEO_SEGS_XY = 32;
let SECTIONS_XY;

const factorR = 1;
const factorG = 2;
const factorB = 10;

const HEIGHT_MIN = -200;
const clrRng = 255;
const HEIGHT_MAX = clrRng*factorR+clrRng*factorG+clrRng*factorB+HEIGHT_MIN;

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
const WORLD_BOX_MAX = uniform(worldBox.max).label('WORLD_BOX_MAX');

const GROUND_TILES = uniform(8);

let heightTx;
let terrainTx;

function getWorldBoxMax() {
    return WORLD_BOX_MAX;
}

function terrainGlobalUv() {
    const boxMaxX = WORLD_BOX_MAX.x;
    const boxMaxY = WORLD_BOX_MAX.z;
    return vec2(positionLocal.x.div(boxMaxX), positionLocal.z.div(boxMaxY));
}

function customTerrainUv() {

    const tileSize = ZERO.add(TILE_SIZE);
    const tileFraction = tileSize.div(GROUND_TILES).mul(0.5);

    const tileRatio = ONE.div(GROUND_TILES).mul(0.999);

    const txXy = vec2(positionLocal.x.div(tileFraction.mul(5)).mod(tileFraction).div(GROUND_TILES.add(2)), positionLocal.z.div(tileFraction.mul(5)).mod(tileFraction).div(GROUND_TILES.add(2))).div(GROUND_TILES.div(2));
    const globalUV = terrainGlobalUv();
    const terrainRGBA = terrainTx.sample(globalUV);

    const biomeRowIndex = floor(terrainRGBA.r.div(0.5)).mul(3);

    const civIndex = floor(terrainRGBA.b.mul(GROUND_TILES).mul(0.99));
    const civRowAdd = min(1, civIndex);

    const blockByCiv = ONE.sub(civRowAdd)

    const vegetationIndex = floor(terrainRGBA.g.mul(GROUND_TILES).mul(0.99)).mul(blockByCiv);
    const vegRowAdd = min(1, vegetationIndex);

    const modulate = positionLocal.x.add(positionLocal.z.mul(0.4)).mul(0.1).sin().add(1).mul(0.02)
    const slope = min(0.99, max(0, varyingProperty( 'float', 'slope' ).pow(1.2).add(modulate)));

    const slopeIndex = floor(slope.mul(GROUND_TILES)).mul(blockByCiv);
    const offsetRow = biomeRowIndex.add(vegRowAdd).add(civRowAdd.mul(2));
    const offsetXSum = slopeIndex.add(civIndex).add(vegetationIndex);

    const uvOffsetted = vec2(txXy.x.add(offsetXSum.mul(tileRatio)), txXy.y.add(offsetRow.mul(tileRatio)));

    return uvOffsetted // .add(addUv) // globalUV // .mul(elevXYZA.x.div(244));
}

class ComputeTerrain {

    constructor(store, onReadyCB) {

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

            return hasUpdate;

        }

        function update(){

            let camera = ThreeAPI.getCamera();
            if (camera) {

                camLookPoint.set(0, 0, -(TILE_SIZE*centerSize*1.2));
                camLookPoint.applyQuaternion(camera.quaternion);
                camLookPoint.add(camera.position);

                let x= Math.floor(camLookPoint.x / TILE_SIZE) * TILE_SIZE;
                let z = Math.floor(camLookPoint.z / TILE_SIZE) * TILE_SIZE;

                dummy.position.set(x, HEIGHT_MIN, z);
                dummy.scale.set(TILE_SIZE, 1, TILE_SIZE);

                let tileCount = 0;



                let hasUpdate = setTileDimensions(tileCount, dummy);
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
                        /*
                            let tileBox = borrowBox();
                            let intersects = worldBox.intersectsBox(tileBox);
                            if (intersects) {

                         */
                                let update = setTileDimensions(tileCount, dummy);
                                tileCount++
                                if (update) {
                                    hasUpdate = true;
                                }
                         //   }

                        }
                    }
                }

                if (camPos.x !== x*TILE_SIZE || camPos.z !== z*TILE_SIZE) {
                    camPos.x = x*TILE_SIZE;
                    camPos.z = z*TILE_SIZE;
                    CAMERA_POS.value.copy(camPos);
                }

                if (hasUpdate) {
                    tileGeo.count = tileCount;
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

            heightTx = texture(heightCanvasTx);
            setHeightTxOcean(heightTx)
            terrainTx = texture(terrainCanvasTx);

            BOUND_VERTS = heightData.length / 4;
            TILES_X = Math.sqrt(BOUND_VERTS) -1;
            TILES_Y = Math.sqrt(BOUND_VERTS) -1;
            SECTIONS_XY = TILES_X / GEO_SEGS_XY;

            const CENTER_SIZE = uniform(centerSize);
            const MAP_BOUNDS = uniform(TILES_X * TILE_SIZE);
            const MAP_TEXELS_SIDE = uniform(TILES_X+1);
            const TOTAL_TEXELS = uniform(BOUND_VERTS);

            worldBox.min.set(0, HEIGHT_MIN, 0);
            worldBox.max.set(MAP_BOUNDS.value, HEIGHT_MAX, MAP_BOUNDS.value);
            terrainParams.unitScale = TILE_SIZE;
            terrainParams.tx_width = MAP_TEXELS_SIDE.value;
            terrainParams.minHeight = HEIGHT_MIN;
            terrainParams.maxHeight = HEIGHT_MAX;
            tileCount = 1;

            for (let l = 0; l < lodLayers; l++) {
                for (let i = 0; i < gridOffsets.length; i++) {
                    tileCount++
                }
            }

            tileGeo = tiles32geo.scene.children[0].geometry;
        //    tileGeo.computeVertexNormals();
            console.log("Setup Terrain geo:", SECTIONS_XY, tileGeo)

            function matLoaded(mat) {
                console.log("Loaded Mat ", mat);

                tilesMaterial = mat.material //new MeshStandardNodeMaterial();

                const nmTx = texture(tilesMaterial.normalMap);
                console.log("nmTx", nmTx, tilesMaterial.normalMap)
                tilesMaterial.normalMap = null;
/*
                tilesMaterial.metalnessMap = null;
                tilesMaterial.roughnessMap = null;
                tilesMaterial.metalness = 0;
                tilesMaterial.roughness = 0.4
                tilesMaterial.envMapIntensity = 0.0
*/
                tilesMaterial.side = FrontSide;
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
                    const slope = varyingProperty( 'float', 'slope' );

                    const heightDiffFront = heightBuffer.element(idx.add(MAP_TEXELS_SIDE)).sub(height).abs()
                    const heightDiffSide  = heightBuffer.element(idx.add(1)).sub(height).abs()
                    slope.assign(min(0.99, max(heightDiffFront, heightDiffSide).mul(0.01)))
                    //    slope.assign(0.02)
                    return vec3(positionLocal.x, height, positionLocal.z);

                } )();

                tilesMaterial.aoNode = Fn( () => {
                    const globalUv = terrainGlobalUv();
                    const heightSample = heightTx.sample(globalUv);
                    const rgbSum = heightSample.r.mul(0.1).add(heightSample.g.mul(0.2)).add(heightSample.b)
                    const height = rgbSum.mul(11);
                    const shoreline =  max(0, min(1, height.pow(4)));
                    return vec4(shoreline, shoreline, shoreline, 1);
                })();


                tilesMaterial.normalNode = Fn( () => {
                    const globalUv = terrainGlobalUv();

                    const shift = ONE.div(MAP_TEXELS_SIDE).mul(0.05);
                    const nmUv0 = vec2(globalUv.x.add(shift), globalUv.y.add(shift));
                    const nmUv1 = vec2(globalUv.x.sub(shift), globalUv.y.add(shift));
                    const nmUv2 = vec2(globalUv.x.add(shift), globalUv.y.sub(shift));
                    const triPoint0 = heightTx.sample(nmUv0);
                    const triPoint1 = heightTx.sample(nmUv1);
                    const triPoint2 = heightTx.sample(nmUv2);

                    const rgbSum0 = triPoint0.r.mul(0.1).add(triPoint0.g.mul(0.2)).add(triPoint0.b)
                    const rgbSum1 = triPoint1.r.mul(0.1).add(triPoint1.g.mul(0.2)).add(triPoint1.b)
                    const rgbSum2 = triPoint2.r.mul(0.1).add(triPoint2.g.mul(0.2)).add(triPoint2.b)

                    const point0 = vec3( nmUv0.x, rgbSum0.mul(0.05), nmUv0.y);
                    const point1 = vec3( nmUv1.x, rgbSum1.mul(0.05), nmUv1.y);
                    const point2 = vec3( nmUv2.x, rgbSum2.mul(0.05), nmUv2.y);
                    /*
                                        const point0 = vec3( nmUv0.x, nmUv0.y, rgbSum0.mul(1.1));
                                        const point1 = vec3( nmUv1.x, nmUv1.y, rgbSum1.mul(1.1));
                                        const point2 = vec3( nmUv2.x, nmUv2.y, rgbSum2.mul(1.1));
                                    */
                    const deltaVec3 = vec3( rgbSum0, rgbSum1,  rgbSum2).normalize();

                    const upness = ONE.sub(rgbSum0.mul(2).sub(rgbSum1.add(rgbSum2)).mul(4));
                    const upnessVec3 = vec3(0, 1.3, 0);

                    const tangent = point2.sub(point0);
                    const biTangent = point1.sub(point0);

                    const txNormal = nmTx.sample(customTerrainUv()).mul(0.25)
                    const fragNormal = transformNormalToView(tangent.cross(biTangent).normalize());

                    return fragNormal.add(txNormal);
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

            //    tilesMaterial.colorNode =  vec3(ZERO.add(instanceIndex).mul(0.02).mod(1),0 , ZERO.add(instanceIndex).mul(0.11).mod(1));

                tile32mesh = new InstancedMesh( tileGeo, tilesMaterial, Math.floor(tileCount) );
                tile32mesh.instanceMatrix.setUsage( DynamicDrawUsage );
                tile32mesh.frustumCulled = false;

                heightArray = new Float32Array(heightData.length / 4);

                const ammoData = [];

                let minh = HEIGHT_MAX;
                let maxh = HEIGHT_MIN;

                for (let i = 0; i < heightArray.length; i++) {
                    let sourceHeight = heightData[i*4]*factorR + heightData[i*4 + 1] * factorG + heightData[i*4 + 2]*factorB;
                    ammoData[i] = sourceHeight // + factorB+factorR+factorB;
                    if (sourceHeight < minh) {
                        minh = sourceHeight;
                    }
                    if (sourceHeight > maxh) {
                        maxh = sourceHeight;
                    }
                    heightArray[i] = sourceHeight // * (256/255) +1
                }

                let maxProp = (HEIGHT_MAX+HEIGHT_MIN) / maxh
                console.log("ActualMinMAx", minh, maxh, maxProp);
           //     AmmoAPI.buildPhysicalTerrain(ammoData, MAP_BOUNDS.value, MAP_BOUNDS.value/2, MAP_BOUNDS.value/2, HEIGHT_MIN, HEIGHT_MAX)

                AmmoAPI.buildPhysicalTerrain(ammoData, MAP_BOUNDS.value, MAP_BOUNDS.value/2,MAP_BOUNDS.value/2, HEIGHT_MIN, HEIGHT_MAX, maxProp) // HEIGHT_MAX)


                const heightBuffer = instancedArray( heightArray ).label( 'Height' );


                //    ThreeAPI.addToScene(terrainMesh);
                ThreeAPI.addToScene(tile32mesh);
                ThreeAPI.addPostrenderCallback(update);
                onReadyCB();
            }

            loadAssetMaterial('material_terrain', matLoaded)

        }

        let heightCanvasTx;
        let terrainCanvasTx;

        let terrainNormalTx;

        function tx1Loaded(img) {
            let tx = new CanvasTexture(img);
            heightCanvasTx = tx;
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

            function tx2Loaded(img) {
                let tx = new CanvasTexture(img);
                terrainCanvasTx = tx;
                tx.generateMipmaps = false;
                tx.flipY = false;
                loadAsset('unit_grid_32', 'glb', setupTerrain)
            }

            loadImageAsset('terrainmap_w01_20', tx2Loaded)
            console.log("Heightmap image", tx, heightData);

        }

        loadImageAsset('heightmap_w01_20', tx1Loaded)



        //    loadImageAsset('heightmap_test', tx1Loaded)
    }

}


function getHeightmapData() {
    return heightArray;
}

function getTerrainParams() {
    return terrainParams;
}

function terrainAt(pos, normalStore) {
    if (heightArray === null)  {
        return pos.y;
    }
    return TerrainFunctions.getHeightAt(pos, heightArray, terrainParams.unitScale, terrainParams.tx_width, terrainParams.tx_width - 1, normalStore, terrainScale, worldBox.min);
}

export {
    ComputeTerrain,
    getWorldBoxMax,
    customTerrainUv,
    getHeightmapData,
    getTerrainParams,
    terrainAt,
    terrainGlobalUv
}