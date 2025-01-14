import {Object3D} from "../../../../../libs/three/Three.Core.js";
import {jsonAsset, loadAssetModel} from "../../../application/utils/AssetUtils.js";
import {JsonAsset} from "../../../application/load/JsonAsset.js";
import {SimpleStatus} from "../../../application/setup/SimpleStatus.js";
import {ControlDynamics} from "../../../game/controls/ControlDynamics.js";
import {MATH} from "../../../application/MATH.js";
import {DynamicPoint} from "../../../game/pieces/DynamicPoint.js";
import {PhysicalModel} from "../../../application/physics/PhysicalModel.js";


class AssetInstance {
    constructor () {

        let obj3d = new Object3D();
        let settings = {
            assetInstance:this
        };

        let status = new SimpleStatus();
        this.status = status;

        this.dynamicBones = {};


        let controlDynamics = {};
        this.controlDynamics = controlDynamics;

        let dynamicPoints = [];
        this.dynamicPoints = dynamicPoints;

        function getPointById(id) {
            for (let i = 0; i < dynamicPoints.length; i++) {
                let point = dynamicPoints[i];
                if (point.id === id) {
                    return point;
                }
            }
        }

        function attachPoints(groupId, fileName) {
            function attachPointList(data) {
                console.log("Attach Point List", data)
                for (let i = 0; i < data.length; i++) {
                    let id = data[i].id;
                    let existingPoint = getPointById(id)
                    if (existingPoint) {
                        MATH.splice(dynamicPoints, existingPoint);
                    }
                    dynamicPoints.push(new DynamicPoint(settings.assetInstance, data[i], groupId))
                }
            }

            jsonAsset(fileName, attachPointList)
        }

        function attachControlDynamic(id, fileName) {

            function dynLoaded(ctrlDyn) {
                controlDynamics[id] = ctrlDyn;
             //   console.log("Control Dyns", controlDynamics)
            }

            new ControlDynamics(settings.assetInstance, id, fileName, dynLoaded)

        }

        function instantiate(assetFileName, callback) {

            function onJsonLoaded(data) {
                settings.json = data;
                let modelName = settings.json.model;

                function modelLoaded(modelObj3d) {



                    let points = data['points'];

                    if (points.length) {
                        for (let i = 0; i < points.length; i++) {
                            attachPoints(points[i].id, points[i].file)
                        }
                    }


                    let ctrDyns = data['control_dynamics'];

                    if (ctrDyns.length) {
                        for (let i = 0; i < ctrDyns.length; i++) {
                            attachControlDynamic(ctrDyns[i].id, ctrDyns[i].file)
                        }
                    }

                    callback(settings.assetInstance)
                }

                loadAssetModel(modelName, modelLoaded, obj3d);

                if (settings.json['physical']) {
                    console.log("Load Physical Model", settings.json['physical']);
                    new PhysicalModel(obj3d, settings.json['physical'])
                }

            }

            jsonAsset(assetFileName, onJsonLoaded)

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
            removeFromScene:removeFromScene,
            getPointById:getPointById
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

    getControlDynamic(id) {
        return this.controlDynamics[id];
    }

    getControlDynamicByName(name) {
        for (let key in this.controlDynamics) {
            if (this.controlDynamics[key].dynamic === name) {
                return this.controlDynamics[key];
            }
        }
    }

}

export { AssetInstance }