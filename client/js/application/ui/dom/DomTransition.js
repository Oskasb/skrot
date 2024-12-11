import {HtmlElement} from "./HtmlElement.js";
import {updateKeyState} from "../input/KeyboardState.js";

let defaultAdsr = {
    attack: {duration:0.9, from:0, to: 1.2, easing:"cubic-bezier(0.7, 0.2, 0.85, 1.15)"},
    decay:  {duration:0.2, to: 1, easing:"ease-in-out"},
    sustain: {duration: 2, to: 1, easing:"ease-in-out"},
    release: {duration:1.1, to: 0, easing:"cubic-bezier(0.4, -0.2, 0.7, -0.2)"}
}



class DomTransition {
    constructor() {
        let htmlElement = new HtmlElement();


        let defaultData = [
        //    {label:'Mobile', value: window.isMobile},
        //    {label:'userAgent', value: client.env.userAgent},
        //    {label:'GL', value: window.SYSTEM_SETUP.glRenderer},
        //    {label:'vendor', value: window.SYSTEM_SETUP.vendor}
        ]
    //    console.log(defaultData, client.env);
        let adsrEnvelope = defaultAdsr;
        let callback;
        let statusMap = {
            transition : "WELCOME",
            datalist: ""
        }
        let transitionOptions = [];
        let datalist = []

        let closeCb = function() {
            console.log("Close...")
        }

        let setInitTransforms = function() {
            centerDiv.style.transitionDuration = 0+"s";
            centerDiv.style.transform = "translate3d(130%, 0, 0)"
            topDiv.style.transitionDuration = 0+"s";
            topDiv.style.transform = "translate3d(0, -100%, 0)"
            bottomDiv.style.transitionDuration = 0+"s";
            bottomDiv.style.transform = "translate3d(0, 100%, 0)"

        }

        let retrigger = function() {
            setInitTransforms();
            setTimeout(function() {
                activate(statusMap.transition, defaultData, callback, adsrEnvelope)
            }, 1);
        }

        let centerDiv;
        let topDiv;
        let bottomDiv;

        let optionsContainers = {
            top:null,
            bottom:null
        };

        let dynDivs = [];

        let readyCb = function() {

            centerDiv = htmlElement.call.getChildElement('center_container');
            topDiv = htmlElement.call.getChildElement('top_container');
            bottomDiv = htmlElement.call.getChildElement('bottom_container');
        //    let reloadDiv = htmlElement.call.getChildElement('reload');
            let transitionDiv = htmlElement.call.getChildElement('transition');
            optionsContainers.bottom = htmlElement.call.getChildElement('options_container_bottom');
            optionsContainers.top = htmlElement.call.getChildElement('options_container_top');
        //    DomUtils.addClickFunction(reloadDiv, rebuild)
            DomUtils.addClickFunction(centerDiv, release)

        //    DomUtils.addClickFunction(topDiv, release)
            DomUtils.addClickFunction(bottomDiv, release)
            setInitTransforms();
            release()
        }

        let rebuild = htmlElement.initHtmlElement('transition', closeCb, statusMap, 'full_screen', readyCb);

        let update = function() {

        }

        ThreeAPI.registerPrerenderCallback(update);

        function clearDivArray(array) {
            while(array.length) {
                DomUtils.removeDivElement(array.pop());
            }
        }

        let close = function() {
            ThreeAPI.unregisterPrerenderCallback(update);
            htmlElement.closeHtmlElement()
            transitionOptions = [];
            clearDivArray(dynDivs);
        }

        let transformToCenter = function(div) {
            div.style.transform = "translate3d(0, 0, 0)"
        }

        let activationDone = function(cb) {
            callback = null;
            cb(this)
        }.bind(this)

        let activate = function(label, data, cb, adsr) {
            callback = cb;

            if (data) {
                MATH.emptyArray(datalist);
                if (data.length) {
                    MATH.copyArrayValues(data, datalist)
                } else {
                    if (typeof (data) === 'object') {
                        for (let key in data) {
                            let info = {};
                            info.label = key;
                            let value = data[key];
                            if (typeof (value) === 'string' || typeof (value) === 'number') {
                                info.value = value;
                            } else {
                                if (value.length) {
                                    info.value = value.length;
                                } else {
                                    info.value = value;
                                }

                            }
                            datalist.push(info);
                        }
                    } else {
                        datalist.push(data);
                    }
                }
            }
            setInitTransforms();
            htmlElement.container.style.display = '';
            statusMap.transition = label || "TRANSITION";
            adsrEnvelope = adsr || defaultAdsr;
            statusMap.datalist = "";

            for (let i = 0; i < datalist.length; i++) {
                if (datalist[i].label) {
                    statusMap.datalist += "<h3>"+datalist[i].label+":</h3><p>"+datalist[i].value+"</p>"
                } else {
                    statusMap.datalist += datalist[i]+"<br>";
                }
            }



            setTimeout(function() {
                centerDiv.style.transitionDuration = adsrEnvelope.attack.duration+"s";
                centerDiv.style.transitionTimingFunction = adsrEnvelope.attack.easing;
                topDiv.style.transitionDuration = 0.675*adsrEnvelope.attack.duration+"s";
                topDiv.style.transitionTimingFunction = adsrEnvelope.attack.easing;
                bottomDiv.style.transitionDuration = 0.475*adsrEnvelope.attack.duration+"s";
                bottomDiv.style.transitionTimingFunction = adsrEnvelope.attack.easing;
                transformToCenter(centerDiv);
                transformToCenter(topDiv);
                transformToCenter(bottomDiv);
                applyOptions();
            },1)

        }

        let release = function() {
       //     centerDiv.style.transitionDuration = 0+"s";
            centerDiv.style.transitionDuration = adsrEnvelope.release.duration+"s";
            centerDiv.style.transitionTimingFunction = adsrEnvelope.release.easing;
            topDiv.style.transitionDuration = 0.775*adsrEnvelope.release.duration+"s";
            topDiv.style.transitionTimingFunction = adsrEnvelope.release.easing;
            bottomDiv.style.transitionDuration = 0.575*adsrEnvelope.release.duration+"s";
            bottomDiv.style.transitionTimingFunction = adsrEnvelope.release.easing;
            centerDiv.style.transform = "translate3d(-130%, 0, 0)"
       //     topDiv.style.transitionDuration = 0+"s";
            topDiv.style.transform = "translate3d(0, -100%, 0)"
       //     bottomDiv.style.transitionDuration = 0+"s";
            bottomDiv.style.transform = "translate3d(0, 100%, 0)"
            setTimeout(function() {
                htmlElement.container.style.display = 'none';
            }, adsrEnvelope.release.duration*1000+200)
            if (typeof (callback) === 'function') {
            //    setTimeout(function() {
                    activationDone(callback)
            //    }, 1.575*adsrEnvelope.attack.duration*1000)
            }
            transitionOptions = [];
            clearDivArray(dynDivs);
        }.bind(this)



        function applyOptions() { // {id:"button_reset", text:"RESET", onClick:reset},
            console.log("applyOptions transitionOptions", transitionOptions)
            for (let i = 0; i < transitionOptions.length; i++) {
                let opt = transitionOptions[i];
                let optsContainer = optionsContainers[opt.container || 'bottom'];

                let div = DomUtils.createDivElement(optsContainer, opt.id, "<p>"+opt.text+"</p>", 'options_button');
                DomUtils.addElementClass(div, opt.id)
                DomUtils.addClickFunction(div, opt.onClick)
                dynDivs.push(div);
            }
        }

        function setOptions(opts) {
            console.log("setOptions transitionOptions", transitionOptions)
            transitionOptions = opts;
        }

        this.call = {
            close:close,
            activate:activate,
            setOptions:setOptions,
            release:release
        }

    }


}



export {DomTransition}