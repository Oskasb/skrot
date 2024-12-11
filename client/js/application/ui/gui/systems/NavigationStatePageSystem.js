
class NavigationStatePageSystem {
    constructor(navigationState, pageId) {

        let navigationPage = null;

        function updateNavigationPage() {
            let navState = GuiAPI.getNavigationState()
            if (navState === navigationState) {

                if (navigationPage === null) {
                    navigationPage = GuiAPI.activatePage(pageId)
                }

            } else {
                if (navigationPage !== null) {
                    navigationPage.closeGuiPage()
                    navigationPage = null;
                }
            }
        }

        this.call = {
            updateNavigationPage:updateNavigationPage
        }

    }


    initNavigationPageSystem() {
        ThreeAPI.addPrerenderCallback(this.call.updateNavigationPage);
    }


}

export { NavigationStatePageSystem }