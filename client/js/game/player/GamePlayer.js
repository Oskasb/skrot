import {Object3D} from "../../../../libs/three/Three.Core.js";
import {getGameWorld} from "../../application/utils/GameUtils.js";
import {ENUMS} from "../../application/ENUMS.js";
import {SimpleStatus} from "../../application/setup/SimpleStatus.js";
import {debugDrawControllable, debugDrawDynamicPoints} from "../../application/utils/DebugUtils.js";
import {evt} from "../../application/event/evt.js";
import {MATH} from "../../application/MATH.js";
import {bodyTransformToObj3d} from "../../application/utils/PhysicsUtils.js";
import {getSetting} from "../../application/utils/StatusUtils.js";

class GamePlayer {
    constructor() {

        let obj3d = new Object3D();

        this.status = new SimpleStatus();
        let status = this.status;
        let playerControllable = null;

        function getObj3d() {
            return obj3d;
        }

        function setPlayerActiveControllable(ctrlPiece) {
            status.setStatusKey(ENUMS.PlayerStatus.CONTROLLABLE_ID, ctrlPiece.getStatus(ENUMS.ControllableStatus.CONTROLLABLE_ID));
            playerControllable = ctrlPiece;
            ThreeAPI.threeSetup.addPrerenderCallback(updatePlayer)
        }

        function setControllable(ctrlPiece) {
            ctrlPiece.getAssetInstance().call.addToScene();
            setPlayerActiveControllable(ctrlPiece);

        }

        function activateControllable(controllableId) {
            getGameWorld().call.loadGamePiece(controllableId, setControllable)
        }



        function updatePlayer() {
            let assetObj3d = playerControllable.getAssetInstance().getObj3d();
            bodyTransformToObj3d(assetObj3d.userData.body, obj3d)
            let ui = playerControllable.ui;
            for (let key in ui) {
                ui[key].call.update();
            }

            if (getSetting(ENUMS.Settings.SHOW_PIECE_POINTS) === 1) {
                debugDrawControllable(playerControllable);
            }

        //    debugDrawControllable(playerControllable)
        }

        this.call = {
            getObj3d:getObj3d,
            activateControllable:activateControllable,
            setPlayerActiveControllable:setPlayerActiveControllable
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