class StatusUiSystem {
    constructor() {

        let update = function() {

        }

        this.call = {
            update:update
        }
    }

    initStatusUiSystem() {
        this.page = GuiAPI.activatePage('page_status');
     //   this.containers = this.page.containers;
        ThreeAPI.registerPrerenderCallback(this.call.update)
    }

}

export {StatusUiSystem}