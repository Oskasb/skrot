import {MATH} from "../../../application/MATH.js";
import {jsonAsset, loadAssetMaterial, loadModelGeometry} from "../../../application/utils/AssetUtils.js";
import {BatchedMesh} from "three";
import {poolFetch, poolReturn} from "../../../application/utils/PoolUtils.js";


class AssetBatchGeometry {
    constructor(fileName) {

        let ready = false;
        let json = null;
        let batchGeo = this;
        let subscribers = [];

        let batchGeometries = {}
        let batchMaterial = null;
        let count = 0;

        let batchedMesh = null;

        let geoIdMap = {};

        function sendToSubscribers() {
            MATH.callAll(subscribers, batchGeo)
            ready = true;
        }

        function subscribe(cb) {
            subscribers.push(cb);
            if (ready === true) {
                cb(batchGeo);
            }
        }


        function cleanup() {
            if (batchedMesh !== null) {
                ThreeAPI.removeFromScene(batchedMesh);
                if (batchedMesh.dispose ) {
                    batchedMesh.dispose();
                }
            }
        }


        function batchDataLoaded() {
            console.log("batchDataLoaded", batchGeometries, batchMaterial, batchGeo, json)

            cleanup();
            let geometryCount = json['count']

            let indexCount = 0;
            let vertexCount = 0;

            let geos = [];

            for (let key in batchGeometries) {
                let geo = batchGeometries[key].call.getGeometry();

                let geoIndexCount = geo.index.count;
                if (geoIndexCount > indexCount) {
                    indexCount = geoIndexCount;
                }
                let geoVCount = geo.getAttribute( 'position' ).count;
                if (geoVCount > vertexCount) {
                    vertexCount = geoVCount;
                }
                geos.push(geo);

            }
            console.log("Geo: ", vertexCount, indexCount);
            batchedMesh = new BatchedMesh(geometryCount, vertexCount, indexCount, batchMaterial);
            batchedMesh.frustumCulled = false;
            batchedMesh.sortObjects = false
            batchedMesh.perObjectFrustumCulled = false

            for (let key in batchGeometries) {
                let geo = batchGeometries[key].call.getGeometry();
                let geoId = batchedMesh.addGeometry(geo, geo.getAttribute( 'position' ).count, geo.index.count)
                geoIdMap[key] = geoId;
            }

            ThreeAPI.addToScene(batchedMesh);
            sendToSubscribers()
        }


        function setJson(jsn) {
            json = jsn;
            let geometries = json['geometries'];
            let material = json['material'];

            function materialLoaded(matSettings) {
                batchMaterial = matSettings.material;
                let loadQueue = [];

                for (let i = 0; i < geometries.length; i++) {
                    loadQueue.push(geometries[i]);
                }

                for (let i = 0; i < geometries.length; i++) {
                    let geoName = geometries[i]

                    function geoLoaded(geo) {
                        let fileName = geo.call.getFileName()
                        batchGeometries[fileName] = geo;
                        MATH.splice(loadQueue, fileName);

                        if (loadQueue.length === 0) {
                            batchDataLoaded();
                        }

                    }

                    loadModelGeometry(geoName, geoLoaded)

                }

            }

            loadAssetMaterial(material, materialLoaded)

        }

        function activateBatchInstance(geoName) {
            let id = batchedMesh.addInstance(geoIdMap[geoName])
            let bInstance = poolFetch('BatchInstance')
            bInstance.call.activateInstance(id, batchedMesh)
            return bInstance;
        }

        function deactivateBatchInstance(batchInstance) {
            batchInstance.call.hide();
            batchedMesh.deleteInstance(batchInstance.call.getId())
            batchedMesh.needsUpdate = true;
            poolReturn(batchInstance);
        }

        this.call = {
            subscribe:subscribe,
            activateBatchInstance:activateBatchInstance,
            deactivateBatchInstance:deactivateBatchInstance
        }

        jsonAsset(fileName, setJson)

    }

}

export { AssetBatchGeometry }