import {jsonAsset} from "../../../application/utils/AssetUtils.js";
import {MATH} from "../../../application/MATH.js";
import {DomWorldButtonLayer} from "../../../application/ui/dom/DomWorldButtonLayer.js";
import {getGamePlayer} from "../../../Client.js";
import {getGameWorld} from "../../../application/utils/GameUtils.js";
import {DomMinimap} from "../../../application/ui/dom/DomMinimap.js";
import {ENUMS} from "../../../application/ENUMS.js";
import {getCarrierControl} from "../../player/CarrierControl.js";

let minimap = null;

class GameScenario {
    constructor(fileName) {

        let json = null;
        this.json = json;
        const pieces = [];

        const hostControllable = getGamePlayer().call.getPlayerControllable();

        function worldElementClick(e) {

            hostControllable.detachUi();
            console.log("Click Controllable Button", e.target.value);
            getGamePlayer().call.setPlayerActiveControllable(e.target.value);
            buttonLayer.call.close(buttonLayer);
        }
        const buttonLayer = new DomWorldButtonLayer();
        buttonLayer.initWorldButtonLayer(pieces, 'PICK', worldElementClick);



        function loadControllable(cfg) {

            const id = cfg['id'];
            const pointId = cfg['point'];
            const point = hostControllable.getDynamicPoint(pointId);

            const status = cfg['status'];

            const ctrl = getCarrierControl();

            if (status) {
                for (let i = 0; i < status.length; i++) {
                    ctrl.call.setInstanceStatus(status[i].key, status[i].value);
                }
            }

            function scenarioPieceLoaded(ctrlPiece) {
                ctrlPiece.addToScene();
                ctrlPiece.attachPieceToDynamicPoint(point);
                pieces.push(ctrlPiece);
                ctrlPiece.assetInstance.status.setStatusKey(ENUMS.InstanceStatus.STATUS_BRAKE, 0.01);
                ctrlPiece.assetInstance.status.setStatusKey(ENUMS.InstanceStatus.FLAP_ENGAGE, 1.01);
                ctrlPiece.assetInstance.status.setStatusKey(ENUMS.InstanceStatus.SLAT_ENGAGE, 1.01);
                if (json['controllables'].length) {
                    loadControllable(json['controllables'].pop())
                }
            }

            point.updateDynamicPoint(0.05)
            const posArray = [];
            const rotArray = [];
            MATH.vec3ToArray(point.getPos(), posArray);
            MATH.rotObj3dToArray(point.getObj3d(), rotArray);
            getGameWorld().call.loadGamePiece(id, scenarioPieceLoaded, posArray, rotArray)
        }

        function worldLoaded() {

            if (json['controllables'].length) {
                loadControllable(json['controllables'].pop())
            }
        }

        function onJson(jsn) {
            json = jsn;
            if (json['terrain']) {

                if (minimap === null) {
                    minimap = new DomMinimap();
                }
                ThreeAPI.initComputeTerrain(worldLoaded)
            } else {
                worldLoaded();
            }
        }

        function close() {
            while (pieces.length) {
                const piece = pieces.pop();
                piece.closeControllablePiece();
            }
        }

        this.call = {
            close:close
        }


        jsonAsset(fileName, onJson)

    }

}

export { GameScenario }