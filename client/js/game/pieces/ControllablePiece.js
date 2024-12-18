import {JsonAsset} from "../../application/load/JsonAsset.js";
import {poolFetch} from "../../application/utils/PoolUtils.js";
import {loadAssetInstance} from "../../application/utils/AssetUtils.js";

class ControllablePiece {
    constructor() {
        let statusMap = {
            controllablePiece:this
        }
        this.statusMap = statusMap;

        this.call = {

        }

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
            statusMap.json = json;
            loadAssetInstance(json['controllable'], controllableLoaded)
        }

        jsonAsset.subscribe(onData)

    }

}

export {ControllablePiece}