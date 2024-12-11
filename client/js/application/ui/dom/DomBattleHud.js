import {poolFetch, poolReturn} from "../../utils/PoolUtils.js";
import {ENUMS} from "../../ENUMS.js";
import {getPlayerStatus, getSetting} from "../../utils/StatusUtils.js";
import {getPlayerActor} from "../../utils/ActorUtils.js";
import {DomWorldButtonLayer} from "./DomWorldButtonLayer.js";
import {elementColorMap} from "../../../game/visuals/Colors.js";


class DomBattleHud {
    constructor() {

        let battleDetailsElement = null;
        let statusMap = {};

        let playerActor = null;
        let hasTurnActor = null;
        let encounter = null;
        let selectionButtonLayer = null;

        let bottomContainer = null;
        let centerContainer = null;
        let topContainer = null;

        let attitudeClass = null;

        function onButtonSelect(e) {
            let selectedActor = e.target.value;
            let sequencerSelection = playerActor.getStatus(ENUMS.ActorStatus.SELECTED_TARGET);
            if (sequencerSelection) {
                let preActor = GameAPI.getActorById(sequencerSelection);
                console.log("sequencer selection pre: ", preActor);
                preActor.setStatusKey(ENUMS.ActorStatus.SEQUENCER_SELECTED, false);
            }

            selectedActor.setStatusKey(ENUMS.ActorStatus.SEQUENCER_SELECTED, true);
            playerActor.setStatusKey(ENUMS.ActorStatus.SELECTED_TARGET, selectedActor.getStatus(ENUMS.ActorStatus.ACTOR_ID));
            console.log("DomBattleHud onButtonSelect", selectedActor);
        }

        function update() {

            statusMap['player_update_index'] = getPlayerActor().getStatus(ENUMS.ActorStatus.ENCOUNTER_UPDATE_INDEX);

            if (statusMap[ENUMS.Settings.BATTLE_BUTTON_LAYER] !== getSetting(ENUMS.Settings.BATTLE_BUTTON_LAYER)) {
                statusMap[ENUMS.Settings.BATTLE_BUTTON_LAYER] = getSetting(ENUMS.Settings.BATTLE_BUTTON_LAYER)
                if (statusMap[ENUMS.Settings.BATTLE_BUTTON_LAYER] === 1) {
                    selectionButtonLayer = poolFetch('DomWorldButtonLayer');
                    let actorList = GameAPI.getActorList()
                    selectionButtonLayer.initWorldButtonLayer(actorList, "Select", onButtonSelect)
                } else {
                    if (selectionButtonLayer !== null) {
                        selectionButtonLayer.closeWorldButtonLayer();
                        selectionButtonLayer = null;
                    }
                }

            }

            for (let key in ENUMS.EncounterStatus) {
                statusMap[key] = encounter.getStatus(ENUMS.EncounterStatus[key]);
            }

            if (statusMap[ENUMS.EncounterStatus.PLAYER_VICTORY]) {
                statusMap['has_turn_info'] = "VICTORY";
                return;
            }

            if (statusMap[ENUMS.EncounterStatus.HAS_TURN_ACTOR] !== statusMap['has_turn_id']) {
                let hadTurnActor = GameAPI.getActorById(statusMap['has_turn_id']);
                if (hadTurnActor) {
                //    let alignment = hadTurnActor.getStatus(ENUMS.ActorStatus.ATTITUDE);
                }
                statusMap['has_turn_id'] = statusMap[ENUMS.EncounterStatus.HAS_TURN_ACTOR]
                hasTurnActor = GameAPI.getActorById(statusMap['has_turn_id']);

                if (attitudeClass !== null) {
                    DomUtils.removeElementClass(bottomContainer, attitudeClass);
                }



                centerContainer.style.transitionDuration = "0.5s";

                let turnIndex = statusMap["TURN_INDEX"]

                if (hasTurnActor) {

                    DomUtils.transformElement3DPercent(centerContainer, 0, 0, 0, 0, 1);
                    statusMap['has_turn_name'] = hasTurnActor.getStatus(ENUMS.ActorStatus.NAME);
                    if (hasTurnActor === playerActor) {
                        statusMap['has_turn_info'] = "YOUR TURN (round:"+turnIndex+")";
                        attitudeClass = null;
                        centerContainer.style.color = "rgb(255, 255, 255)";
                        setTimeout(function() {
                            centerContainer.style.transitionDuration = "1.2s";

                            DomUtils.transformElement3DPercent(centerContainer, 0, 1000, 0, -10, 0);
                        }, 1400)

                    } else {
                        let attitude = hasTurnActor.getStatus(ENUMS.ActorStatus.ATTITUDE);
                        statusMap['has_turn_info'] = attitude+" TURN (round:"+turnIndex+")";
                        attitudeClass = 'background_'+attitude;
                        DomUtils.addElementClass(bottomContainer, attitudeClass);
                        let rgba = elementColorMap[attitude]

                        centerContainer.style.color = "rgb("+255*rgba.r+", "+255*rgba.g+ ", "+255*rgba.b+")";
                        setTimeout(function() {
                            centerContainer.style.transitionDuration = "1.5s";
                            DomUtils.transformElement3DPercent(centerContainer, 0, 150, 0, 0, 1);
                        }, 2000)

                    }
                } else {
                //    statusMap['has_turn_info'] = "PASSING TURN";
                    centerContainer.style.transitionDuration = "0.2s";
                    DomUtils.transformElement3DPercent(centerContainer, 0, 1000, 0, 10, 0);
                }

            }



        }

        function close() {

            if (battleDetailsElement !== null) {
                ThreeAPI.unregisterPrerenderCallback(update);
                battleDetailsElement.closeHtmlElement();
                poolReturn(battleDetailsElement);
                battleDetailsElement = null;
            }

            if (selectionButtonLayer !== null) {
                selectionButtonLayer.closeWorldButtonLayer();
                selectionButtonLayer = null;
            }

        }

        function detailsReady() {
            playerActor = getPlayerActor();

            bottomContainer = battleDetailsElement.call.getChildElement('bottom_container');
            centerContainer = battleDetailsElement.call.getChildElement('center_container');
            topContainer = battleDetailsElement.call.getChildElement('top_container');

            statusMap.encounter_id = "World Encounter: "+playerActor.getStatus(ENUMS.ActorStatus.ACTIVATED_ENCOUNTER)
            encounter = GameAPI.call.getDynamicEncounter();
            statusMap.dyn_encounter_id = "Dyn ID:: "+encounter.getStatus(ENUMS.EncounterStatus.ENCOUNTER_ID);

            ThreeAPI.registerPrerenderCallback(update);
        }

        function activate() {
            battleDetailsElement = poolFetch('HtmlElement');
            battleDetailsElement.initHtmlElement('hud_battle_details', null, statusMap, 'hud_battle_details', detailsReady);
        }

        this.call = {
            close:close
        }

        activate();
    }

}

export { DomBattleHud }