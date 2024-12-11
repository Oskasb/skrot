import { GuiWidget} from "../elements/GuiWidget.js";

let applyPositionOffset = function(guiAxisSlider) {
    let guiWidget = guiAxisSlider.guiWidget
    let options = guiAxisSlider.options
    guiWidget.offsetWidgetPosition(guiAxisSlider.offset);
    if (guiAxisSlider.rotation) {
        guiWidget.setWidgetRotation(guiAxisSlider.rotation)
    }

    if (guiAxisSlider.valueText) {
        guiWidget.text.maxRows = 1;
        if (guiWidget.text)
        guiWidget.printWidgetText(guiAxisSlider.valueText)
    }

    if (options.color_curves[0] || options.color_curves[1]) {
        let originalRgba = options.color_rgba
        let rgba = guiAxisSlider.rgba;
        let rgbaMod = guiAxisSlider.rgbaMod;
        rgba.r = originalRgba.r * (1 - rgbaMod.r)
        rgba.g = originalRgba.g * (1 - rgbaMod.g)
        rgba.b = originalRgba.b * (1 - rgbaMod.b)
        rgba.a = originalRgba.a * (1 - rgbaMod.a)


        let text = guiWidget.text;
        if (text) {
            text.setTextColor(rgba)
        }



        let icon = guiWidget.icon;
        if (icon) {
            icon.setGuiIconColorRGBA(rgba)
        //    let sprite = {x:2, y:2, z:icon.sprite.z, w:icon.sprite.w}
        //    surface.getBufferElement().setSprite(sprite)
        }


    }

};

let onFrameUpdate = function(guiAxisSlider, tpf, time) {

    let options = guiAxisSlider.options

    MATH.callAll(guiAxisSlider.onUpdateCallbacks, guiAxisSlider)

    let xValue = guiAxisSlider.feedbackValues[0] * options.axis[0];
    let yValue = guiAxisSlider.feedbackValues[1] * options.axis[1];

    guiAxisSlider.offset.x = options.offsets[0] + xValue*options.range[0];
    guiAxisSlider.offset.y = options.offsets[1] + yValue*options.range[1]
    guiAxisSlider.rotation = xValue*options.rotation[0] + yValue*options.rotation[1]

    let text = "";

    if (options.value_text[0] !== null) {
        text += MATH.numberToDigits(xValue, options.value_text[0], options.value_text[0])
    }

    if (options.value_text[1] !== null) {
        text += MATH.numberToDigits(yValue, options.value_text[1], options.value_text[1])
    }

    let rgbaMod = guiAxisSlider.rgbaMod;
    rgbaMod.r = 0;
    rgbaMod.g = 0;
    rgbaMod.b = 0;
    rgbaMod.a = 0;

    if (options.color_curves[0]) {
        let curveValue = MATH.valueFromCurve(xValue, MATH.curves[options.color_curves[0]])
        rgbaMod.r += options.curve_colors[0][0]*curveValue;
        rgbaMod.g += options.curve_colors[0][1]*curveValue;
        rgbaMod.b += options.curve_colors[0][2]*curveValue;
        rgbaMod.a += options.curve_colors[0][3]*curveValue;
    }

    if (options.color_curves[1]) {
        let curveValue = MATH.valueFromCurve(yValue, MATH.curves[options.color_curves[1]])
        rgbaMod.r += options.curve_colors[1][0]*curveValue;
        rgbaMod.g += options.curve_colors[1][1]*curveValue;
        rgbaMod.b += options.curve_colors[1][2]*curveValue;
        rgbaMod.a += options.curve_colors[1][3]*curveValue;
    }

    guiAxisSlider.valueText = text;
    applyPositionOffset(guiAxisSlider);

};

class GuiAxisFeedback {
    constructor(options) {

        this.options = {
            "anchor": "stick_bottom_right",
            "icon": "directional_arrows",
            "axis": [1, 1],
            "release": [1, 1],
            "range": [0.08, 0.08],
            "rotation": [0, 0],
            "offsets": [0, 0],
            "color_rgba": {r:0.1, g:0.9, b:0.3, a:0.5},
            "value_text": [null, null],
            "color_curves": [null, null],
            "curve_colors": [[1, 1, 1, 1], [1, 1, 1, 1]]
        };
        for (let key in options) {
            this.options[key] = options[key];
        }

        this.pos = new THREE.Vector3();
        this.origin = new THREE.Vector3();
        this.offset = new THREE.Vector3();

        this.rgbaMod = {r:0, g:0, b:0, a:0};
        this.rgba = {r:0, g:0, b:0, a:0};


        this.rotation = 0;

        this.valueText = "";

        this.feedbackValues = [0, 0];
        this.onUpdateCallbacks = [];

        let guiAxisFeedback = this;

        let frameUpdate = function(tpf, time) {
            onFrameUpdate(guiAxisFeedback, tpf, time)
        };

        this.callbacks = {
            onFrameUpdate:frameUpdate
        }
    };

    updateFeedbackValue = function(valueIndex, value) {
        this.feedbackValues[valueIndex] = value;
    }

    initGuiWidget = function(widgetConfig, onReady) {
        let widgetRdy = function(widget) {
            widget.applyWidgetOptions(this.options)

            let surface = widget.guiSurface;
            surface.getBufferElement().setColorRGBA(this.rgba)

            onReady(this)
        }.bind(this);
        this.guiWidget = new GuiWidget(widgetConfig);
        this.guiWidget.initGuiWidget(null, widgetRdy);
        ThreeAPI.addPrerenderCallback(this.callbacks.onFrameUpdate);
    };

    addUpdateCallback = function(onUpdate) {
        this.onUpdateCallbacks.push(onUpdate)
    };

    removeGuiWidget = function() {
        ThreeAPI.unregisterPrerenderCallback(this.callbacks.onFrameUpdate);
        MATH.emptyArray(this.onUpdateCallbacks);
        this.guiWidget.recoverGuiWidget()
    };

}

export { GuiAxisFeedback }