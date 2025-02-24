import {getGamePlayer} from "../../Client.js";
import {ENUMS} from "../../application/ENUMS.js";
import {getFrame} from "../../application/utils/DataUtils.js";
import {getSetting} from "../../application/utils/StatusUtils.js";
import {debugDrawControllable} from "../../application/utils/DebugUtils.js";
import {MATH} from "../../application/MATH.js";

const carrierControls = [];

function getCvnControlById(id) {
    MATH.getFromArrayByKey(carrierControls, 'cvnId', id);
}

class CarrierControl {
    constructor(cvn) {
        carrierControls.push(this);
        this.cvnId = cvn.getStatus(ENUMS.ControllableStatus.CONTROLLABLE_ID);

        function playerControl(bool) {
            if (bool === true) {
                getGamePlayer().call.setPlayerActiveControllable(cvn);
            }
        }

        function setInstanceStatus(key, value) {
            cvn.assetInstance.status.setStatusKey(key, value);
        }

        function activateCatapultPoint(point, ctrlPiece) {

            function onEnded() {
                ctrlPiece.assetInstance.call.detachFromPoint();
            }

            point.call.transitionPosForward(114, 2, onEnded)

        }

        this.call = {
            playerControl:playerControl,
            setInstanceStatus:setInstanceStatus,
            activateCatapultPoint:activateCatapultPoint
        }

        function updatePhys() {
            cvn.assetInstance.status.setStatusKey(ENUMS.InstanceStatus.RADAR_SPIN, getFrame().gameTime)
            let obj3d = cvn.getObj3d();
            let body = obj3d.userData.body;
            ThreeAPI.tempVec3.set(0, 0, -9999999);
            ThreeAPI.tempVec3.applyQuaternion(obj3d.quaternion);
            ThreeAPI.tempVec3b.set(-0, -4, -100);
            ThreeAPI.tempVec3b.applyQuaternion(obj3d.quaternion);
            //    ThreeAPI.tempVec3b.add(obj3d.position)
            AmmoAPI.applyForceAtPointToBody(ThreeAPI.tempVec3, ThreeAPI.tempVec3b, body)
            if (getSetting(ENUMS.Settings.SHOW_PIECE_POINTS) === 1) {
                debugDrawControllable(cvn);
            }
        }

        AmmoAPI.registerPhysicsStepCallback(updatePhys)
    }

}

function getCarrierControl(id) {
    if (!id) {
        return carrierControls[0]
    } else {
        return getCvnControlById(id)
    }
}

export {
    CarrierControl,
    getCarrierControl
}