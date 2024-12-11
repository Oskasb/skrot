
import {DomWalletBar} from "../DomWalletBar.js";
import {DomParty} from "./DomParty.js";
import {DomBottomBar} from "./DomBottomBar.js";
import {DomMinimap} from "../DomMinimap.js";
import {DomChat} from "../DomChat.js";
import {notifyCameraStatus} from "../../../../3d/camera/CameraFunctions.js";
import {fetchConfigByEditId} from "../../../utils/ConfigUtils.js";

class DomNavTest {
    constructor() {

    //    let domWalletBar = new DomWalletBar();


        function configLoaded(cfg) {
            GameAPI.worldModels.deactivateEncounters();
            let domParty = new DomParty();
            let domBottomBar = new DomBottomBar(cfg['nav_bottom_bar']);
        }

        fetchConfigByEditId("nav_points", configLoaded);

   //     let chat = new DomChat();

    }
}

export { DomNavTest }