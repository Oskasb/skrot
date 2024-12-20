import {Object3D} from "../../../../../libs/three/Three.Core.js";
import {loadAssetModel} from "../../../application/utils/AssetUtils.js";
import {JsonAsset} from "../../../application/load/JsonAsset.js";
import {SimpleStatus} from "../../../application/setup/SimpleStatus.js";
import {ControlDynamics} from "../../../game/controls/ControlDynamics.js";
import {MATH} from "../../../application/MATH.js";
import {DynamicPoint} from "../../../game/pieces/DynamicPoint.js";


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


        function attachPoints(id, fileName) {
            function attachPointList(data) {
                console.log("Attach Point List", data)
                MATH.emptyArray(dynamicPoints)
                for (let i = 0; i < data.length; i++) {
                    dynamicPoints.push(new DynamicPoint(settings.assetInstance, data[i]))
                }
            }

            new JsonAsset(fileName).subscribe(attachPointList)
        }

        function attachControlDynamic(id, fileName) {

            function dynLoaded(ctrlDyn) {
                controlDynamics[id] = ctrlDyn;
                /*
                function randomChange() {
                //    debugDrawSkeleton(settings.assetInstance)
                    if (Math.random() < 0.05) {
                        ctrlDyn.setTargetState(MATH.randomBetween(ctrlDyn.state.min, ctrlDyn.state.max));
                    }
                }

                ThreeAPI.addPostrenderCallback(randomChange);
*/
            }

            new ControlDynamics(settings.assetInstance, id, fileName, dynLoaded)

        }

        function instantiate(assetFileName, callback) {

            let jsonAsset = new JsonAsset(assetFileName);

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

    getControlDynamic(id) {
        return this.controlDynamics[id];
    }

}

export { AssetInstance }