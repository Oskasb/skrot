import { ExpandingPool } from "../../../application/utils/ExpandingPool.js";
import { InstancingBuffers} from "./InstancingBuffers.js";
import { InstancingBufferElement } from "./InstancingBufferElement.js";

class  Instantiator {
    constructor(name, elementPools) {

        this.name = name;
        this.elementBuffers = {};

        let elementBuffers = this.elementBuffers;
        let getElementBuffers = function() {
            return elementBuffers;
        };


        let setupPool = function(sysKey) {
            let addElement = function(poolKey, callback) {
                let element = new InstancingBufferElement();
                callback(element)
            };
            elementPools[sysKey] = new ExpandingPool(sysKey, addElement);
        }


        let buildElement = function(sysKey, cb) {
        //
            let getElement = function(elem) {

                let index = elem.initGuiBufferElement(getElementBuffers()[sysKey]);
                if (index !== false) {
                    elem.setDefaultBuffers();
                    cb(elem, sysKey);
                } else {
                    console.log("Elem overflow", sysKey)
                }

            };
            if (!elementPools[sysKey]) {
                setupPool(sysKey)
            //    console.log("Bad pool", name, sysKey, [elementPools])
            }

            elementPools[sysKey].getFromExpandingPool(getElement)
        };

        let recoverElement = function(sysKey, elem) {
            elem.releaseElement();
            elementPools[sysKey].returnToExpandingPool(elem)
        };

        this.callbacks = {
            buildElement:buildElement,
            recoverElement:recoverElement,
            getElementBuffers:getElementBuffers
        }
    };

    getElementBufferByKey = function(key) {
        return this.callbacks.getElementBuffers()[key];
    };

    addInstanceSystem = function(elementKey, bufferSysKey, assetId, poolSize, renderOrder) {
        this.elementBuffers[elementKey] = new InstancingBuffers(bufferSysKey, assetId, poolSize, renderOrder);
    };

    buildBufferElement = function(sysKey, cb) {
        this.callbacks.buildElement(sysKey, cb);
    };

    recoverBufferElement = function(sysKey, bufferElem) {
        this.callbacks.recoverElement(sysKey, bufferElem);
    };

    updateInstantiatorBuffers = function() {
        for (let key in this.elementBuffers) {
            this.elementBuffers[key].updateGuiBuffer()
        }

    };

}

export {Instantiator}