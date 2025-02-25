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
            const ctrlPiece = e.target.value
            hostControllable.detachUi();
            console.log("Click Controllable Button", ctrlPiece);
            getGamePlayer().call.setPlayerActiveControllable(ctrlPiece);
            buttonLayer.call.close(buttonLayer);

            const ctrl = getCarrierControl();
            setTimeout(function() {
                const point = ctrlPiece.assetInstance.call.getObj3d().userData.attachedToPoint;
                ctrl.call.activateCatapultPoint(point, ctrlPiece)
            }, 5000)

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

                if (cfg['auto_launch']) {
                    hostControllable.detachUi();
                    getGamePlayer().call.setPlayerActiveControllable(ctrlPiece);
                    ctrlPiece.assetInstance.status.setStatusKey(ENUMS.InstanceStatus.STATUS_BRAKE, 0.01);
                    ctrlPiece.assetInstance.status.setStatusKey(ENUMS.InstanceStatus.FLAP_ENGAGE, 1.01);
                    ctrlPiece.assetInstance.status.setStatusKey(ENUMS.InstanceStatus.SLAT_ENGAGE, 1.01);
                    buttonLayer.call.close(buttonLayer);

                    setTimeout(function() {
                        ctrl.call.activateCatapultPoint(point, ctrlPiece)
                    }, 8000)

                } else {
                    pieces.push(ctrlPiece);
                    ctrlPiece.assetInstance.status.setStatusKey(ENUMS.InstanceStatus.STATUS_BRAKE, 0.01);
                    ctrlPiece.assetInstance.status.setStatusKey(ENUMS.InstanceStatus.FLAP_ENGAGE, 1.01);
                    ctrlPiece.assetInstance.status.setStatusKey(ENUMS.InstanceStatus.SLAT_ENGAGE, 1.01);
                    if (json['controllables'].length) {
                     //   setTimeout(function() {
                            if (json['controllables'].length) {
                                loadControllable(json['controllables'].shift())
                            }
                     //   }, 1000)
                    }
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
            setTimeout(function() {
                if (json['controllables'].length) {
                    loadControllable(json['controllables'].shift())
                }
            }, 2000)
        }

        function onJson(jsn) {
            json = jsn;

            if (json['keep_ui'] !== true) {
                hostControllable.detachUi();
            }

            if (json['terrain']) {
                if (minimap === null) {
                    setTimeout(function () {
                        minimap = new DomMinimap();
                    }, 5000)
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