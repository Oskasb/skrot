import {jsonAsset, loadAssetMaterial, loadAssetTexture} from "../../../application/utils/AssetUtils.js";
import {Sprite} from "three";
import {uniform, vec2} from "three/tsl";
import {positionGeometry, positionLocal} from "../../../../../libs/three/Three.TSL.js";
import {ParticleNodes} from "./ParticleNodes.js";
import {Texture} from "../../../../../libs/three/textures/Texture.js";
import {ClampToEdgeWrapping, SRGBColorSpace} from "../../../../../libs/three/constants.js";
import {loadImageAsset} from "../../../application/utils/DataUtils.js";
import {SpriteNodeMaterial} from "../../../../../libs/three/materials/nodes/NodeMaterials.js";
import {TiledSpriteNodeMaterial8x8} from "../assets/ModelMaterial.js";

const TILES_8 = uniform(8);

function customSpriteUv8x8() {
    return vec2(positionGeometry.x.add(0.5).div(TILES_8), positionGeometry.y.add(0.5).div(TILES_8));
}

const geometries = {};
geometries['Sprite'] = Sprite;

class NodeParticleGeometry {
    constructor() {



        let particleMaterials = {};
        let geoMatEffects = {};
        let key = null;
        let maxInstanceCount = 0;

        function setJson(json) {
            maxInstanceCount = json['max_instance_count']
            key = json['geometry']
        }

        function applyParticleGeoConfig(fileName) {
            jsonAsset(fileName, setJson)
        }

        function getMaterialByName(matName) {
            return particleMaterials[matName];
        }

        function setEffectMaterial(matName, matSettings) {
            console.log("setEffectMaterial", matName, matSettings);
            particleMaterials[matName] = matSettings;

            let sourceMat = matSettings.material;

            sourceMat.map.colorSpace = SRGBColorSpace;

            let tx = sourceMat.map
            let dTx = sourceMat.alphaMap;
            dTx.flipY = true;
            dTx.wrapS = ClampToEdgeWrapping;
            dTx.wrapT = ClampToEdgeWrapping;

            const material = new TiledSpriteNodeMaterial8x8();

            material.map = tx;
            material.dataTexture = dTx;
            material.alphaTest = sourceMat.alphaTest;
            material.sizeAttenuation = true // sourceMat.transparent;

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
                geoMatEffects[matName] = new geometries[key](material)
                geoMatEffects[matName].matrixWorldAutoUpdate = false;
                ThreeAPI.addToScene(geoMatEffects[matName])
            }

            geoMatEffects[matName].material.particleNodes = new ParticleNodes(material, maxInstanceCount)
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

        function spawnGeometryParticle(pos, vel, config) {
            let matName = config['material'];
            if (geoMatEffects[matName]) {
                geoMatEffects[matName].material.particleNodes.call.spawnNodeParticle(pos, vel, config);
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