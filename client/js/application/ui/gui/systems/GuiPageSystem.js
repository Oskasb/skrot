import {GuiPage} from "../elements/GuiPage.js";
import {ConfigData} from "../../../utils/ConfigData.js";


class GuiPageSystem {
    constructor() {
        this.pages = {};
        this.activePages = [];
        this.inactivePages = [];
        this.configData = new ConfigData("UI", "PAGES")
    }

    initGuiPageSystem() {

        let config = this.configData.parseConfigData();

        for (let key in config) {
            let pageId = config[key].id;
            let pageData = config[key].data;
            this.pages[pageId]  = new GuiPage(pageId);
        }

        let onTogglePage = function(event) {
            console.log('onTogglePage', event)
            let pageId = event['page_id'];
            let parentPageId = event['parent_page_id'];
            let parentcontainerId = event['parent_container_id']
            this.toggleGuiPage(pageId, parentPageId, parentcontainerId);
        }.bind(this);

        let onSwitchBackPage = function(event) {
            let reopenCB = function() {
                setTimeout(function() {
                    GuiAPI.calls.setInMenu(false);
                },0);

            }
            this.reactivateInactivePage(event['from_id'], reopenCB)
        }.bind(this);

        evt.on(ENUMS.Event.TOGGLE_GUI_PAGE, onTogglePage)
        evt.on(ENUMS.Event.SWITCH_BACK_GUI_PAGE, onSwitchBackPage)
    }
    attachPageToParent(page, parentPageId, parentContainerId) {
        let pageRootId = page.config[0].containers[0]['widget_id'];
        let pageRoot = page.containers[pageRootId];

        if (this.activePages.indexOf(this.pages[parentPageId]) !== -1) {
            let parentPage = this.pages[parentPageId];
            if (parentPage.containers[parentContainerId]) {
                let parentContainer = parentPage.containers[parentContainerId];
                parentContainer.guiWidget.addChild(pageRoot.guiWidget);
            }
        }
    }
    toggleGuiPage(pageId, parentPageId, parentContainerId) {
        console.log("Toggle page: ", pageId, parentPageId, parentContainerId);
        if (this.activePages.indexOf(this.pages[pageId]) === -1) {
            let page = this.activateGuiPage(pageId);
            this.attachPageToParent(page, parentPageId, parentContainerId);
        } else {
            this.closeGuiPage(this.pages[pageId])
        }
    }
    activateGuiPage(pageId, callback) {
        let page;
        if (pageId) {
            page = this.pages[pageId].activateGuiPage(callback);
            this.activePages.push(page)
        }
        return page;
    }

    reactivateInactivePage(fromPageId, callback) {
        console.log("Reactivate page ", this.inactivePages)
        let returnToPage = this.inactivePages.pop();
        this.closeGuiPage(this.pages[fromPageId]) // .closeGuiPage();
        setTimeout(function() {
            returnToPage.activateGuiPage(callback)
        }, 20)

    }

    switchFromCurrentActiveToPage(fromPage, toPageId, callback) {
        console.log("switch page")
        GuiAPI.calls.setInMenu(true);
        this.inactivePages.push(fromPage);
        fromPage.closeGuiPage();
        let _this = this;
        setTimeout(function() {
            _this.activateGuiPage(toPageId, callback);
        }, 20)

    }

    closeGuiPage(page) {
        let oldPage = MATH.splice(this.activePages, page)
        oldPage.closeGuiPage();
    }



}

export { GuiPageSystem }