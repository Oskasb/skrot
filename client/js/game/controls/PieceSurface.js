import {Quaternion, Vector3} from "../../../../libs/three/Three.Core.js";
import {MATH} from "../../application/MATH.js";
import {SimpleStatus} from "../../application/setup/SimpleStatus.js";
import {Object3D} from "three/webgpu";
import {ENUMS} from "../../application/ENUMS.js";
import {getSetting} from "../../application/utils/StatusUtils.js";

const tempObj = new Object3D();
const tempVec = new Vector3();
const tempQuat = new Quaternion();
const tempQuat2 = new Quaternion();
const tempQuat3 = new Quaternion();
class PieceSurface {
    constructor(pointName, json) {
        this.status = new SimpleStatus()
        this.id = pointName;
        this.trxLocalObj = new Object3D();
        this.json = json;
        this.size = json.size;
        this.scale = new Vector3();
        this.velocity = new Vector3();
        this.normal = new Vector3();
        MATH.vec3FromArray(this.scale, this.size);
    }

    updateSurfacePointStatus(point, frameTransform) {
        tempVec.set(0, 1, 0);
        tempVec.applyQuaternion(frameTransform.quaternion);
        point.updateDynamicPoint();
        MATH.transformToLocalSpace(point.getObj3d(), frameTransform, this.trxLocalObj)
        const pos = this.trxLocalObj.position;
        const quat = this.trxLocalObj.quaternion;

        this.normal.set(0, 1, 0);
        this.normal.applyQuaternion(point.getQuat())
        this.velocity.copy(point.getVel());

        this.status.setStatusKey(ENUMS.SurfaceStatus.POS_X, pos.x);
        this.status.setStatusKey(ENUMS.SurfaceStatus.POS_Y, pos.y);
        this.status.setStatusKey(ENUMS.SurfaceStatus.POS_Z, pos.z);
        this.status.setStatusKey(ENUMS.SurfaceStatus.SCALE_X, this.scale.x);
        this.status.setStatusKey(ENUMS.SurfaceStatus.SCALE_Y, this.scale.y);
        this.status.setStatusKey(ENUMS.SurfaceStatus.SCALE_Z, this.scale.z);
        this.status.setStatusKey(ENUMS.SurfaceStatus.VEL_X, this.velocity.x);
        this.status.setStatusKey(ENUMS.SurfaceStatus.VEL_Y, this.velocity.y);
        this.status.setStatusKey(ENUMS.SurfaceStatus.VEL_Z, this.velocity.z);
        this.status.setStatusKey(ENUMS.SurfaceStatus.QUAT_X, quat.x);
        this.status.setStatusKey(ENUMS.SurfaceStatus.QUAT_Y, quat.y);
        this.status.setStatusKey(ENUMS.SurfaceStatus.QUAT_Z, quat.z);
        this.status.setStatusKey(ENUMS.SurfaceStatus.QUAT_W, quat.w);
        this.status.setStatusKey(ENUMS.SurfaceStatus.NORMAL_X,  this.normal.x);
        this.status.setStatusKey(ENUMS.SurfaceStatus.NORMAL_Y,  this.normal.y);
        this.status.setStatusKey(ENUMS.SurfaceStatus.NORMAL_Z,  this.normal.z);
    //    tempObj.up.copy(point.getObj3d().up)
        tempObj.lookAt(this.velocity);
        tempObj.rotateX(-this.trxLocalObj.rotation.x)
        this.status.setStatusKey(ENUMS.SurfaceStatus.AOA_X,  tempObj.rotation.x);
        
        tempObj.lookAt(this.velocity);
        tempObj.rotateY(-this.trxLocalObj.rotation.y)
        this.status.setStatusKey(ENUMS.SurfaceStatus.AOA_Y,  tempObj.rotation.y);


        if (getSetting(ENUMS.Settings.SHOW_FLIGHT_FORCES) === 1) {



        }

    }

    setStatusKey(key, value) {
        this.status.setStatusKey(key, value);
    }

    getStatus(key) {
        return this.status.getStatus(key);
    }

}

export { PieceSurface };