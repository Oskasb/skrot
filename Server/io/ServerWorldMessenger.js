import {getRegisteredActors} from "../game/utils/GameServerFunctions.js";
import {ENUMS} from "../../client/js/application/ENUMS.js";

class ServerWorldMessenger {
    constructor() {

    }

    messageToWorldPresentActors(message) {
        let actors = getRegisteredActors();
        for (let i = 0; i < actors.length; i++) {
            let actor = actors[i];
            let inCombat = actor.getStatus(ENUMS.ActorStatus.IN_COMBAT);
            if (inCombat === false) {
                actor.messageClient(message);
            }
        }
    }

}

export {ServerWorldMessenger}