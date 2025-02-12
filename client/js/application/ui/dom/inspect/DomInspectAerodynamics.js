import {poolFetch} from "../../../utils/PoolUtils.js";
import {getSetting} from "../../../utils/StatusUtils.js";
import {ENUMS} from "../../../ENUMS.js";
import {createDivElement} from "../DomUtils.js";


class DomInspectAerodynamics {
    constructor(controllable) {

        const statusMap = {}
        const surfaceContainers = [];

        const elements = {};

        const surfaces = controllable.surfaces;

        function update() {



            if (getSetting(ENUMS.Settings.SHOW_FLIGHT_FORCES) === 0) {
                ThreeAPI.unregisterPrerenderCallback(update);
                htmlElement.closeHtmlElement();
            }
        }


        function elemReady() {
            elements['surface_container'] = htmlElement.call.getChildElement('surface_container')

            for (let key in surfaces) {
                let boxKey =  'box_'+key
                elements[boxKey] = createDivElement(elements['surface_container'], boxKey, null, 'surface_inspect_box')
                let labelKey = 'label_'+key;
                elements[labelKey] = createDivElement(elements[boxKey], labelKey, '<h2>'+key+'</h2>', 'surface_label')
                let aoaXKey = 'aoax_'+key;
                elements[aoaXKey] = createDivElement(elements[boxKey], aoaXKey, 'aoax', 'surface_aoa_box')
                let aoaYKey = 'aoay_'+key;
                elements[aoaYKey] = createDivElement(elements[boxKey], aoaYKey, 'aoay', 'surface_aoa_box')
            }

            ThreeAPI.registerPrerenderCallback(update);
        }

        const htmlElement = poolFetch('HtmlElement');
        htmlElement.initHtmlElement('inspect/inspect_aerodynamics', null, statusMap, 'inspect_aerodynamics', elemReady);

    }
}

export { DomInspectAerodynamics }