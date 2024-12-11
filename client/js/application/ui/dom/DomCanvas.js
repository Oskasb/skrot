"use strict";

define([
        'evt',
        'application/PipelineObject',
        'PipelineAPI',
        'ui/GameScreen',
        'ui/canvas/CanvasElement'
    ],
    function(
        evt,
        PipelineObject,
        PipelineAPI,
        GameScreen,
        CanvasElement
    ) {


        var DomCanvas = function(parent, conf) {
            this.configId = conf.configId;
            this.conf = conf;
            this.active = false;
            this.parent = parent;
        };

        DomCanvas.prototype.initCanvasSystem = function(canvasParams) {
            
            var _this = this;

            this.canvasElement = new CanvasElement(canvasParams);

            this.ready = false;

            var clientTick = function(e) {
                _this.canvasElement.updateCanvasElement(evt.args(e).tpf);
            };


            var toggleTriggered = function(data) {
        //        console.log("Enable event", src, data);
                if (_this.ready) {
                    _this.canvasElement.toggleEnabled(data);
                }

            };

            var playerReady = function() {

                if (_this.ready) return;

                if (!_this.active) {
                    _this.pipelineObject = new PipelineObject('canvas', 'systems', configLoaded);
                }

                if (_this.conf.enableOnEvent) {
        //            console.log("Enable event", _this.conf);
                    var data = {};
                    data[_this.conf.enableOnEvent.key] = false;
                    PipelineAPI.setCategoryData(_this.conf.enableOnEvent.category, data);
                    PipelineAPI.cacheCategoryKey(_this.conf.enableOnEvent.category, _this.conf.enableOnEvent.key, toggleTriggered);

                } else {
                    toggleTriggered(true);
                }


                _this.active = true;
            };


            var guiReady = function() {
        //        console.log("GUI READY CALLBACK FIRED");

            };
        //    new PipelineObject('GAME_DATA', 'OWN_PLAYER', playerReady);

            var configLoaded = function(src, conf) {

                _this.ready = true;
                _this.canvasElement.applyElementConfig(_this.parent, _this.pipelineObject.buildConfig()[_this.configId], guiReady);
    //            evt.on(evt.list().CLIENT_TICK, clientTick);
            };

            playerReady();
        };


        DomCanvas.prototype.removeUiSystem = function() {
            this.canvasApi.removeCanvasGui();
        };

        return DomCanvas;

    });


