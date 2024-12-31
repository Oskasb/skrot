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

        function getObj3d() {
            return obj3d;
        }

        function setControllable(ctrlPiece) {
            ctrlPiece.getAssetInstance().call.addToScene();
            ctrlPiece.getAssetInstance().call.getObj3d().position.y = 23.3
            status.setStatusKey(ENUMS.PlayerStatus.CONTROLLABLE_ID, ctrlPiece.getStatus(ENUMS.ControllableStatus.CONTROLLABLE_ID));


            let ui = ctrlPiece.ui;



            function debugDrawControllable() {
            //    debugDrawDynamicPoints(ctrlPiece.getAssetInstance().dynamicPoints)

                MATH.randomVector(obj3d.position)
                obj3d.position.y -=20;
                obj3d.position.add(ctrlPiece.getAssetInstance().call.getObj3d().position)
            //    evt.dispatch(ENUMS.Event.DEBUG_DRAW_LINE, {from: ctrlPiece.getAssetInstance().call.getObj3d().position, to:  obj3d.position, color:'GREEN'})

            //    console.log("Update Ui state")
                for (let key in ui) {
                    ui[key].call.update();
                }

            }

            ThreeAPI.registerPrerenderCallback(debugDrawControllable)

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