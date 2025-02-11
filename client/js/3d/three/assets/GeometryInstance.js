import {poolFetch, poolReturn} from "../../../application/utils/PoolUtils.js";
import {loadAsset, loadAssetMaterial} from "../../../application/utils/AssetUtils.js";
import {DynamicDrawUsage, InstancedMesh} from "three";
import {Object3D} from "../../../../../libs/three/core/Object3D.js";

const instancePools = {}
const materials = {};
const geometries = {};
const instanceCount = 900;

const hideObj = new Object3D();

let hasInstances = false;


function compressPools(meshPools) {
    for (let i = 0; i < meshPools.length; i++) {

    }
}

function optimize() {
    for (let key in instancePools) {
        let geoPools = instancePools[key];
        for (let geo in geoPools) {
            compressPools(geoPools[geo])
        }
    }
}

function attachInstanceMesh(matName, geoName) {

    if (!instancePools[matName]) {
        instancePools[matName] = {};
    }
    if (!instancePools[matName][geoName]) {
        instancePools[matName][geoName] = [];
    }

    const instanceMeshPool = instancePools[matName][geoName];
    const mesh = new InstancedMesh( geometries[geoName], materials[matName], instanceCount );
    mesh.instanceMatrix.setUsage( DynamicDrawUsage );
    ThreeAPI.addToScene(mesh);
    mesh.frustumCulled = false;
    instanceMeshPool.push({mesh:mesh, instanceInfos:[], releasedIndices:[]});

    if (hasInstances === false) {
        ThreeAPI.unregisterPostrenderCallback(optimize);
        hasInstances = true;
    }

}

function registerInstanceGeometry(geoName, matName, cb) {

    if (!cbQueues[geoName]) {
        cbQueues[geoName] = [cb];

        function geoLoaded(geo) {
            geometries[geoName] = geo.scene.children[0].geometry;
            attachInstanceMesh(matName, geoName)
            while (cbQueues[geoName].length) {
                cbQueues[geoName].pop()()
            }
        }
        loadAsset(geoName, 'glb', geoLoaded)
    } else {
        cbQueues[geoName].push(cb);
    }

}


const cbQueues = {};

function registerInstanceMaterial(geoName, matName, cb) {

    if (!cbQueues[matName]) {
        cbQueues[matName] = [cb];
        function matLoaded(matSettings) {
            materials[matName] = matSettings.material;
            while (cbQueues[matName].length) {
                registerInstanceGeometry(geoName, matName, cbQueues[matName].pop())
            }
        }
        loadAssetMaterial(matName, matLoaded)
    } else {
        cbQueues[matName].push(cb);
    }
}

function instantiateByInfo(info) {
    const instanceMeshPool = instancePools[info.matName][info.geoName];

    for (let i = 0; i < instanceMeshPool.length; i++) {
        let mesh = instanceMeshPool[i].mesh;
        let instanceInfos = instanceMeshPool[i].instanceInfos;
        let releasedIndices = instanceMeshPool[i].releasedIndices;


        if (releasedIndices.length !== 0 || instanceInfos.length < instanceCount) {
            instanceInfos.push(info);

            if (releasedIndices.length !== 0) {
                info.index = releasedIndices.pop();
            } else {
                info.index = instanceInfos.length;
            //    mesh.count = info.index;
            }
            info.mesh = mesh;
            info.meshPool = instanceMeshPool[i];
            return;
        }
    }

    attachInstanceMesh(info.matName, info.geoName)
    instantiateByInfo(info)
}

class GeometryInstance {
    constructor() {

        const geoIns = this;

        const info = {
            geoName:null,
            matName:null,
            meshPool:null,
            mesh:null,
            index:null
        }


        function instanceMeshReady() {
            instantiateByInfo(info)
        }


        function instantiateGeo(geometryName, materialName) {

            info.geoName = geometryName;
            info.matName = materialName;

            if (!materials[materialName]) {
                registerInstanceMaterial(geometryName, materialName, instanceMeshReady)
            } else if (!geometries[geometryName]) {
                registerInstanceGeometry(geometryName, materialName, instanceMeshReady)
            } else {
                instanceMeshReady()
            }

        }

        function applyTrxObj(obj3d) {
            obj3d.updateMatrix();

            if (info.mesh !== null && info.index !== null) {
                info.mesh.setMatrixAt(info.index, obj3d.matrix);
            }

        }

        function closeGeoInstance() {
            if (info.mesh !== null && info.index !== null) {
                info.mesh.setMatrixAt(info.index, hideObj.matrix);
            }
            info.mesh = null;
            if (info.meshPool !== null) {
                info.meshPool.releasedIndices.unshift(info.index)
            }
            info.meshPool = null;
            info.index = null;
            poolReturn(geoIns);
        }

        this.call = {
            instantiateGeo:instantiateGeo,
            applyTrxObj:applyTrxObj,
            closeGeoInstance:closeGeoInstance
        }

    }

}

function createGeometryInstance(geometryName, materialName) {
    let geoInstance = poolFetch('GeometryInstance');
    geoInstance.call.instantiateGeo(geometryName, materialName)
    return geoInstance;
}

export { GeometryInstance,
    createGeometryInstance
}