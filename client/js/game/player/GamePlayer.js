import {Object3D} from "../../../../libs/three/Three.Core.js";
import {getGameWorld} from "../../application/utils/GameUtils.js";
import {ENUMS} from "../../application/ENUMS.js";
import {SimpleStatus} from "../../application/setup/SimpleStatus.js";
import {debugDrawControllable, debugDrawDynamicPoints} from "../../application/utils/DebugUtils.js";
import {evt} from "../../application/event/evt.js";
import {MATH} from "../../application/MATH.js";
import {bodyTransformToObj3d} from "../../application/utils/PhysicsUtils.js";
import {getSetting} from "../../application/utils/StatusUtils.js";
import {DomInspectAerodynamics} from "../../application/ui/dom/inspect/DomInspectAerodynamics.js";
import {getGamePlayer} from "../../Client.js";
import {Vector3} from "three/webgpu";

let viewAerodynamics = false;
const tempVec = new Vector3();

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

        function releasePlayerActiveControllable() {
            status.setStatusKey(ENUMS.PlayerStatus.CONTROLLABLE_ID, "");
            playerControllable = null;
            ThreeAPI.threeSetup.removePrerenderCallback(updatePlayer);
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

            if (getSetting(ENUMS.Settings.SHOW_FLIGHT_FORCES) !== 0) {
                if (viewAerodynamics === false) {
                    new DomInspectAerodynamics(playerControllable)
                    viewAerodynamics = true;
                }
            } else {
                if (viewAerodynamics === true) {
                    viewAerodynamics = false
                }
            }

        //    debugDrawControllable(playerControllable)
        }

        function getPlayerControllable() {
            return playerControllable;
        }

        this.call = {
            getObj3d:getObj3d,
            activateControllable:activateControllable,
            setPlayerActiveControllable:setPlayerActiveControllable,
            releasePlayerActiveControllable:releasePlayerActiveControllable,
            getPlayerControllable:getPlayerControllable
        }

    }

    getObj3d() {
        return this.call.getObj3d()
    }
    getVel() {
        return tempVec
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