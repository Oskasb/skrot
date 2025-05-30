import { LineRenderSystem } from "./LineRenderSystem.js";
import {poolFetch, poolReturn} from "../../utils/PoolUtils.js";
import {Vector3} from "../../../../../libs/three/Three.Core.js";
import {evt} from "../../event/evt.js";
import {ENUMS} from "../../ENUMS.js";

class DebugLines {
    constructor() {

        let lineDenderSystem  = new LineRenderSystem();
        this.lineDenderSystem = lineDenderSystem;

        let color;

        let frameRender = false;

        let updateFrame = function() {
            this.lineDenderSystem.render()
            ThreeAPI.threeSetup.removeOnClearCallback(postRenderCall);
            frameRender = false
        }.bind(this);

        let postRenderCall = function() {
            updateFrame();
        }

        let renderCall = function() {
            if (frameRender === false) {
                this.lineDenderSystem.activate();
                ThreeAPI.threeSetup.addOnClearCallback(postRenderCall);
                frameRender = true;
            }
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

    updateDebugLines() {
        this.lineDenderSystem.render();
    };

    clearDebugLines() {
        this.lineDenderSystem.render();
        this.lineDenderSystem.render();
    }



}

export { DebugLines }