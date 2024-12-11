class PerformanceMonitorUiSystem {
    constructor() {

        let update = function() {

        }

        this.call = {
            update:update
        }
    }

    initPerformanceMonitorUiSystem() {
        this.page = GuiAPI.activatePage('page_perf_mon');
     //   this.containers = this.page.containers;
        ThreeAPI.registerPrerenderCallback(this.call.update)
    }

    closePerformanceMonitorUiSystem() {
        this.page.closeGuiPage();
        ThreeAPI.unregisterPrerenderCallback(this.call.update)
    }

}

export {PerformanceMonitorUiSystem}