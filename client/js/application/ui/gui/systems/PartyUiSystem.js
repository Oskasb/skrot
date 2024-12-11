import {GuiExpandingContainer} from "../widgets/GuiExpandingContainer.js";
import {GuiCharacterPortrait} from "../widgets/GuiCharacterPortrait.js";
import {WorldActorStatusUI} from "./WorldActorStatusUI.js";
import {frameFeedbackMap} from "../../../../game/visuals/Colors.js";


let playerPortraitLayoutId = 'widget_party_portrait_actor_button'

let container = null;
let actors = null;
let playerParty = null;
let portraits = []


function getPortraitByActor(actor) {
    for (let i = 0; i< portraits.length; i++) {
        if (portraits[i].actor === actor) {
            return portraits[i];
        }
    }
}

function debugDrawActorIndex(actor, index) {
    actor.setStatusKey(ENUMS.ActorStatus.HP, Math.ceil(Math.random() * actor.getStatus(ENUMS.ActorStatus.MAX_HP)))
   // actor.actorText.pieceTextPrint(""+index)
}
let testActive = function(actor) {
    if (actor.getStatus(ENUMS.ActorStatus.PARTY_SELECTED)) {
        return true;
    } else {
        return false;
    }
}

let onActivate = function(actor) {
    //console.log("Button Pressed, onActivate:", actor)
    playerParty.selectPartyActor(actor);
}

let onReady = function(portrait) {
  //  console.log("onReady", portrait)
    container.addChildWidgetToContainer(portrait.guiWidget)
    portrait.actor.setStatusKey(ENUMS.ActorStatus.PARTY_SELECTED, false)
    portrait.statusUi = new WorldActorStatusUI()
    portrait.statusUi.activateWorldActorStatus(portrait.actor, portrait.guiWidget)

    setTimeout(function() {
        container.fitContainerChildren()
    },0)
}
function addActorPortrait(actor) {
    let seqIndex = actors.indexOf(actor);
    let portrait = new GuiCharacterPortrait(actor, playerPortraitLayoutId, onActivate, testActive, 0.0, 0.0, onReady)
    portraits.push(portrait)

}

function renderPartyActorUi(actor, tpf, time) {
    if (actor.getStatus(ENUMS.ActorStatus.HAS_TURN)) {
    //    debugDrawActorIndex(actor, actors.indexOf(actor))
    }

    if (!getPortraitByActor(actor)) {
        addActorPortrait(actor);
    }

}


function clearPartyUi() {
    while (portraits.length) {
        let portrait = portraits.pop()
        if (portrait) {
            portrait.closeCharacterPortrait()
            if (portrait.statusUi) {
                portrait.statusUi.deactivateWorldActorStatus()
            }
        }
    }
}

class PartyUiSystem {
    constructor() {

        let updatePartyUiSystem = function(tpf) {

            let navState = GuiAPI.getNavigationState()
            if (navState === ENUMS.NavigationState.WORLD) {
                playerParty = GameAPI.getGamePieceSystem().getPlayerParty();
                actors = playerParty.getPartyActors();

                MATH.forAll(actors, renderPartyActorUi, tpf)

                for (let i = 0; i < portraits.length; i++) {
                    let portrait = portraits[i]

                    if (actors.indexOf(portrait.actor) === -1) {
                        if (portrait) {
                            portrait.closeCharacterPortrait()
                            if (portrait.statusUi) {
                                portrait.statusUi.deactivateWorldActorStatus()
                            }
                            MATH.splice(portraits, portrait);
                            i--;
                        }
                    } else {
                        if (portrait) {
                            portrait.updateCharacterPortrait(tpf)
                            portrait.guiWidget.guiSurface.applyStateFeedback()
                            if (portrait.statusUi) {
                                portrait.statusUi.call.update();
                            }
                        }
                    }
                }
            } else {
                if (portraits.length !== 0) {
                    clearPartyUi();
                }
            }

        }.bind(this)

        this.call = {
            updatePartyUiSystem:updatePartyUiSystem
        }

        let clearUi = function() {
            this.closePartyUi();
            this.activatePartyUiSystem();
        }.bind(this);


        evt.on(ENUMS.Event.CLEAR_UI, clearUi)

    }

    setEncounterSequencer(sequencer) {

    }

    activatePartyUiSystem() {

        let containerReady = function(widget) {
            widget.attachToAnchor('mid_left');
        }

        if (!container) {
            container = new GuiExpandingContainer()
            container.initExpandingContainer('widget_party_portrait_expanding_container', containerReady)
        }

        ThreeAPI.addPrerenderCallback(this.call.updatePartyUiSystem)
    }

    closePartyUi() {


        clearPartyUi()
        ThreeAPI.unregisterPrerenderCallback(this.call.updatePartyUiSystem)
    }

}

export { PartyUiSystem }