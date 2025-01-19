import {JsonAsset} from "../load/JsonAsset.js";
import {
    ammoTranformToObj3d,
    bodyTransformToObj3d,
    calcBoxSubmersion,
    getBodyVelocity,
    getPhysicalWorld,
    rayTest
} from "../utils/PhysicsUtils.js";
import {Vector3, Vector4} from "../../../../libs/three/Three.Core.js";
import {MATH} from "../MATH.js";
import {ENUMS} from "../ENUMS.js";
import {evt} from "../event/evt.js";
import {getFrame} from "../utils/DataUtils.js";
import {jsonAsset} from "../utils/AssetUtils.js";
import {AmmoVehicle} from "./AmmoVehicle.js";
import {Object3D} from "three/webgpu";

let tempVec = new Vector3();

let tempVec2 = new Vector3();
let tempVec3 = new Vector3();

let lineFrom = new Vector3();
let lineTo = new Vector3();

let tempObj = new Object3D();

let lineEvt = {
    from:lineFrom,
    to:lineTo,
    color:"YELLOW"
}

let splashEvt ={
    pos:new Vector3(),
    normal:new Vector3(),
    velocity: new Vector3(),
    hitDot:0
}

class PhysicalModel {
    constructor(obj3d, fileName) {

        let buoyancy = []

        function updateFloatation() {
            splashEvt.velocity.copy(getBodyVelocity(obj3d.userData.body));
            let time = getFrame().gameTime
            for (let i = 0; i < buoyancy.length; i++) {
                tempVec.x = buoyancy[i].pos.x;
                tempVec.y = buoyancy[i].pos.y;
                tempVec.z = buoyancy[i].pos.z;

                let size = buoyancy[i].size;
                let splash = buoyancy[i].splash;

                tempVec.applyQuaternion(obj3d.quaternion);
                tempVec3.copy(tempVec)
                tempVec.add(obj3d.position);

                tempVec2.set(0, 0, 0);

                let waveHeight = Math.cos(time*0.8+(tempVec.x+tempVec.z*0.2)*0.04)*2
                let submersion = calcBoxSubmersion(tempVec.y  + waveHeight, size)

                if (submersion > 0) {
                    tempVec2.y = submersion * 100000 * AmmoAPI.getStepTime();
                    AmmoAPI.applyForceAtPointToBody(tempVec2, tempVec3, obj3d.userData.body)

                    if (splash > Math.random()) {
                        tempVec3.add(obj3d.position)
                        lineFrom.copy(tempVec);
                        lineTo.copy(tempVec3);

                        lineTo.y = 0;

                        MATH.randomVector(tempVec)
                        //    tempVec.set(Math.sin(getFrame().gameTime)*50, 0, Math.cos(getFrame().gameTime)*50)
                        tempVec.multiplyScalar(size);
                        //    tempVec.applyQuaternion(obj3d.quaternion)
                        tempVec.y = 0;
                        //    tempVec.copy(tempVec3);
                        //    tempVec.add(obj3d.position)
                        lineFrom.add(tempVec)
                        lineFrom.y = 0;

                        let hit = rayTest(lineFrom, lineTo, splashEvt.pos, splashEvt.normal, false);

                        if (hit) {
                            tempVec.copy(splashEvt.velocity).normalize();
                            splashEvt.normal.y = 0.5;
                            splashEvt.hitDot = (tempVec.dot(splashEvt.normal)+1)/2
                            if (splashEvt.hitDot > Math.random() * 0.9) {
                                evt.dispatch(ENUMS.Event.SPLASH_OCEAN, splashEvt)
                            }
                        }
                    }

                //    evt.dispatch(ENUMS.Event.DEBUG_DRAW_LINE, lineEvt);

                }
            }
        }

        function updateBodyObj3d() {



        //    if (ammoVehicle !== null) {
        //        console.log(ammoVehicle.processor);
        //    }

            updateFloatation()
        }

        function alignVisualModel() {
            let body = obj3d.userData.body;
            bodyTransformToObj3d(body, obj3d);

            if (ammoVehicle !== null) {
                let vehicle = ammoVehicle.vehicle;
            //    console.log(vehicle);
                vehicle.updateWheelTransformsWS();

                let wheels = vehicle.getNumWheels();
                for (let i = 0; i < wheels; i++) {
                    let ammoTrx = vehicle.getWheelTransformWS(i);
                    ammoTranformToObj3d(ammoTrx, tempObj);

                    lineFrom.copy(tempObj.position);
                    lineTo.set(0, 0, 1);
                    lineTo.applyQuaternion(obj3d.quaternion)
                    lineTo.add(lineFrom);
                    evt.dispatch(ENUMS.Event.DEBUG_DRAW_LINE, lineEvt);
                    evt.dispatch(ENUMS.Event.DEBUG_DRAW_CROSS, {pos:lineFrom, size:0.2, color:'CYAN'});
                }

            }

        }


        let ammoVehicle = null;

        function onConf(config) {
            console.log("Physical Config", config);

            function bodyReadyCB(body) {
                if (config['tuning']) {
                    ammoVehicle = new AmmoVehicle(getPhysicalWorld(), body, config['wheels'], config['tuning'] )
                    console.log("ammoVehicle:", ammoVehicle); // getChassisWorldTransform

                //    body = ammoVehicle.body;
                }
                console.log("body added", body);
                obj3d.userData.body = body;
                AmmoAPI.registerPhysicsStepCallback(updateBodyObj3d)
                ThreeAPI.addPostrenderCallback(alignVisualModel)
            }


            if (config['buoyancy']) {
                for (let i = 0; i < config['buoyancy'].length; i++) {
                    let buoy = config['buoyancy'][i];
                    let point = {
                        pos:new Vector3(),
                        size: buoy.size,
                        splash:buoy.splash || 0
                    };
                    MATH.vec3FromArray(point.pos, buoy.pos)

                    buoyancy[i] = point;
                }
            }

            for (let i = 0; i < config.shapes.length; i++) {
                let conf = config.shapes[i];
                AmmoAPI.setupRigidBody(obj3d, conf['shape'], conf['mass'], conf['friction'], conf['pos'], conf['rot'], conf['scale'], conf['asset'], conf['convex'], conf['children'], bodyReadyCB)
            }
        }

       jsonAsset(fileName, onConf)

    }



}

export { PhysicalModel }