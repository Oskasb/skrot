import {poolFetch} from "../../../utils/PoolUtils.js";
import {
    transformElement3DPercent,
    translateElement3DPercent
} from "../DomUtils.js";
import {InputDragPointer} from "../pointer/InputDragPointer.js";
import {MATH} from "../../../MATH.js";
import {getFrame} from "../../../utils/DataUtils.js";
import {terrainAt} from "../../../../3d/three/terrain/ComputeTerrain.js";
import {Vector3} from "../../../../../../libs/three/Three.Core.js";
import {keyToValue} from "../../input/KeyboardState.js";


class DomThumbstick {
    constructor() {

        let inputDragPointer = new InputDragPointer()
        let htmlElement;
        let _this = this;
        let statusMap;
        let surface;
        let inputElement;
        let stickElement;
        let moveRange = 40;

        let stickMoveVec3 = new Vector3();




        function update() {
            inputDragPointer.call.updateKeyState();
            translateElement3DPercent(stickElement, statusMap['AXIS_X']*moveRange, statusMap['AXIS_Y']*moveRange, 0);

            let forward = statusMap['AXIS_Y'] || 0;
            let left = statusMap['AXIS_X'] || 0;

            stickMoveVec3.set(left, 0, forward);

            stickMoveVec3.applyQuaternion(statusMap.camera.quaternion);
            stickMoveVec3.y = 0;
            stickMoveVec3.multiplyScalar(MATH.distanceBetween(statusMap.camera.position, statusMap.controls.target) * getFrame().tpf);

            statusMap.player.call.getObj3d().position.add(stickMoveVec3);

            let txt = 'FPS: '+MATH.numberToDigits(1 / getFrame().avgTpf, 0, 0);
            statusMap['fps_avg'] = txt;
            statusMap['elevation'] = 'ALT: '+MATH.numberToDigits(terrainAt(statusMap.controls.target), 2, 2);
            statusMap['pos_x'] = 'X: '+MATH.numberToDigits(statusMap.controls.target.x, 2, 2);
            statusMap['pos_z'] = 'Z: '+MATH.numberToDigits(statusMap.controls.target.z, 2, 2);
        }

        function setupListeners() {
            surface = htmlElement.call.getChildElement('stick_sampler')
            inputElement = htmlElement.call.getChildElement('stick_input')
            stickElement = htmlElement.call.getChildElement('stick_state')

            let opts = [
                {axis:"X", min:-1, max:1, origin: 0, margin:1.5, autoZero:true, additive:true,  keys:{add:'d', sub:'a'}},
                {axis:"Y", min:-1, max:1, origin: 0, margin:1.5, autoZero:true, additive:true,  keys:{add:'s', sub:'w'}}
            ]

            inputDragPointer.call.activateDragSurface(surface, inputElement, statusMap, opts)
            ThreeAPI.registerPrerenderCallback(update);
        }

        function initElement(sMap, url, styleClass, onReady) {
            statusMap = sMap;
            function elemReady(htmlEl) {
                htmlElement = htmlEl;
                onReady(_this)
                setupListeners()
            }

            let element = poolFetch('HtmlElement');
            element.initHtmlElement(url, null, statusMap, styleClass, elemReady);
        }


        function closeElement() {
            htmlElement.closeHtmlElement()
            ThreeAPI.unregisterPrerenderCallback(update);
        }

        this.call = {
            update:update,
            initElement:initElement,
            closeElement:closeElement
        }

    }
}

export { DomThumbstick }