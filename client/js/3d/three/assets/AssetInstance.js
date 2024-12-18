import {Object3D} from "../../../../../libs/three/Three.Core.js";
import {debugDrawSkeleton, loadAssetModel} from "../../../application/utils/AssetUtils.js";
import {JsonAsset} from "../../../application/load/JsonAsset.js";
import {SimpleStatus} from "../../../application/setup/SimpleStatus.js";
import {PieceControl} from "../../../game/controls/PieceControl.js";
import {ControlDynamics} from "../../../game/controls/ControlDynamics.js";
import {MATH} from "../../../application/MATH.js";
import {DynamicPoint} from "../../../game/pieces/DynamicPoint.js";
import {ENUMS} from "../../../application/ENUMS.js";
import {evt} from "../../../application/event/evt.js";
import {ControlState} from "../../../game/controls/ControlState.js";

class AssetInstance {
    constructor () {

        let obj3d = new Object3D();
        let settings = {
            assetInstance:this
        };

        let status = new SimpleStatus();
        this.status = status;

        let controls = [];
        this.controls = controls;

        let controlDynamics = {};
        this.controlDynamics = controlDynamics;

        let dynamicPoints = [];
        this.dynamicPoints = dynamicPoints;

        function attachControls(id, fileName) {
            function attachControlList(data) {
                console.log("Attach Controls List", data)
                MATH.emptyArray(controls)
                for (let i = 0; i < data.length; i++) {
                    controls.push(new ControlState(settings.assetInstance, data[i]))
                }
            }

            new JsonAsset(fileName).subscribe(attachControlList)
        }

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

                function randomChange() {
                //    debugDrawSkeleton(settings.assetInstance)
                    if (Math.random() < 0.05) {
                        ctrlDyn.setTargetState(MATH.randomBetween(ctrlDyn.state.min, ctrlDyn.state.max));
                    }
                }

                ThreeAPI.addPostrenderCallback(randomChange);

            }

            new ControlDynamics(settings.assetInstance, id, fileName, dynLoaded)

        }

        function instantiate(assetFileName, callback) {

            let jsonAsset = new JsonAsset(assetFileName);

            function onJsonLoaded(data) {
                settings.json = data;
                let modelName = settings.json.model;



                function modelLoaded(modelObj3d) {




                    let controls = data['controls'];

                    if (controls.length) {
                        for (let i = 0; i < controls.length; i++) {
                            attachControls(controls[i].id, controls[i].file)
                        }
                    }


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

}

export { AssetInstance }