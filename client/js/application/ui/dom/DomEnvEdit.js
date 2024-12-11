import {poolFetch, poolReturn} from "../../utils/PoolUtils.js";

class DomEnvEdit {
    constructor() {
        this.statusMap = {};
    }

    setStatusMap(statusMap) {
        this.statusMap = statusMap;
    }

    initEditTool(closeCb, onReady) {

        let readyCb = function() {
            if (typeof (onReady) === 'function') {
                onReady(this);
            }
        }.bind(this)

        this.htmlElement = poolFetch('HtmlElement')
        console.log("initDomEnvEdit");
        this.htmlElement.initHtmlElement('env_edit', closeCb, this.statusMap, 'edit_frame edit_env', readyCb);
    }

    closeEditTool() {
        this.htmlElement.closeHtmlElement();
        poolReturn(this.htmlElement);
        this.htmlElement = null;
    }

}

export { DomEnvEdit }