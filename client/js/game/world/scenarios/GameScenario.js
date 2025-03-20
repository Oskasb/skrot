import {jsonAsset} from "../../../application/utils/AssetUtils.js";
import {MATH} from "../../../application/MATH.js";
import {DomWorldButtonLayer} from "../../../application/ui/dom/DomWorldButtonLayer.js";
import {getCameraControls, getGamePlayer} from "../../../Client.js";
import {getGameWorld} from "../../../application/utils/GameUtils.js";
import {DomMinimap} from "../../../application/ui/dom/DomMinimap.js";
import {ENUMS} from "../../../application/ENUMS.js";
import {getCarrierControl} from "../../player/CarrierControl.js";
import {DomThumbstick} from "../../../application/ui/dom/ui/DomThumbstick.js";
import {activateSites, editSites} from "../sites/SiteSystem.js";
import {DynamicPoint} from "../../pieces/DynamicPoint.js";
import {WeaponCannon} from "../../pieces/weapons/WeaponCannon.js";
import {DomControlButton} from "../../../application/ui/dom/ui/DomControlButton.js";
import {CameraDynamicPoint} from "../../player/CameraDynamicPoint.js";
import {getKeyStates, isPressed, keyToValue} from "../../../application/ui/input/KeyboardState.js";
import {activatePhysicsProbe, debugDrawPhysLodGrid} from "../../../application/physics/PhysicsLodGrid.js";

let minimap = null;

class GameScenario {
    constructor(fileName) {

        let json = null;
        this.json = json;
        const pieces = [];
        const scenarioUi = {};
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



        function loadCarrierControllable(cfg) {

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
                        loadControlable(json)
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

        function loadWorldControllable(cfg) {
            const id = cfg['id'];

            function scenarioPieceLoaded(ctrlPiece) {
                ctrlPiece.addToScene();

                if (cfg['auto_launch']) {
                    hostControllable.detachUi();
                    getGamePlayer().call.setPlayerActiveControllable(ctrlPiece);
                    ctrlPiece.assetInstance.status.setStatusKey(ENUMS.InstanceStatus.STATUS_BRAKE, 0.01);
                    ctrlPiece.assetInstance.status.setStatusKey(ENUMS.InstanceStatus.FLAP_ENGAGE, 1.01);
                    ctrlPiece.assetInstance.status.setStatusKey(ENUMS.InstanceStatus.SLAT_ENGAGE, 1.01);
                    buttonLayer.call.close(buttonLayer);
                } else {
                    pieces.push(ctrlPiece);
                    ctrlPiece.assetInstance.status.setStatusKey(ENUMS.InstanceStatus.STATUS_BRAKE, 0.01);
                    ctrlPiece.assetInstance.status.setStatusKey(ENUMS.InstanceStatus.FLAP_ENGAGE, 1.01);
                    ctrlPiece.assetInstance.status.setStatusKey(ENUMS.InstanceStatus.SLAT_ENGAGE, 1.01);
                    if (json['controllables'].length) {
                        if (json['controllables'].length) {
                            loadControlable(json)
                        }
                    }
                }
            }

            const posArray = cfg['pos'];
            const rotArray = cfg['rot'];
            getGameWorld().call.loadGamePiece(id, scenarioPieceLoaded, posArray, rotArray)
        }

        function loadControlable(json) {
            if (json['controllables'].length) {
                const cfg = json['controllables'].shift()
                if (cfg['point']) {
                    loadCarrierControllable(cfg)
                } else if (cfg['pos']) {
                    loadWorldControllable(cfg)
                }
            }
        }

        function worldLoaded() {
            setTimeout(function() {
                loadControlable(json)
            }, 500)
        }

        function onJson(jsn) {
            json = jsn;

            if (json['keep_ui'] !== true) {
                hostControllable.detachUi();
            }

            if (json['edit_mode'] === true) {
                scenarioUi.thumbstick = new DomThumbstick();
                scenarioUi.trigger    = new DomControlButton();

                const editCannon = new WeaponCannon();
                editCannon.call.applyHardpointOptions(
                    new CameraDynamicPoint(),
                    {
                        "rate": 100,
                        "velocity":1030,
                        "bullet": {
                            "mass": 0.099,
                            "duration": 12,
                            "caliber": 0.02,
                            "spread":8,
                            "hit_fx": ["particles_hit_cannon"]
                        }
                    }
                )


                    const csMap = {};

                    function cannonUiReady() {
                        let keydown = false;
                        function update() {

                            if (isPressed(' ')) {
                                keydown = true;
                                csMap['PRESS'] = 1;
                            } else {
                                if (keydown) {
                                    csMap['PRESS'] = 0;
                                    keydown = false;
                                }
                            }

                            const active = csMap['PRESS'];
                            scenarioUi.trigger.call.update();
                            editCannon.call.onAttachmentStateChange(active);
                            activatePhysicsProbe(getGamePlayer().getPos())

                        //    debugDrawPhysLodGrid()

                        }
                        ThreeAPI.registerPrerenderCallback(update);
                    }

                    scenarioUi.trigger.call.initElement(csMap, 'ui/ui_control_cannon', 'ui_cannon', cannonUiReady)



                function stickReady() {
                    getGamePlayer().call.releasePlayerActiveControllable();
                    editSites()
                }



                const sMap = {
                    camera:ThreeAPI.getCamera(),
                    controls:getCameraControls(),
                    player:getGamePlayer()
                };

                scenarioUi.thumbstick.call.initElement(sMap, 'ui/ui_thumb_stick', 'ui_flight_stick', stickReady)
            }

            if (json['terrain']) {

                function terrainReady() {
                    if (minimap === null) {
                        setTimeout(function () {
                            minimap = new DomMinimap();
                        }, 2000)
                    }
                    activateSites()
                    worldLoaded()
                }

                ThreeAPI.initComputeTerrain(terrainReady)
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