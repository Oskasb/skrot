import {jsonAsset, loadAssetMaterial} from "../../../application/utils/AssetUtils.js";
import {Sprite} from "three";
import {uniform, vec2} from "three/tsl";
import {positionLocal} from "../../../../../libs/three/Three.TSL.js";

const TILES_8 = uniform('float', 8);

function customSpriteUv8x8() {
    return vec2(positionLocal.x.div(TILES_8), positionLocal.y.div(TILES_8));
}

const geometries = {};
geometries['Sprite'] = Sprite;

class NodeParticleGeometry {
    constructor() {

        let particleMaterials = {};
        let geoMatEffects = {};
        let key = null;
        let maxInstanceCount = 0;


        function attachMaterialNodes(mat) {

        }

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

            if (typeof(geoMatEffects[matName]) === 'object') {
                geoMatEffects[matName].material = matSettings.material;
                geoMatEffects[matName].needsUpdate = true;
            } else {
                geoMatEffects[matName] = new geometries[key](matSettings.material)
                ThreeAPI.addToScene(geoMatEffects[matName])
            }
            attachMaterialNodes(matSettings.material);
            geoMatEffects[matName].count = maxInstanceCount;
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