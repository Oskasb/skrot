import {GuiWidget} from "../elements/GuiWidget.js";

let colorMap = {
    turn_done:{"r": 0.49, "g": 0.14, "b": 0.09, "a": 0.99},
    turn_await:{"r": 0.75, "g": 0.65, "b": 0.39, "a": 0.99},
    turn_active:{"r": 1.00, "g": 0.92, "b": 0.79, "a": 0.99},
    flash:{"r": 1.00, "g": 0.99, "b": 0.99, "a": 1.99},

    manual:{"r": 0.09, "g": 0.49, "b": 0.59, "a": 0.99},
    on:{"r": 0.11, "g": 0.75, "b": 0.75, "a": 0.99},
    active:{"r": 0.41, "g": 0.33, "b": 0.22, "a": 0.99},
    off:{"r": 0.69, "g":  0.25, "b": 0.25, "a": 0.99},
    ap_missing:{"r": 0.39, "g": -0.95, "b": 0.95, "a": 0.99},
    available:{"r": 0.41, "g": 0.69, "b": 0.11, "a": 0.99},
    activated:{"r": 0.59, "g": 0.49, "b": 0.05, "a": 0.99},
    unavailable:{"r": 0.3, "g": 0.5, "b": 0.3,  "a": 0.99}
}
class GuiButtonFrame {
    constructor(parentGuiWidget, frameWidgetId) {

        this.frameTime = 0;
        this.frameState = 'unavailable';
        this.colorMap = {}

        for (let key in colorMap) {
            this.colorMap[key] = colorMap[key];
        }

        let widgetReady = function(widget) {
            parentGuiWidget.addChild(widget);
        }

        this.guiWidget = new GuiWidget(frameWidgetId || 'widget_button_state_progress_frame')
        this.guiWidget.initGuiWidget(null, widgetReady);

    }

    getFrameSurface = function() {
        return this.guiWidget.guiSurface;
    }

    setFrameColor(rgba) {
        let frameSurface = this.getFrameSurface();
        frameSurface.setSurfaceColor(rgba)
    }

    flashFrame() {

        let rgba = this.colorMap['flash']
        let brightness = 0.25 + Math.cos(this.frameTime*10)*0.25;
        rgba.r = Math.abs(Math.sin(this.frameTime*8))*0.49 +brightness;
        rgba.g = Math.abs(Math.cos(this.frameTime*8))*0.49 +brightness;
        rgba.b = 0.5 + brightness;
        this.setFrameColor(rgba)
    }

    setFrameState(frameState) {
        if (this.frameState !== frameState) {
            this.frameTime = 0;
            this.frameState = frameState
        //    console.log('setFrameState', frameState)
            if (this.frameState === 'flash_frame') {

            } else {
                this.setFrameColor(this.colorMap[frameState])
            }
        }

    }

    updateButtonFrame(tpf) {
        this.frameTime += tpf;
        if (this.frameState === 'flash_frame') {
            this.flashFrame()
        }
    }

}

export { GuiButtonFrame }