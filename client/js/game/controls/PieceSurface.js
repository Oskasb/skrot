import {Quaternion, Vector3} from "../../../../libs/three/Three.Core.js";
import {MATH} from "../../application/MATH.js";
import {SimpleStatus} from "../../application/setup/SimpleStatus.js";
import {Object3D} from "three/webgpu";
import {ENUMS} from "../../application/ENUMS.js";
import {getSetting} from "../../application/utils/StatusUtils.js";
import {evt} from "../../application/event/evt.js";
import {createGeometryInstance} from "../../3d/three/assets/GeometryInstance.js";

const tempObj = new Object3D();
const tempObj2 = new Object3D();
const tempVec = new Vector3();
const tempVec2 = new Vector3();
const tempQuat = new Quaternion();
const tempQuat2 = new Quaternion();
const tempQuat3 = new Quaternion();
class PieceSurface {
    constructor(controllablePiece, pointName, json) {
        this.controllablePiece = controllablePiece;
        this.status = new SimpleStatus()
        this.id = pointName;
        this.trxLocalObj = new Object3D();
        this.json = json;
        this.size = json.size;
        this.scale = new Vector3();
        this.velocity = new Vector3();
        this.normal = new Vector3();
        this.quat = new Quaternion();
        MATH.vec3FromArray(this.scale, this.size);
    }

    updateSurfacePointStatus(point, frameTransform) {

        MATH.transformToLocalSpace(point.getObj3d(), frameTransform, this.trxLocalObj)
        const pos = this.trxLocalObj.position;
    //    this.quat.copy(this.trxLocalObj.quaternion);
        this.quat.copy(this.trxLocalObj.quaternion)


        if (point.json['sample']) {
            tempObj2.quaternion.copy(this.quat);
            for (let i = 0; i <point.json.sample.length; i++) {
                const sample = point.json.sample[i];
                let value = 0;
                if (sample['dynamic']) {
                    const dynamic = this.controllablePiece.assetInstance.getControlDynamicByName(sample['dynamic'])
                    value = dynamic.getControlValue()
                }
                if (sample['axis']) {
                    tempObj2[sample['axis']](sample['factor'] * value);
                }
            }

            this.quat.copy(tempObj2.quaternion)
        }

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
        this.status.setStatusKey(ENUMS.SurfaceStatus.QUAT_X, this.quat.x);
        this.status.setStatusKey(ENUMS.SurfaceStatus.QUAT_Y, this.quat.y);
        this.status.setStatusKey(ENUMS.SurfaceStatus.QUAT_Z, this.quat.z);
        this.status.setStatusKey(ENUMS.SurfaceStatus.QUAT_W, this.quat.w);

        this.normal.set(0, 1, 0);

        this.normal.applyQuaternion(this.quat)
        this.status.setStatusKey(ENUMS.SurfaceStatus.NORMAL_X,  this.normal.x);
        this.status.setStatusKey(ENUMS.SurfaceStatus.NORMAL_Y,  this.normal.y);
        this.status.setStatusKey(ENUMS.SurfaceStatus.NORMAL_Z,  this.normal.z);



    //    tempVec2.set(0, 0, 1);
    //    tempVec2.applyQuaternion(frameTransform.quaternion);

        tempVec.copy(this.velocity).normalize();

        tempQuat.copy(frameTransform.quaternion)
        tempQuat.multiply(this.quat);
        tempQuat.conjugate()

        tempVec.applyQuaternion(tempQuat);

    /*
        let upness = tempVec.dot(this.normal) * -1 //Math.sign(southness);
        tempVec2.set(1, 0, 0);
        tempVec2.applyQuaternion(tempQuat);
        let rightness = tempVec.dot(tempVec2) * - 1 // forwardness;
*/
        this.status.setStatusKey(ENUMS.SurfaceStatus.AOA_X,  -tempVec.y*3.14);

        this.status.setStatusKey(ENUMS.SurfaceStatus.AOA_Y,   -tempVec.x*3.14);

        if (getSetting(ENUMS.Settings.SHOW_FLIGHT_FORCES) === 1) {
            tempObj.position.copy(point.getPos())
            tempObj.scale.copy(this.scale)
            tempObj.quaternion.copy(frameTransform.quaternion)
            tempObj.quaternion.multiply(this.quat);

            /*
            if (!this.geometryInstance) {
                this.geometryInstance = createGeometryInstance("box", 'material_props_opaque');
                this.geometryInstance.call.applyTrxObj(tempObj);
            }
             */

            tempVec.set(0, 0, 1);
            tempVec.applyQuaternion(point.getQuat());
            tempVec.add(point.getPos());

            tempVec2.copy(this.normal)
            tempVec2.applyQuaternion(frameTransform.quaternion)
            tempVec2.add(tempVec)
            evt.dispatch(ENUMS.Event.DEBUG_DRAW_LINE, {from:tempVec, to:tempVec2, color:'BLUE'});

            tempVec2.set( 0, this.status.getStatus(ENUMS.SurfaceStatus.AOA_X), 0)
            tempVec2.applyQuaternion(frameTransform.quaternion)
            tempVec2.add(tempVec)
            evt.dispatch(ENUMS.Event.DEBUG_DRAW_LINE, {from:tempVec, to:tempVec2, color:'GREEN'});
            tempVec2.set( this.status.getStatus(ENUMS.SurfaceStatus.AOA_Y), 0,  0)
            tempVec2.applyQuaternion(frameTransform.quaternion)
            tempVec2.add(tempVec)
            evt.dispatch(ENUMS.Event.DEBUG_DRAW_LINE, {from:tempVec, to:tempVec2, color:'RED'});
        } else {
            if (this.geometryInstance) {
                this.geometryInstance.call.closeGeoInstance();
                this.geometryInstance = null;
            }
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