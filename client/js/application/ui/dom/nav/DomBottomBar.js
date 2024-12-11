import {poolFetch} from "../../../utils/PoolUtils.js";
import {DomShop} from "./DomShop.js";
import {DomCharacters} from "./DomCharacters.js";
import {DomEstate} from "./DomEstate.js";
import {DomAdventure} from "./DomAdventure.js";
import {DomGuild} from "./DomGuild.js";
import {DomNavPoints} from "./DomNavPoints.js";
import {getPlayerActor} from "../../../utils/ActorUtils.js";
import {ENUMS} from "../../../ENUMS.js";

class DomBottomBar {
    constructor(config) {


        let domNavPoints = new DomNavPoints();

        console.log("Bottom Bar config: ", config);

        let statusMap = {
            activePage:null,
            selectedPage:null
        };

        let mainElement = null;

        let buttonShop;
        let buttonCharacters;
        let buttonEstate;
        let buttonAdventure;
        let buttonGuild;

        let activeButton = null;

        let navPoints = null;


        function menuActivate() {
            mainElement.hideOtherRootElements();
            let actor = getPlayerActor();
            if (actor !== null) {
                actor.setStatusKey(ENUMS.ActorStatus.TRAVEL_MODE, ENUMS.TravelMode.TRAVEL_MODE_MENU);
            }

        }

        function menuDeactivate() {
            mainElement.revealHiddenRootElements();
            DomUtils.removeElementClass(activeButton, "bar_button_active");
            activeButton = null;
            statusMap.selectedPage = null;

            if (statusMap.activePage !== null) {
                statusMap.activePage.call.close();
                statusMap.activePage = null;
            }
            let actor = getPlayerActor();
            if (actor !== null) {
                actor.setStatusKey(ENUMS.ActorStatus.TRAVEL_MODE, ENUMS.TravelMode.TRAVEL_MODE_WALK);
            }
        }


        function activateButtonElement(buttonElement, navPointsCfg) {
            domNavPoints.call.setNavPoints(navPointsCfg)
            if (buttonElement === activeButton) {
                menuDeactivate()
            } else {

                if (statusMap.activePage !== null) {
                    statusMap.activePage.call.close();
                }

                DomUtils.addElementClass(buttonElement, "bar_button_active");
                if (activeButton === null) {
                    menuActivate()
                } else {
                    DomUtils.removeElementClass(activeButton, "bar_button_active");
                }
                activeButton = buttonElement;

            }

        }


        function openShop() {
            console.log("Open Shop")
            statusMap.selectedPage = DomShop;
            activateButtonElement(buttonShop)

        }

        function openCharacters() {
            statusMap.selectedPage = DomCharacters;
            activateButtonElement(buttonCharacters, config['nav_characters'])
        }

        function openEstate() {
            statusMap.selectedPage = DomEstate;
            activateButtonElement(buttonEstate, config['nav_estate'])
        }

        function openAdventure() {
            statusMap.selectedPage = DomAdventure;
            activateButtonElement(buttonAdventure, config['nav_adventure'])
        }

        function openGuild() {
            statusMap.selectedPage = DomGuild
            activateButtonElement(buttonGuild, config['nav_guild'])
        }

        function elemReady() {
            buttonShop = mainElement.call.getChildElement('bottom_button_1')
            buttonCharacters = mainElement.call.getChildElement('bottom_button_2')
            buttonEstate = mainElement.call.getChildElement('bottom_button_3');
            buttonAdventure = mainElement.call.getChildElement('bottom_button_4');
            buttonGuild = mainElement.call.getChildElement('bottom_button_5');

            DomUtils.addClickFunction(buttonShop, openShop);
            DomUtils.addClickFunction(buttonCharacters, openCharacters);
            DomUtils.addClickFunction(buttonEstate, openEstate);
            DomUtils.addClickFunction(buttonAdventure, openAdventure);
            DomUtils.addClickFunction(buttonGuild, openGuild);

            ThreeAPI.registerPrerenderCallback(update);
        }

        let selectedPage = null;

        function update() {
            if (selectedPage !== statusMap.selectedPage) {
                selectedPage = statusMap.selectedPage;
                if (statusMap.selectedPage !== null) {
                    statusMap.activePage = new selectedPage(domNavPoints);
                }
            }


        }


        function activate() {
            mainElement = poolFetch('HtmlElement');
            mainElement.initHtmlElement('nav/bottom_bar', close, statusMap, 'bottom_bar', elemReady);

        }

        this.call = {
            close:close,
            activate:activate
        }

        activate();

    }
}

export { DomBottomBar }