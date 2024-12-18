import {JsonAsset} from "../../application/load/JsonAsset.js";
import {poolFetch} from "../../application/utils/PoolUtils.js";
import {loadAssetInstance} from "../../application/utils/AssetUtils.js";
import {SimpleStatus} from "../../application/setup/SimpleStatus.js";

class ControllablePiece {
    constructor() {
        let status = new SimpleStatus()
        this.status = status;

        this.call = {

        }

    }

    getStatus(key) {
        return this.status.getStatus(key);
    }

    setStatusKey(key, status) {
        this.status.setStatusKey(key, status);
    }

    getAssetInstance() {
        return this.assetInstance
    }

    initControllable(id, callback) {

        let _this = this;

        let jsonAsset = new JsonAsset(id);
        let statusMap = this.statusMap;

        function controllableLoaded(assetInstance) {
            console.log("assetInstance Loaded:", assetInstance);
            _this.assetInstance = assetInstance;
            callback(_this)
        }

        function onData(json) {
            _this.json = json;
            loadAssetInstance(json['controllable'], controllableLoaded)
        }

        jsonAsset.subscribe(onData)

    }

}

export {ControllablePiece}