import { GuiCharacterPortrait } from "../widgets/GuiCharacterPortrait.js";

class CharacterPortraitSystem {
    constructor() {
    }

    createPortrait(gamePiece, layoutConfId, onActivate, testActive, x, y, onReady) {
       return new GuiCharacterPortrait(gamePiece, layoutConfId, onActivate, testActive, x, y, onReady)
    }

    createLeaderActionBar(gamePiece, containerId, x, y) {
        return gamePiece.getCharacter().activateCharAbilityGui(containerId, x, y)
    }

    createCompanionActionBar(gamePiece, containerId, x, y) {
        return gamePiece.getCharacter().activateCharAbilityGui(containerId, x, y);
    }

}

export { CharacterPortraitSystem }