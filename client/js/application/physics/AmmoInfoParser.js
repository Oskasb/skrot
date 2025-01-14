import {Euler, Quaternion, Vector3} from "../../../../libs/three/Three.Core.js";
import {MATH} from "../MATH.js";

let count = 0;
let quat = new Quaternion();
let propertyMap = {
    deltaRotation:{key:'transform', funcName:'getRotation', delta:true },
    rotation:     {key:'transform', funcName:'getRotation', delta:false}
};
class AmmoInfoParser {
    constructor(info, transform) {
        this.nr = count;
        count++;
        this.euler = new Euler();
        this.calcQuat = new Quaternion();
        this.lastQuat = new Quaternion();
        this.axisVec = new Vector3();
        this.info = info;
        this.transform = transform;
        this.lastAngle = 0;
        this.value = 0;
        this.total = 0;
    };

    setTransform(transform) {
        this.transform = transform;
    };

    updateValue(property, vQuat) {

        let prop = propertyMap[property];
        let ammoQuat = this[prop.key][prop.funcName]();

        quat.x = ammoQuat.x();
        quat.y = ammoQuat.y();
        quat.z = ammoQuat.z();
        quat.w = ammoQuat.w();

        quat.conjugate();
        quat.multiply(vQuat);

        this.euler.setFromQuaternion(quat);

        let angle = -MATH.subAngles(MATH.nearestAngle(this.euler.x), MATH.nearestAngle(this.lastAngle)); // (MATH.TWO_PI);

        this.lastAngle = this.euler.x;

        this.value = angle;
        this.total += angle;

        if (prop.delta) {
            return this.value;
        } else {
            return this.total;
        }

    };

    getValue = function (property) {

        let prop = propertyMap[property];

        if (prop.delta) {
            return this.value;
        } else {
            return this.total;
        }

    };

}

export { AmmoInfoParser }