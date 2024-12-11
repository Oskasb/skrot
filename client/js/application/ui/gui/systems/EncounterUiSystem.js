import {GuiExpandingContainer} from "../widgets/GuiExpandingContainer.js";
import {GuiCharacterPortrait} from "../widgets/GuiCharacterPortrait.js";
import {targetSelectActor} from "../../../utils/PlayerUtils.js";

let playerPortraitLayoutId = 'widget_companion_sequencer_button'
let hostilePortraitLayoutId = 'widget_hostile_sequencer_button'

let encounterTurnSequencer = null;
let dynamicEncounter = null;
let actors = [];
let portraits = []
let container = null;


function debugDrawActorIndex(actor, index) {
    actor.setStatusKey(ENUMS.ActorStatus.HP, Math.ceil(Math.random() * actor.getStatus(ENUMS.ActorStatus.MAX_HP)))
   // actor.actorText.pieceTextPrint(""+index)
}
let testActive = function(actor) {
    if (actor.getStatus(ENUMS.ActorStatus.SEQUENCER_SELECTED)) {
        return true;
    } else {
        return false;
    }
}

function getStatus(key) {
    return dynamicEncounter.status.call.getStatus(key);
}

let onActivate = function(actor) {
    console.log("Button Pressed, onActivate:", actor)
    targetSelectActor(actor);

}

let fitTimeout = null;

let onReady = function(portrait) {
 //   console.log("onReady", portrait)
    container.addChildWidgetToContainer(portrait.guiWidget)

    clearTimeout(fitTimeout);
    fitTimeout = setTimeout(function() {
        container.fitContainerChildren()
    },0)
}


function getPortraitByActorId(actorId) {
    for (let i = 0; i < portraits.length; i++) {
        if (portraits[i].actor.id === actorId) {
            return portraits[i];
        }
    }
}

function addActorPortrait(actor) {
    let count = actors.length;
    let seqIndex = actors.indexOf(actor);
    let frac = MATH.calcFraction(0, count, seqIndex) * 0.4;
    let portraitLayoutId = hostilePortraitLayoutId;
    if (actor.isPlayerActor()) {
        portraitLayoutId = playerPortraitLayoutId;
    }
    portraits.push(new GuiCharacterPortrait(actor, portraitLayoutId, onActivate, testActive, 0, 0, onReady))



}

function renderEncounterActorUi(actor, tpf, time) {
    if (!getPortraitByActorId(actor.id)) {
        addActorPortrait(actor);
    }
}

function updateActorsByStatus() {
    let actorList = getStatus(ENUMS.EncounterStatus.ENCOUNTER_ACTORS);
    if (actorList.length !== actors.length) {
        for (let i = 0; i < actors.length; i++) {
            let id = actors[i].id;
            if (actorList.indexOf(id) === -1) {
                MATH.splice(actors, actors[i])
                i--;
            }
        }
        for (let i = 0; i < actorList.length; i++) {
            let actor = GameAPI.getActorById(actorList[i]);
                if (!actor) {
                    GuiAPI.screenText("LOADING", ENUMS.Message.HINT, 1);
                } else {
                    if (actors.indexOf(actor) === -1) {
                        actors.push(actor)
                }
            }
        }
    }
}

let activePortraits = 0;

let updateDynamicEncounterUiSystem = function(tpf, time) {

    if (!dynamicEncounter) {
        console.log("Encounter missing")
        return;
    }

        updateActorsByStatus()
        let currentTurnIndex = getStatus(ENUMS.EncounterStatus.TURN_INDEX);
        let hasTurnActorId = getStatus(ENUMS.EncounterStatus.HAS_TURN_ACTOR);

    MATH.forAll(actors, renderEncounterActorUi, tpf, time)
    for (let i = 0; i < portraits.length; i++) {
        let portrait = portraits[i]
        if (portrait) {
            portrait.updateCharacterPortrait(tpf, currentTurnIndex)
        }
    }

    if (portraits.length !== activePortraits) {
        activePortraits = portraits.length;
        let hostiles = [];

        for (let i = 0; i < portraits.length; i++) {
            let actor = portraits[i].actor;
            if (!actor.isPlayerActor()) {
                hostiles.push(actor);
            }
        }

        if (hostiles.length) {
            onActivate(MATH.getRandomArrayEntry(hostiles));
        }

    }

}


class EncounterUiSystem {
    constructor() {

    }

    addContainer() {
        let containerReady = function(widget) {
        //    console.log(widget)
            //    container = widget;
            widget.attachToAnchor('top_q_left');
        }

        if (!container) {
            container = new GuiExpandingContainer()
            container.initExpandingContainer('widget_encounter_sequencer_expanding_container', containerReady)
        }
    }

    setEncounterSequencer(sequencer) {
        this.addContainer()
        encounterTurnSequencer = sequencer;
        ThreeAPI.addPrerenderCallback(updateDynamicEncounterUiSystem)
    }

    setActiveEncounter(dynEncounter) {
        activePortraits = 0;
        this.addContainer()
        dynamicEncounter = dynEncounter;
        ThreeAPI.addPrerenderCallback(updateDynamicEncounterUiSystem)
    }

    closeEncounterUi() {
        dynamicEncounter = null;
        while (portraits.length) {
            let portrait = portraits.pop()
            if (portrait) {
                portrait.closeCharacterPortrait()
            }
        }

        while (actors.length) {
            actors.pop();
        }

        ThreeAPI.unregisterPrerenderCallback(updateDynamicEncounterUiSystem)
    }

}

export { EncounterUiSystem }