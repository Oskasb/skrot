
import {NodeParticleGeometry} from "./NodeParticleGeometry.js";
const particleGeometries = {};

function activateEffectConfig(matName, geoName) {

    if (!particleGeometries[geoName]) {
        particleGeometries[geoName] = new NodeParticleGeometry();
        particleGeometries[geoName].call.applyParticleGeoConfig(geoName);
    }

    let hasMat = particleGeometries[geoName].call.getMaterialByName(matName);

    if (!hasMat) {
        particleGeometries[geoName].call.bindParticleMaterial(matName);
    }

}

function activateParticleEffectConfig(config) {
    console.log('activateParticleEffect', config['material'], config['geometry'])
    activateEffectConfig(config['material'], config['geometry'])
}

function spawnParticle(pos, vel, config) {
    console.log('activateParticleEffect',  config['geometry'])
    if (particleGeometries[config['geometry']]) {
        particleGeometries[config['geometry']].call.spawnGeometryParticle(pos, vel, config)
    }
}

function closeParticleEffect(pFx) {
    console.log('closeParticleEffect', pFx)
}

export {
    activateParticleEffectConfig,
    spawnParticle,
    closeParticleEffect
}