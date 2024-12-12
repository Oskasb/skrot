import { GuiWidget} from "../elements/GuiWidget.js";
import {pipelineAPI} from "../../../utils/DataUtils.js";

class GuiProgressBar {
    constructor(options) {


        this.callbacks = {}

        this.options = {};
        for (let key in options) {
            this.options[key] = options[key];
        }

        this.min = 0;
        this.max = 100;
        this.current = 0;
        this.digits = options.digits || 2;
        this.time = 0;

        let getValue = function(trackValues, key, defaultValue) {
            let value;
            if (typeof(key) === 'undefined') {
                value = defaultValue;
            } else if (typeof(trackValues.getBy) === 'function') {
                value = trackValues.getBy(key)
            } else {
                value = trackValues[key]
            }
            return value || defaultValue;
        }

        if (this.options['track_config']) {

            let catKey = options['track_config']['category'];
            let confKey = options['track_config']['key'];

            let trackValues = pipelineAPI.getCachedConfigs()[catKey][confKey];

            let sampler = this.options['track_config']['sampler']


            this.callbacks['updateProgress'] = function(event) {
                    this.setProgress(
                        getValue(trackValues, sampler['min_key'], 0),
                        getValue(trackValues, sampler['max_key'], 1),
                        getValue(trackValues, sampler['value_key'], 0)
                    )
            }.bind(this);

            ThreeAPI.addPostrenderCallback(this.callbacks.updateProgress)
        }

        let progressEvent = options['progress_event'];
        if (progressEvent) {

            this.callbacks['updateProgress'] = function(event) {
                if (event.targetKey === progressEvent['target_key']) {
                    this.setProgress(event.min, event.max, event.current)
                }
            }.bind(this);

            if (typeof(progressEvent) === 'object') {
                this.progressEvent = ENUMS.Event[progressEvent.event]
                evt.on(this.progressEvent, this.callbacks['updateProgress']);
            }

        }

    };

    setGuiWidget = function(guiWidget) {
        this.guiWidget = guiWidget;
        guiWidget.setWidgetIconKey("plate");
        guiWidget.guiProgressBar = this;
    };

    setProgress = function(min, max, current) {
        this.min = min;
        this.max = max;
        this.updateCurrentProgress(current);
    };

    updateCurrentProgress = function(current) {
        this.current = MATH.clamp(current, this.min, this.max);
        this.guiWidget.indicateProgress(this.min, this.max, this.current, this.digits)
    };

    deactivateProgressBar = function() {
        ThreeAPI.unregisterPostrenderCallback(this.callbacks.updateProgress)
        evt.removeListener(this.progressEvent, this.callbacks.updateProgress, evt)
    };

    removeGuiWidget = function() {
        this.deactivateProgressBar();
        this.guiWidget.recoverGuiWidget();
    };

}

export { GuiProgressBar }