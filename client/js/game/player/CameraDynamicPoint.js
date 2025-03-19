import {Vector3} from "three/webgpu";
import {Object3D} from "../../../../libs/three/core/Object3D.js";

const tempVec = new Vector3()

class CameraDynamicPoint {
    constructor() {
        this.obj3d = new Object3D();

    }

    updateDynamicPoint() {

    }

    getObj3d() {
        this.obj3d.position.copy(ThreeAPI.getCamera().position);
        this.obj3d.quaternion.copy(ThreeAPI.getCamera().quaternion);
        this.obj3d.rotateX(Math.PI)
        tempVec.set(-2, 1, 0)
        tempVec.applyQuaternion(this.obj3d.quaternion);
        this.obj3d.position.add(tempVec);
        return this.obj3d
    }

    getVel() {
        tempVec.set(0, 0, 0)
        return tempVec;
    }

}

export { CameraDynamicPoint }