import {Object3D} from "../../../../../libs/three/Three.Core.js";
import {getObj3dScaleKey} from "../../../application/utils/ModelUtils.js";
import {getJsonByFileName, getJsonUrlByFileName} from "../../../application/utils/DataUtils.js";
import {loadAssetModel} from "../../../application/utils/AssetUtils.js";
import {JsonAsset} from "../../../application/load/JsonAsset.js";

class AssetInstance {
    constructor () {

        let obj3d = new Object3D();
        let settings = {
            assetInstance:this
        };

        function instantiate(assetFileName, callback) {

            let jsonAsset = new JsonAsset(assetFileName);

            function onJsonLoaded(data) {
                settings.json = data;
                let modelName = settings.json.model;

                function modelLoaded(modelObj3d) {
                    callback(settings.assetInstance)
                }

                loadAssetModel(modelName, modelLoaded, obj3d);
            }

            jsonAsset.subscribe(onJsonLoaded)

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

        function addToScene() {
            ThreeAPI.addToScene(obj3d);
        }

        function removeFromScene() {
            ThreeAPI.removeFromScene(obj3d);
        }

        this.call = {
            instantiate:instantiate,
            setPos:setPos,
            setQuat:setQuat,
            getObj3d:getObj3d,
            addToScene:addToScene,
            closeAsset:closeAsset,
            removeFromScene:removeFromScene
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