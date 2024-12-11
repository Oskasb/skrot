import {poolFetch, poolReturn} from "../../utils/PoolUtils.js";

class DomPalette {
    constructor() {

    }

    initDomPalette(paletteValue, readyCb, closeCb) {
        this.htmlElement = poolFetch('HtmlElement')
        this.htmlElement.initHtmlElement('palette', closeCb, paletteValue, 'palette_frame', readyCb);
        this.htmlElement.hideOtherRootElements();
    }

    closeDomPalette() {
        this.htmlElement.revealHiddenRootElements();
        this.htmlElement.closeHtmlElement();
        poolReturn(this.htmlElement);
        this.htmlElement = null;
    }

}

export { DomPalette }