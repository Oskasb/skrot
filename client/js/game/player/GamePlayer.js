import {Object3D} from "../../../../libs/three/Three.Core.js";
import {getGameWorld} from "../../application/utils/GameUtils.js";
import {ENUMS} from "../../application/ENUMS.js";
import {SimpleStatus} from "../../application/setup/SimpleStatus.js";
import {debugDrawDynamicPoints} from "../../application/utils/DebugUtils.js";
import {evt} from "../../application/event/evt.js";
import {MATH} from "../../application/MATH.js";

class GamePlayer {
    constructor() {

        let obj3d = new Object3D();

        this.status = new SimpleStatus();
        let status = this.status;
        let playerControllable = null;

        function getObj3d() {
            return obj3d;
        }

        function setControllable(ctrlPiece) {
            ctrlPiece.getAssetInstance().call.addToScene();
            status.setStatusKey(ENUMS.PlayerStatus.CONTROLLABLE_ID, ctrlPiece.getStatus(ENUMS.ControllableStatus.CONTROLLABLE_ID));
            playerControllable = ctrlPiece;
            ThreeAPI.registerPrerenderCallback(updatePlayer)
        }

        function activateControllable(controllableId) {
            getGameWorld().call.loadGamePiece(controllableId, setControllable)
        }

        function debugDrawControllable() {
            debugDrawDynamicPoints(playerControllable.getAssetInstance().dynamicPoints)
        }

        function updatePlayer() {
            obj3d.position.copy(playerControllable.getAssetInstance().call.getObj3d().position)
            obj3d.quaternion.copy(playerControllable.getAssetInstance().call.getObj3d().quaternion)
            let ui = playerControllable.ui;
            for (let key in ui) {
                ui[key].call.update();
            }
            debugDrawControllable()
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

    getStatus(key) {
        return this.status.getStatus(key);
    }

    setStatusKey(key, status) {
        this.status.setStatusKey(key, status);
    }

    enterWorld(controllableId) {
        this.call.activateControllable(controllableId);
    }

}

export {GamePlayer}