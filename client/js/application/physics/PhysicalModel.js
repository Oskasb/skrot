import {JsonAsset} from "../load/JsonAsset.js";
import {bodyTransformToObj3d, calcBoxSubmersion} from "../utils/PhysicsUtils.js";
import {Vector3, Vector4} from "../../../../libs/three/Three.Core.js";
import {MATH} from "../MATH.js";
import {ENUMS} from "../ENUMS.js";
import {evt} from "../event/evt.js";
import {getFrame} from "../utils/DataUtils.js";

let tempVec = new Vector3();

let tempVec2 = new Vector3();
let tempVec3 = new Vector3();
let lineEvt = {
    from:tempVec,
    to:tempVec3,
    color:"YELLOW"
}

class PhysicalModel {
    constructor(obj3d, fileName) {

        let buoyancy = []

        function updateFloatation() {
            let time = getFrame().gameTime
            for (let i = 0; i < buoyancy.length; i++) {
                tempVec.x = buoyancy[i].x;
                tempVec.y = buoyancy[i].y;
                tempVec.z = buoyancy[i].z;

                tempVec.applyQuaternion(obj3d.quaternion);
                tempVec3.copy(tempVec)
                tempVec.add(obj3d.position);


                tempVec2.set(0, 0, 0);



                let submersion = calcBoxSubmersion(tempVec.y - Math.cos(time*0.8+(tempVec.x+tempVec.z*0.2)*0.04)*3, buoyancy[i].w);
                tempVec2.y = submersion * 100000 * AmmoAPI.getStepTime();
                AmmoAPI.applyForceAtPointToBody(tempVec2, tempVec3, obj3d.userData.body)
                tempVec3.set(0, submersion*0.05, 0);
                tempVec3.add(tempVec)
                evt.dispatch(ENUMS.Event.DEBUG_DRAW_LINE, lineEvt);

            }
        }

        function updateBodyObj3d() {
            updateFloatation()
        }

        function alignVisualModel() {
            let body = obj3d.userData.body;
            bodyTransformToObj3d(body, obj3d);
        }

        function bodyReadyCB(body) {
            console.log("body added", body);
            obj3d.userData.body = body;
            AmmoAPI.registerPhysicsStepCallback(updateBodyObj3d)
            ThreeAPI.addPostrenderCallback(alignVisualModel)
        }


        function onConf(config) {
            console.log("Physical Config", config);

            if (config['buoyancy']) {
                for (let i = 0; i < config['buoyancy'].length; i++) {
                    let buoy = config['buoyancy'][i];
                    let point = new Vector4();
                    MATH.vec3FromArray(point, buoy.pos)
                    point.w = buoy.size;
                    buoyancy[i] = point;
                }
            }

            for (let i = 0; i < config.shapes.length; i++) {
                let conf = config.shapes[i];
                AmmoAPI.setupRigidBody(obj3d, conf['shape'], conf['mass'], conf['friction'], conf['pos'], conf['rot'], conf['scale'], conf['asset'], conf['convex'], conf['children'], bodyReadyCB)
            }
        }

        new JsonAsset(fileName).subscribe(onConf)

    }



}

export { PhysicalModel }