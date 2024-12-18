import {Object3D} from "../../../../libs/three/Three.Core.js";
import {getGameWorld} from "../../application/utils/GameUtils.js";

class GamePlayer {
    constructor() {

        let obj3d = new Object3D();

        let statusMap = {};
        this.statusMap = statusMap;

        function getObj3d() {
            return obj3d;
        }

        function setControllable(ctrlPiece) {
            ctrlPiece.getAssetInstance.call.addToScene();
            ctrlPiece.getAssetInstance.call.getObj3d().position.y += 4
            statusMap[ENUMS.PlayerStatus.CONTROLLABLE_ID] = ctrlPiece.getStatus(ENUMS.ControllableStatus.CONTROLLABLE_ID);
        }

        function activateControllable(controllableId) {
            getGameWorld().call.loadGamePiece(controllableId, setControllable)

        }

        this.call = {
            getObj3d:getObj3d,
            activateControllable:activateControllable
        }

    }

    getPos() {
        return this.call.getObj3d().position;
    }

    getQuat() {
        return this.call.getObj3d().quaternion;
    }


    enterWorld(controllableId) {
        this.call.activateControllable(controllableId);
    }

}

export {GamePlayer}