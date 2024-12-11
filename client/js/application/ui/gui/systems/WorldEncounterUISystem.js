import {GuiControlButton} from "../widgets/GuiControlButton.js";
import {Vector3} from "../../../../../libs/three/math/Vector3.js";


let tempVec = new Vector3();
let selectedEncounterId = null;
let selectedEncounter = null;

let buttons = [];


function addButton(encounter, onAct, testAct, onReady, name) {
    let button = new GuiControlButton(encounter.id, 'widget_icon_button_tiny', onAct, testAct, 0, 0, onReady, 'widget_button_state_tiny_frame', name)
    buttons.push(button)
}

function addRequestPartyButton(encounter) {
    selectedEncounter = encounter;

    let onReady = function(button) {
        button.setButtonIcon('CAM_PARTY')
    }

    addButton(encounter, activateSeekPartyEncounter, testSeekPartyEncounterActive, onReady, 'Party')
}

function activateSelectedEncounterUi(encounter) {

    console.log("Encounter selection activated", encounter);
 //   let playerParty = GameAPI.getGamePieceSystem().playerParty
 //   if (playerParty.actors.length === 1) {
    //    addRequestPartyButton(encounter);
 //   }

}

function deactivateSelectedEncounterUi() {
    while (buttons.length) {
        buttons.pop().removeGuiWidget()
    }
}

function updateButtons(encounter) {
    if (!encounter) {
        deactivateSelectedEncounterUi()
    }
    for (let i = 0; i < buttons.length; i++) {
        tempVec.copy(encounter.getPos());
        tempVec.y -=0.25;
        buttons[i].positionByWorld(tempVec);
    }
}

function updateEncounterUiSystem() {
    let selectedActor = GameAPI.getGamePieceSystem().selectedActor;
    if (selectedActor) {
        let encId = selectedActor.getStatus(ENUMS.ActorStatus.SELECTED_ENCOUNTER)
        if (encId) {
            if (encId !== selectedEncounterId) {
                deactivateSelectedEncounterUi(selectedActor);
                selectedEncounterId = encId;
                let encounter = GameAPI.getWorldEncounterByEncounterId(encId);
                activateSelectedEncounterUi(encounter);
            }
            updateButtons(GameAPI.getWorldEncounterByEncounterId(encId));
        } else {
            selectedEncounterId = null;
            deactivateSelectedEncounterUi(selectedActor)
        }
    }
}


class WorldEncounterUISystem {
    constructor() {

    }


    initEncounterUiSystem() {
        ThreeAPI.addPrerenderCallback(updateEncounterUiSystem)
    }

    deactivateEncounterUi() {
        ThreeAPI.unregisterPrerenderCallback(updateEncounterUiSystem)
    }

}

export { WorldEncounterUISystem }