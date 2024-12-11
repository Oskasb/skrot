import {poolFetch, poolReturn} from "../../../utils/PoolUtils.js";

class DomNavBar {
    constructor() {

        let statusMap = {};

        let mainElement = null;

        let navPoints = [];
        this.navPoints = navPoints;

        let navButtons = [];

        function elemReady() {
            ThreeAPI.registerPrerenderCallback(update)
        }

        function update() {
            if (navPoints.length !== navButtons.length) {
                DomUtils.clearDivArray(navButtons);
                let bar = mainElement.call.getChildElement('nav_bar');
                for (let i = 0; i < navPoints.length; i++) {
                    let iHtml = navPoints[i].call.getLabel();
                    let btn = DomUtils.createDivElement(bar, "nav_"+i, '<p>'+iHtml+'</p>', 'nav_button');
                    let navPoint = navPoints[i];

                    function onClick() {
                        navPoint.onClickFunc(navPoint)
                    }

                    DomUtils.addClickFunction(btn, onClick);
                    navButtons.push(btn);
                }
            }

            for (let i = 0; i < navButtons.length; i++) {
                let navPoint = navPoints[i];
                let btn = navButtons[i];
                if (navPoint.isActive === true) {
                    DomUtils.addElementClass(btn, "bar_button_active");
                } else {
                    DomUtils.removeElementClass(btn, "bar_button_active");
                }
            }

        }

        function activate() {
            mainElement = poolFetch('HtmlElement');
            mainElement.initHtmlElement('nav/nav_bar', close, statusMap, 'nav_bar', elemReady);
        }

        function close() {
            DomUtils.clearDivArray(navButtons);
            setTimeout(function() {
                mainElement.closeHtmlElement();
                poolReturn(mainElement);
            }, 300)
            mainElement.hideHtmlElement(0.1);
            ThreeAPI.unregisterPrerenderCallback(update)
        }

        function attachNavPoint(navPoint, clickFunc) {
            navPoints.push(navPoint);
            navPoint.onClickFunc = clickFunc;
        }


        this.call = {
            attachNavPoint:attachNavPoint,
            close:close,
            activate:activate
        }

        activate();

    }
}

export { DomNavBar }