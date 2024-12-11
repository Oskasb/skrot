import { CharacterPortraitSystem } from "./CharacterPortraitSystem.js";
import { TargetIndicator } from "../game/TargetIndicator.js";


let characterPortraitSystem = new CharacterPortraitSystem();
let gamePiece = null;
let mainPortrait = null;
let companionPortraits = [];
let partyLeaderActive = false;
let callbacks;
let activatedCompanion = null;

let letCompanionLayout = 'widget_companion_portrait_button';
let mainCharPortraitLayout = 'widget_main_portrait_button';

let partyLeaderPage = null;
let indicatedSelections = [];

let companionPage = null;
let leaderActionBar = null;
let companionActionBar = null;

let clearCompanionPortraits = function() {
    while (companionPortraits.length) {
        companionPortraits.pop().guiWidget.recoverGuiWidget()
    }
}

let notifyButtonStatechange = function() {
    mainPortrait.updatePortraitInteractiveState();
    for (let i = 0 ; i < companionPortraits.length; i++) {
        companionPortraits[i].updatePortraitInteractiveState();
    }
}


let activateCompanionPeacePage = function() {

    if (activatedCompanion.getTarget()) {
        companionActionBar = characterPortraitSystem.createCompanionActionBar(activatedCompanion, 'widget_companion_action_button_container', 0, 0)
    } else {
        companionPage = GuiAPI.activatePage('page_companion_peace')
    }


}



let operatePartyLeaderSelection = function() {
    let leaderPiece = GameAPI.getMainCharPiece();
    if (partyLeaderActive) {

        indicateSelection(true, leaderPiece)
        if (leaderPiece.getTarget()) {
            leaderActionBar = characterPortraitSystem.createLeaderActionBar(leaderPiece, 'widget_action_button_container', 0, 0);
        } else {
            partyLeaderPage = GuiAPI.activatePage('page_leader_peace')
        }

    } else {
        if (partyLeaderPage) {
            GuiAPI.guiPageSystem.closeGuiPage(partyLeaderPage);
            partyLeaderPage = null;
        }
        if (leaderActionBar) {
            leaderActionBar.deactivateCharacterAbilityGui();
            leaderActionBar = null;
        }
        indicateSelection(false, leaderPiece)
    }
}

let indicateSelection = function(bool, selection) {
    let indicator = indicatedSelections[selection.pieceIndex];
    if (!indicator) {
        console.log("Add indicator")
        indicator = new TargetIndicator()
        indicatedSelections[selection.pieceIndex] = indicator;
    };
    if (bool) {
        indicator.indicateGamePiece(selection, 'effect_character_indicator', 1, 3, -1.5,0.82, 0, 4);
    } else {
        indicator.removeTargetIndicatorFromPiece();
        indicator.removeIndicatorFx();
    }
}

let addCompanionPortrait = function(companion, index) {

    let activateCompanion = function(companion) {
        if (companionPage) {
            indicateSelection(false, activatedCompanion)
            GuiAPI.guiPageSystem.closeGuiPage(companionPage)
            companionPage = null;
        }

        if (companionActionBar) {
            companionActionBar.deactivateCharacterAbilityGui()
        }

        if (activatedCompanion === companion) {
            activatedCompanion = null;
            indicateSelection(false, companion)
        } else {
            activatedCompanion = companion;
            indicateSelection(true, companion)
            setTimeout(activateCompanionPeacePage, 50);
        }
        notifyButtonStatechange()
        console.log("activate companion", companion)
    }

    let testActive = function(companion) {
        if (activatedCompanion === companion) {
            return true;
        } else {
            return false;
        }
    }

    let onReady = function(portrait) {
        companionPortraits.push(portrait)
    }

    characterPortraitSystem.createPortrait(companion, letCompanionLayout, activateCompanion, testActive, 0.14 -index*0.09, -0.34, onReady)


}

let processCompanions = function(tpf, gameTime) {

    for (let i = 0; i < gamePiece.companions.length; i++) {
        let companion = gamePiece.companions[i];
        if (companionPortraits[i]) {
            if (companionPortraits[i].gamePiece !== companion) {
                clearCompanionPortraits();
            } else {
                companionPortraits[i].updateCharacterPortrait(tpf, gameTime)
            }
        } else {
            console.log("Add companion portrait", companion);
            addCompanionPortrait(companion, i)
        }
    }
}

class PartyLeaderSystem {
    constructor() {

        let pressPartyLeader = function() {
            notifyButtonStatechange();
            partyLeaderActive = !partyLeaderActive;
            operatePartyLeaderSelection()
        }
        let partyLeaderTestActive = function(partyLeader) {
            return partyLeaderActive
        }

        callbacks = {
            pressPartyLeader:pressPartyLeader,
            partyLeaderTestActive:partyLeaderTestActive
        }

    }

    setupPortrait() {

        let onReady = function(button) {
           mainPortrait = button;
    //        console.log("portrait", button);
        }

        characterPortraitSystem.createPortrait(gamePiece, mainCharPortraitLayout, callbacks.pressPartyLeader, callbacks.partyLeaderTestActive, -0.14, -0.32, onReady)

    }

    getSelectedCompanion() {
        return activatedCompanion;
    }

    deactivateSelections() {
        partyLeaderActive = false;
        activatedCompanion = null;
        if (companionPage) {
            GuiAPI.guiPageSystem.closeGuiPage(companionPage)
            companionPage = null;
        }
        if (partyLeaderPage) {
            GuiAPI.guiPageSystem.closeGuiPage(partyLeaderPage);
            partyLeaderPage = null;
        }
        notifyButtonStatechange();
    }

    clearPartyLeaderSystem() {
        partyLeaderActive = false;
        clearCompanionPortraits();
        mainPortrait.guiWidget.recoverGuiWidget();
        this.deactivateSelections();
    }

    setPartyLeaderPiece(piece) {
        gamePiece = piece;
        this.setupPortrait()
    }

    updatePartyLeaderSystem(tpf, gameTime) {
        if (!mainPortrait) return;
        mainPortrait.updateCharacterPortrait(tpf, gameTime);
        processCompanions(tpf, gameTime);
    }

}

export { PartyLeaderSystem }