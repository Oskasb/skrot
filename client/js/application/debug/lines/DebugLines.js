import { LineRenderSystem } from "./LineRenderSystem.js";
import {poolFetch, poolReturn} from "../../utils/PoolUtils.js";

class DebugLines {
    constructor() {

        let lineDenderSystem  = new LineRenderSystem();
        this.lineDenderSystem = lineDenderSystem;
        let tempVec1 = new THREE.Vector3();
        let tempVec2 = new THREE.Vector3();
        let color;



        let updateFrame = function() {
        //    this.updateDebugLines()
            this.lineDenderSystem.render()
            //  ThreeAPI.threeSetup.removePrerenderCallback(postRenderCall);
           ThreeAPI.threeSetup.removeOnClearCallback(postRenderCall);
        }.bind(this);

        let postRenderCall = function() {
            updateFrame();
        }

        let renderCall = function() {
            this.lineDenderSystem.activate();
            //      ThreeAPI.threeSetup.addPrerenderCallback(postRenderCall);
         ThreeAPI.threeSetup.addOnClearCallback(postRenderCall);
        //    ThreeAPI.threeSetup.addOnClearCallback(this.lineDenderSystem.render)
        }.bind(this)



        let drawLine = function(event) {
            if (typeof (event.color) === 'string') {
                color = lineDenderSystem.color(event.color);
            } else {
                color = event.color;
            }


            if (event.drawFrames) {
                let frames = event.drawFrames;

                let from = poolFetch('Vector3');
                let to  = poolFetch('Vector3');
                let colorVec3 = poolFetch('Vector3');
                from.copy(event.from)
                to.copy(event.to)
                colorVec3.copy(color);

                let durableDraw = function() {
                    colorVec3.multiplyScalar(1 - (0.75/frames))
                    frames--
                    lineDenderSystem.drawLine(from, to, colorVec3)
                    renderCall()
                    if (!frames) {
                        poolReturn(from);
                        poolReturn(to);
                        poolReturn(colorVec3);
                        ThreeAPI.unregisterPrerenderCallback(durableDraw);
                    }

                }

                ThreeAPI.addPrerenderCallback(durableDraw)
            }

            lineDenderSystem.drawLine(event.from, event.to, color)
            renderCall()
        };




        let drawCross = function(event) {
            if (typeof (event.color) === 'string') {
                color = lineDenderSystem.color(event.color);
            } else {
                color = event.color;
            }

            lineDenderSystem.drawCross(event.pos, color, event.size);
            renderCall()
        };


        let drawBox = function(event) {
            if (typeof (event.color) === 'string') {
                color = lineDenderSystem.color(event.color);
            } else {
                color = event.color;
            }
            lineDenderSystem.drawAABox(event.min, event.max, color, event.quat)
        };

        evt.on(ENUMS.Event.DEBUG_DRAW_LINE, drawLine);
        evt.on(ENUMS.Event.DEBUG_DRAW_CROSS, drawCross);
        evt.on(ENUMS.Event.DEBUG_DRAW_AABOX, drawBox);

    };

    updateDebugLines = function() {
        this.lineDenderSystem.render();
    };

    clearDebugLines = function() {
        this.lineDenderSystem.render();
        this.lineDenderSystem.render();
    }



}

export { DebugLines }