import {poolFetch} from "../../../utils/PoolUtils.js";
import {ENUMS} from "../../../ENUMS.js";

function getUiNoteByAdv(notes, adv) {

    for (let i = 0; i < notes.length; i++) {
        let nAdv = notes[i].call.getWorldAdventure();
        if (nAdv === adv) {
            return notes[i];
        }
    }

    let note = poolFetch('DomAdventureNote');
    note.call.setWorldAdventure(adv)
    notes.push(note);
    return note;
}



function updateAdvNoteList(notes, advs) {

    for (let i = 0; i < advs.length; i++) {
        let uiNote = getUiNoteByAdv(notes, advs[i]);
        uiNote.call.setSortingIndex(advs.indexOf(uiNote.call.getWorldAdventure()));
    }

    for (let i = 0; i < notes.length; i++) {
        let adv = notes[i].call.getWorldAdventure();
        if (advs.indexOf(adv) === -1) {
            let note = notes[i];
            MATH.splice(notes, note);
            note.call.close();
        }
    }

}

class WorldAdventureUiSystem {
    constructor(gameAdventureSystem) {


        let activeAdventureNotes = [];
        let activeAdvs = [];

        function update() {

            let activeActor = GameAPI.getGamePieceSystem().selectedActor;
            let activeAdventureId = "";
            if (activeActor) {
                activeAdventureId = activeActor.getStatus(ENUMS.ActorStatus.ACTIVE_ADVENTURE);
            }

            let notedAdventures;

            MATH.emptyArray(activeAdvs);

            if (activeAdventureId !== "") {
                let adv = GameAPI.gameAdventureSystem.getAdventureById(activeAdventureId);
                activeAdvs[0] = adv;
            } else {
                gameAdventureSystem.call.getNearbyAdventures(activeAdvs);
            }


            updateAdvNoteList(activeAdventureNotes, activeAdvs);
        }

        this.call = {
            update:update
        }

    }

    on() {
        GameAPI.registerGameUpdateCallback(this.call.update)
    }

    off() {
        GameAPI.unregisterGameUpdateCallback(this.call.update)
    }


}

export { WorldAdventureUiSystem }