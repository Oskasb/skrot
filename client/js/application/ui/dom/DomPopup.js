"use strict";


define([
        'ui/dom/DomElement',
        'ui/GameScreen',
        "PipelineAPI"
    ],
    function(
        DomElement,
        GameScreen,
        PipelineAPI
    ) {

        var autoSubmit;

        var DomPopup = function(configId, submitCallback, onClose) {
            this.active = true;
            var _this = this;
            
            this.selection = "";
            this.submitCallback = submitCallback;
            this.closeCallback = onClose;

            this.input = null;

            var callback = function(key, data) {
                _this.config = data;
                if (_this.active) {
                    _this.applyPopupConfigs(data);
                }

            };

            this.elements = {};
            
            PipelineAPI.cacheCategoryKey('popups', 'select_name', callback);

            if (SYSTEM_SETUP.DEBUG.autoName) {
                autoSubmit = setTimeout(function() {
                    if (_this.input) {
                        _this.selection = _this.input;
                    }
                    submitCallback(_this.selection);
                    _this.removePopup();
                }, 7000 + 100);
            }


        };

        DomPopup.prototype.applyPopupConfigs = function(config) {
            var _this = this;

            var dataSource;
            var dataSample;

            var submitCallback = function() {
                _this.submitValue(dataSource.element.value.substring(0, 8));
            };

            var inputValueCallback = function() {
                dataSample.setText(dataSource.element.value.substring(0, 8));
                _this.inputChanged(dataSource.element.value.substring(0, 8));
            };

            var parent = GameScreen.getElement();
            for (var i = 0; i < config.length; i++) {
                var conf = config[i];
                if (conf.data.parentId) parent = this.elements[conf.data.parentId].element;


                var elem = new DomElement(parent, conf.data.style, conf.data.input);

                if (conf.data.data_sample) {
                    dataSample = elem;
                    elem.setText(this.selection);
                }

                if (conf.data.input) {
                    
                    var startCB = function(e) {
                        e.stopPropagation();
                    //    elem.element.focus();
                    };

                    var endCB = function(e) {
                        e.stopPropagation();
                        elem.element.focus();
                    };

                    elem.element.addEventListener('touchstart', startCB);
                    elem.element.addEventListener('touchend', endCB);
                    
                    elem.element.addEventListener('click', startCB);

                    elem.enableInteraction(startCB, endCB);
                    elem.element.onchange = submitCallback;
                    elem.element.oninput = inputValueCallback;
                    elem.element.placeholder = conf.data.input.placeholder;
                    dataSource = elem;
                }

                if (conf.data.text) {
                    elem.setText(conf.data.text)
                }
                this.elements[conf.id] = elem;
            }
            

        };


        DomPopup.prototype.submitValue = function(value) {
            this.input = value;
            var _this = this;

            setTimeout(function() {
                if (_this.input) {
                    _this.selection = _this.input;
                }
                _this.submitCallback(_this.selection);
                _this.removePopup();
            }, 300);

        };

        DomPopup.prototype.inputChanged = function(value) {
            this.input = value;
        };

        DomPopup.prototype.removePopup = function() {
            clearTimeout(autoSubmit);
            this.active = false;
            this.closeCallback(false);
            this.elements[this.config[0].id].removeElement();
            delete this;
        };
        
        return DomPopup;

    });