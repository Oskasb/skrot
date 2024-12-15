import {Object3D} from "../../../../../libs/three/Three.Core.js";
import {getObj3dScaleKey} from "../../../application/utils/ModelUtils.js";
import {getJsonByFileName} from "../../../application/utils/DataUtils.js";
import {loadAssetModel} from "../../../application/utils/AssetUtils.js";

class AssetInstance {
    constructor () {

        let obj3d = new Object3D();
        let settings = {
            assetInstance:this
        };

        function instantiate(assetFileName, callback) {
            settings.json = getJsonByFileName(assetFileName);
            let modelName = settings.json.model;

            function modelLoaded(modelObj3d) {
                callback(settings.assetInstance)
            }

            loadAssetModel(modelName, modelLoaded, obj3d);
        }

        function setPos(pos) {
            obj3d.position.copy(pos);
        }

        function setQuat(quat) {
            obj3d.quaternion.copy(quat);
        }

        function getObj3d() {
            return obj3d;
        }

        function closeAsset() {

        }

        this.call = {
            instantiate:instantiate,
            setPos:setPos,
            setQuat:setQuat,
            getObj3d:getObj3d,
            closeAsset:closeAsset
        }

    }

    setPos(pos) {
        this.call.setPos(pos);
    }

    setQuat(quat) {
        this.call.setQuat(quat);
    }

    getObj3d() {
        return this.call.getObj3d();
    }

}

export { AssetInstance }