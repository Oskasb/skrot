import {jsonAsset, loadAssetMaterial, loadAssetTexture} from "../../../application/utils/AssetUtils.js";
import {DynamicDrawUsage, Float32BufferAttribute, PlaneGeometry, Sprite} from "three";
import {uniform, uv, vec2} from "three/tsl";
import {positionGeometry, positionLocal, varyingProperty} from "../../../../../libs/three/Three.TSL.js";
import {ParticleNodes} from "./ParticleNodes.js";
import {Texture} from "../../../../../libs/three/textures/Texture.js";
import {ClampToEdgeWrapping, SRGBColorSpace} from "../../../../../libs/three/constants.js";
import {loadImageAsset} from "../../../application/utils/DataUtils.js";
import {SpriteNodeMaterial} from "../../../../../libs/three/materials/nodes/NodeMaterials.js";
import {TiledLambertNodeMaterial8x8, TiledSpriteNodeMaterial8x8} from "../assets/ModelMaterial.js";
import {InstancedMesh} from "../../../../../libs/three/objects/InstancedMesh.js";

const TILES_8 = uniform(8);

function customSpriteUv8x8() {

    const xy = varyingProperty('vec2', 'pSpriteXY')

    const offsetX = xy.x.div(TILES_8);
    const offsetY = xy.y.div(TILES_8);
    return vec2(positionGeometry.x.add(0.5).div(TILES_8).add(offsetX), positionGeometry.y.add(0.5).div(TILES_8).add(offsetY));
}

let quadMesh = new PlaneGeometry(1, 1, 1, 1)

function quad(mat, count) {
    let mesh = new InstancedMesh(quadMesh, mat, count)
    console.log("Make Quad for count", count)
    mesh.instanceMatrix.setUsage( DynamicDrawUsage );
    mesh.frustumCulled = false;
    mesh.castShadow = false;
    mesh.receiveShadow = false;
    return mesh;
}

const geometries = {};
geometries['Sprite'] = Sprite;
geometries['Quad'] = quad;

class NodeParticleGeometry {
    constructor() {



        let particleMaterials = {};
        let geoMatEffects = {};
        let key = null;
        let maxInstanceCount = 0;

        let geoSharedUnifs = {};

        let reapply = function() {

        }

        function setJson(json) {
            maxInstanceCount = json['max_instance_count']
            geoSharedUnifs = json['shared_uniforms'] || geoSharedUnifs;

            key = json['geometry']
            reapply();
        }

        function applyParticleGeoConfig(fileName) {
            jsonAsset(fileName, setJson)
        }

        function getMaterialByName(matName) {
            return particleMaterials[matName];
        }

        function setEffectMaterial(matName, matSettings) {

            if (key === null) {
                reapply = function() {
                    setEffectMaterial(matName, matSettings)
                }
                return;
            }

            console.log("setEffectMaterial", matName, matSettings);
            particleMaterials[matName] = matSettings;

            let sourceMat = matSettings.material;

            sourceMat.map.colorSpace = SRGBColorSpace;

            let tx = sourceMat.map
            let dTx = sourceMat.alphaMap;
            dTx.flipY = true;
            dTx.wrapS = ClampToEdgeWrapping;
            dTx.wrapT = ClampToEdgeWrapping;

            let material;
            if (key === 'Sprite') {
                material = new TiledSpriteNodeMaterial8x8();
            } else {
                material = new TiledLambertNodeMaterial8x8();
            }


            material.map = tx;
            material.dataTexture = dTx;
            material.alphaTest = sourceMat.alphaTest;
            material.sizeAttenuation = true // sourceMat.transparent;
            material.side = sourceMat.side;
            material.transparent = sourceMat.transparent;
            material.depthTest = sourceMat.depthTest;
            material.depthWrite = sourceMat.depthWrite;
            material.blending = sourceMat.blending;
            material.blendEquation = sourceMat.blendEquation;
            material.blendSrc = sourceMat.blendSrc;
            material.blendDst = sourceMat.blendDst;
            material.blendSrcAlpha = sourceMat.blendSrcAlpha;
            material.blendDstAlpha = sourceMat.blendDstAlpha;
            material.blendEquationAlpha = sourceMat.blendEquationAlpha;
            material.lights = false;

            if (typeof(geoMatEffects[matName]) === 'object') {
                geoMatEffects[matName].material = material;
                geoMatEffects[matName].needsUpdate = true;
            } else {
                geoMatEffects[matName] = new geometries[key](material, maxInstanceCount)
                geoMatEffects[matName].matrixWorldAutoUpdate = false;
                ThreeAPI.addToScene(geoMatEffects[matName])
            }

            geoMatEffects[matName].material.particleNodes = new ParticleNodes(material, maxInstanceCount, geoMatEffects[matName], geoSharedUnifs)
            geoMatEffects[matName].count = maxInstanceCount;
            geoMatEffects[matName].frustumCulled = false;
            geoMatEffects[matName].castShadow = false;
            geoMatEffects[matName].receiveShadow = false;
        }

        function bindParticleMaterial(matName) {
            function applyJson(matSettings) {

                setEffectMaterial(matName, matSettings)
            }
            loadAssetMaterial(matName, applyJson)
        }

        function spawnGeometryParticle(obj3d, config) {
            let matName = config['material'];
            if (geoMatEffects[matName]) {
                geoMatEffects[matName].material.particleNodes.call.setParticleEmitterGain(obj3d, config);
            }
        }

        this.call = {
            getMaterialByName:getMaterialByName,
            applyParticleGeoConfig:applyParticleGeoConfig,
            bindParticleMaterial:bindParticleMaterial,
            spawnGeometryParticle:spawnGeometryParticle
        }
    }
}

export {
    NodeParticleGeometry,
    customSpriteUv8x8
}