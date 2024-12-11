"use strict";


define([
        'evt',
        'PipelineAPI',
        'ui/dom/DomElement',
        'ui/dom/DomButton',
        'ui/dom/DomDataField',
        'ui/dom/DomDataLog',
        'ui/dom/DomCanvas'
    ],
    function(
        evt,
        PipelineAPI,
        DomElement,
        DomButton,
        DomDataField,
        DomDataLog,
        DomCanvas
    ) {

        var styles = {};

        var DomPanel = function(parentElem, panelId, adaptiveLayout) {
            this.active = true;
            this.ready = false;
            this.elements = {};
            this.gridElements = [];
            var _this = this;

            this.adaptiveLayout=adaptiveLayout;

            this.panelId = panelId;

            this.panel;

            this.parent = {
                element:parentElem
            };

            this.config = {};

            this.uiSystems = [];

            var callback = function(key, data) {
                _this.config = data;
                if (_this.active) {
                    _this.applyConfigs(_this.parent, data);
                }
            };


            PipelineAPI.cacheCategoryKey('ui_panels', panelId, callback);

            if (adaptiveLayout) {
                var orientationStyle = function(key, data) {
                    styles[key] = data;
                    _this.setLandscape();
                };

                PipelineAPI.cacheCategoryKey('styles', 'panel_portrait', orientationStyle);
                PipelineAPI.cacheCategoryKey('styles', 'panel_landscape', orientationStyle);


                var landscapeCallback = function(src, data) {
                    _this.updateLayout();
                };

                PipelineAPI.cacheCategoryKey('SETUP', 'LANDSCAPE', landscapeCallback);
            }

            var updateLayout = function(src, data) {
                _this.updateLayout(data);
            };

            PipelineAPI.cacheCategoryKey('SETUP', 'SCREEN', updateLayout);

        };

        DomPanel.prototype.applyButton = function(elem, confData) {
            var button = new DomButton();

            var setupReady = function(src, data) {
                button.setupReady(elem, confData.button)
            };

            if (PipelineAPI.readCachedConfigKey('SETUP', 'INPUT') == 'mouse' || PipelineAPI.readCachedConfigKey('SETUP', 'INPUT') == 'touch') {
                setupReady();
            } else {
                PipelineAPI.cacheCategoryKey('SETUP', 'INPUT', setupReady);
            }

        };

        DomPanel.prototype.applyCanvas = function(elem, confData) {
            return;
            var domCanvas = new DomCanvas(elem, confData);
            this.uiSystems.push(domCanvas);

            var setupReady = function(data) {
                //            console.log("Config for 3d canvas:", data);
                domCanvas.initCanvasSystem(data);
            };

            var confLoaded = function(src, conf) {
                for (var i = 0; i < conf.length; i++) {
                    if (conf[i].id == confData.configId) {
                        setupReady(conf[i].data);
                        return;
                    }
                }
                console.log("Config Missing for 3d canvas:", confData);
            };

            PipelineAPI.cacheCategoryKey('canvas2d', 'elements', confLoaded);
        };


        DomPanel.prototype.applyCanvas3d = function(elem, confData) {

            var domCanvas = new DomCanvas(elem, confData);
            this.uiSystems.push(domCanvas);

            var setupReady = function(data) {
                domCanvas.initCanvasSystem(data);
            };

            var confLoaded = function(src, conf) {
                for (var i = 0; i < conf.length; i++) {
                    if (conf[i].id == confData.configId) {
                        setupReady(conf[i].data);
                        return;
                    }
                }
                console.log("Config Missing for 3d canvas:", confData);
            };

            PipelineAPI.cacheCategoryKey('canvas3d', 'elements', confLoaded);
        };

        DomPanel.prototype.getAvailableElementContainer = function() {
        //    console.log("Elements:", this.elements);

            for (var key in this.elements) {
                if (typeof(this.elements[key].isAvailableContainer) === 'function') {
                    if (this.elements[key].isAvailableContainer()) {
                        console.log('Available:', key, this.elements[key])
                        return this.elements[key];
                    }
                }
            }
        };

        DomPanel.prototype.addContainedElement = function(elementConfig) {

            var _this = this;
            ;

            if (elementConfig.container) {
                var elemData = function(key, conf) {
                    for (var i = 0; i < conf.length; i++) {
                        if (conf[i].id == elementConfig.container) {
                        //    console.log("load container Element:", elementConfig, _this.parent);
                            _this.removeContainedElement(elementConfig);
                            var container = _this.attachElement(_this.panelId, conf[i]);
                            var elem = _this.attachElement(container, elementConfig)
                            elem.container = container;
                            _this.gridElements.push(container);
                        }
                    }
                };

            //    PipelineAPI.cacheCategoryKey('gui_elements', 'containers', elemData);

            } else {

            //    console.log("load Element:", elementConfig, _this.panelId);
                _this.removeContainedElement(elementConfig);
                //    var container = _this.attachElement(_this.panelId, conf[i]);
                var elem = _this.attachElement(_this.panelId, elementConfig)
                //    elem.container = container;
                //    _this.gridElements.push(container);
            }


        };


        DomPanel.prototype.removeContainedElement = function(elementConfig) {

            var id = elementConfig.id;
        //    var containerId = elementConfig.container+'_'+id;

            if (this.elements[id]) {
        //        console.log("Remove id", id, this.elements);

                    if (this.elements[id].container ) {
                        this.gridElements.splice(this.gridElements.indexOf(this.elements[id].container), 1);
                        this.elements[id].container.removeElement();
                    //    delete this.elements[key];
                    }

                this.elements[id].removeElement();
                delete this.elements[id];
                this.updateLayout();
            }

        };

        DomPanel.prototype.attachElement = function(parent, conf) {



            var _this = this;
            var dataSource;
            var dataSample;

            var submitCallback = function() {
                _this.submitValue(dataSource.element.value);
            };

            var inputValueCallback = function() {
                dataSample.setText(dataSource.element.value);
                _this.inputChanged(dataSource.element.value);
            };

            var parentElem;

            if (parent == this.panelId) {
                parentElem = this.panel.element;
            } else if (conf.data.parentId) {
                parentElem = this.elements[conf.data.parentId].element;
            } else {
                if (!parent) {
                    var container = this.getAvailableElementContainer();
                    if (container) {
                        console.log("Selected Container", container);
                        parentElem = container.element;
                    } else {
                        console.warn("NO CONTAINER AVAILABLE:", conf);
                        return;
                    }
                } else {
                    parentElem = parent.element
                }
            }

            if (!parentElem) parentElem = this.parent.element;

            if (conf.data.style) {
                var elem = new DomElement(parentElem, conf.data.style, conf.data.input);
                if (!this.panel) this.panel = elem;
                if (conf.data.parentId == this.config[0].id) {
                    //            console.log("Add grid...")
                    this.gridElements.push(elem);
                }
            } else {
                elem = parent;
            }


            if (conf.data.data_sample) {
                dataSample = elem;
                elem.setText(this.selection);
            }

            if (conf.data.button) {
                this.applyButton(elem, conf.data);
            }

            if (conf.data.dataField) {

                var applyButton = function(elem, confData) {
                    this.applyButton(elem, confData);
                }.bind(this);

                new DomDataField(elem, conf.data.dataField, applyButton)
            }

            if (conf.data.dataLog) {
                new DomDataLog(elem, conf.data.dataLog);
            }

            if (conf.data.canvas) {
                this.applyCanvas(elem, conf.data.canvas)
            }

            if (conf.data.canvas3d) {
                this.applyCanvas3d(elem, conf.data.canvas3d)

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
            return elem;
        };


        DomPanel.prototype.applyConfigs = function(parent, config) {

            for (var key in this.elements) {
                if (typeof(this.elements[key].removeElement) == 'function') {
                    this.elements[key].removeElement();
                }
            }

            this.elements = {};
            this.gridElements = [];

            for (var i = 0; i < config.length; i++) {
                this.attachElement(parent, config[i]);
            }

            this.ready = true;
            this.updateLayout();
        };

        DomPanel.prototype.setLandscape = function(landscape) {

            if (!this.ready) return;

            if (landscape) {
                this.elements[this.config[0].id].applyStyleParams(styles.panel_landscape);
            } else {
                this.elements[this.config[0].id].applyStyleParams(styles.panel_portrait);
            }

            //    this.updateLayout();


        };

        DomPanel.prototype.updateLayout = function() {

            if (this.adaptiveLayout) {
                this.setLandscape(PipelineAPI.readCachedConfigKey('SETUP', 'LANDSCAPE'));
            } else {
                this.setLandscape(true)
            }


            var w = this.elements[this.config[0].id].element.offsetWidth;
            var h = this.elements[this.config[0].id].element.offsetHeight;

            var step = [0, 1];

            var lastX = 0;
            var lastY = 0;

            if (this.adaptiveLayout && w > h) {
                step = [1, 0];
            }

            for (var i = 0; i < this.gridElements.length; i++) {

                var stepW = this.gridElements[i].element.offsetWidth;
                var stepH = this.gridElements[i].element.offsetHeight;

                var x = step[0] * stepW + step[0] * 2 + lastX;
                var y = step[1] * stepH + step[1] * 2 + lastY ;

                this.gridElements[i].translateXYZ(x - stepW*step[0], y - stepH*step[1], 1);

                lastX = x;
                lastY = y;
            }

        };

        DomPanel.prototype.removeGuiPanel = function() {

            for (var i = 0; i < this.uiSystems.length; i++) {
                this.uiSystems.removeUiSystem();
            }

            this.active = false;
            this.elements[this.config[0].id].removeElement();
            delete this;
        };

        return DomPanel;

    });


