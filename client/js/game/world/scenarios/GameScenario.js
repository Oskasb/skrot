import {jsonAsset} from "../../../application/utils/AssetUtils.js";
import {MATH} from "../../../application/MATH.js";
import {DomWorldButtonLayer} from "../../../application/ui/dom/DomWorldButtonLayer.js";
import {getGamePlayer} from "../../../Client.js";
import {getGameWorld} from "../../../application/utils/GameUtils.js";



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


        function scenarioPieceLoaded(ctrlPiece) {
            ctrlPiece.addToScene();
            pieces.push(ctrlPiece);
            if (json['controllables'].length) {
                loadControllable(json['controllables'].pop())
            }
        }

        function loadControllable(cfg) {
            const id = cfg['id'];
            const pointId = cfg['point'];
            const point = hostControllable.getDynamicPoint(pointId);
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