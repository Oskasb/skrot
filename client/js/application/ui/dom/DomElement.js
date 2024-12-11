"use strict";


define([
        'evt',
        'ui/GameScreen',
        'ui/dom/DomUtils',
        'PipelineAPI',
    'application/PipelineObject'
    ],
    function(
        evt,
        GameScreen,
        DomUtils,
        PipelineAPI,
        PipelineObject
    ) {

        var count = 0;
        var inputModel = {};

        var configureScreen = function(e) {
            if (evt.args(e).inputModel) {


                if (evt.args(e).inputModel == 'mouse') {
                    inputModel.click = 'click';
                    inputModel.hover = 'mouseover';
                    inputModel.press = 'mousedown';
                    inputModel.out = 'mouseout';
                    inputModel.up = 'mouseup';
                }

                if (evt.args(e).inputModel == 'touch') {
                //    inputModel.hover = 'mouseover';
                    inputModel.click = 'click';
                    inputModel.move = 'touchmove';
                    inputModel.press = 'touchstart';
                    inputModel.out = 'touchleave';
                    inputModel.up = 'touchend';
                }

                PipelineAPI.setCategoryData('SETUP', {INPUT:evt.args(e).inputModel});

            //    evt.removeListener(evt.list().SCREEN_CONFIG, configureScreen);


            }
        };


    //    evt.on(evt.list().SCREEN_CONFIG, configureScreen);

        var DomElement = function(parentElem, styleId, input) {
            count++;
            this.count = count;
            this.styleId = styleId;

            this.id = this.getId();
                this.sourceColor = 'rgba(0, 0, 0, 1)';
            this.sourceTransition = 'all 0.5s ease-out';

            this.text;

            this.pressed = false;
            var element;
            if (input) {
                element = DomUtils.createTextInputElement(parentElem, this.id, input.varname, 'point');
            } else {
                element = DomUtils.createDivElement(parentElem, this.id, '', 'point');
            }

            this.element = element;

            setTimeout(function() {
                parentElem.appendChild(element);
            },1);

            var styleCallback = function(key, data) {
        //        DomUtils.applyElementStyleParams(element, data)
                this.addStyleJsonId(this.styleId)
            }.bind(this);

            if (typeof(styleId) == 'string') {
            //    console.log("String style", styleId);
                PipelineAPI.cacheCategoryKey('styles', styleId, styleCallback)
            } else {
                for (var i = 0; i < styleId.length; i++) {
                    PipelineAPI.cacheCategoryKey('styles', styleId[i], styleCallback)
                }
            }
        };

        DomElement.prototype.getId = function() {
            return this.styleId+'_'+this.count;
        };

        DomElement.prototype.isAvailableContainer = function() {
        //    console.log(DomUtils.getChildCount(this.element));
            if (!DomUtils.getChildCount(this.element)) {
                return true
            }
            return false;
        };

        DomElement.prototype.enableActive = function(style) {
            this.activeStyle = style;
        };
        
        DomElement.prototype.setActive = function(bool) {
            this.active = bool;
            if (bool) {
                this.addStyleJsonId(this.activeStyle);
            } else {
                this.addStyleJsonId(this.styleId);
            }
        };

        DomElement.prototype.setHover = function(style, callback) {

            var _this =this;
            this.hoverStyle = style;

            function setHover(e) {
                e.stopPropagation();
                _this.addStyleJsonId(_this.hoverStyle);
            }

            function releaseHover(e) {
                e.stopPropagation();

                if(_this.active) {
                    _this.addStyleJsonId(_this.activeStyle);
                } else {
                    _this.addStyleJsonId(_this.styleId);
                }

                _this.pressed = false;
            }

            function touchMove(e) {
                e.stopPropagation();
                console.log(e.target != e.scrElement);
                if (e.target != e.scrElement) {
                    releaseHover()
                }
            }


            if (!inputModel.hover) {
                _this.hoverStyle = _this.styleId;
                this.element.addEventListener(inputModel.move, touchMove);
            } else {
                this.element.addEventListener(inputModel.out, releaseHover);
                this.element.addEventListener(inputModel.hover, setHover);
            }

        };

        DomElement.prototype.setPress = function(style, callback) {

            var _this =this;

            function setPress(e) {
                e.stopPropagation();
                _this.addStyleJsonId(style);
                _this.pressed = true;
            }

            function releasePress(e) {
                e.stopPropagation();
                _this.addStyleJsonId(_this.styleId);
                if (_this.pressed) {

                }
                _this.pressed = false;
            }

            this.element.addEventListener(inputModel.press, setPress);
            this.element.addEventListener(inputModel.up, releasePress);
        };

        DomElement.prototype.setClick = function(callback) {
            this.element.addEventListener(inputModel.click, callback);
        };
        
        
        DomElement.prototype.setText = function(text) {
            if (this.text === text) return;
            this.text = text;
            this.element.innerHTML = text;
        };

        DomElement.prototype.getText = function() {
            return this.element.innerHTML;
        };

        DomElement.prototype.setStyleParam = function(param, value) {
            this.element.style[param] = value;
        };
        
        DomElement.prototype.addStyleJsonId = function(styles) {

            if (typeof(styles) == 'string') {
                DomUtils.applyElementStyleParams(this.element, PipelineAPI.readCachedConfigKey('styles', styles))
            } else {
                for (var i = 0; i < styles.length; i++) {
                    DomUtils.applyElementStyleParams(this.element, PipelineAPI.readCachedConfigKey('styles', styles[i]))
                }
            }
        };

        DomElement.prototype.applyStyleParams = function(params) {
            DomUtils.applyElementStyleParams(this.element, params);
        };

        DomElement.prototype.applyTransform = function(transform) {
            DomUtils.applyElementTransform(this.element, transform);
        };

        DomElement.prototype.scaleXYZ = function(x, y, z) {
            this.applyTransform("scale3d("+x+","+y+","+z+")");
        };

        DomElement.prototype.setBackgroundColorRGBA = function(r, g, b, a) {
            this.setStyleParam('backgroundColor', "rgba("+Math.floor(r * 255)+","+ Math.floor(g * 255)+","+ Math.floor(b * 255)+","+ a+")");
        };

        DomElement.prototype.translateRotateXYZxyzw = function(tx, ty, tz, rx, ry, rz, w) {
            this.applyTransform("translate3d("+tx+"px,"+ty+"px,"+tz+"px) rotate3d("+rx+","+ry+","+rz+", "+w+"rad)");
        };

        DomElement.prototype.translateScaleXYZSize = function(tx, ty, tz, scale) {
            this.applyTransform("translate3d("+tx+"px,"+ty+"px,"+tz+"px) scale3d("+scale+","+scale+","+scale+")");
        };

        
        DomElement.prototype.translateXYZ = function(x, y, z) {
            this.applyTransform("translate3d("+x+"px,"+y+"px,"+z+"px)");
        };

        DomElement.prototype.setTransformOrigin = function(x, y) {
            this.element.transformOrigin = x*100+'% '+y*100+'%';
        };
        
        DomElement.prototype.translateCnvRotateXYZxyzw = function(tx, ty, tz, rx, ry, rz, w) {
            this.applyTransform("translate3d("+GameScreen.pxToPercentX(tx)+"em,"+GameScreen.pxToPercentY(ty)+"em,"+tz+"em) rotate3d("+rx+","+ry+","+rz+", "+w+"rad)");
        };

        DomElement.prototype.translateCnvScaleXYZSize = function(tx, ty, tz, scale) {
            this.applyTransform("translate3d("+GameScreen.pxToPercentX(tx)+"em,"+GameScreen.pxToPercentY(ty)+"em,"+tz+"em) scale3d("+scale+","+scale+","+scale+")");
        };


        DomElement.prototype.translateCnvXYZ = function(x, y, z) {
            this.applyTransform("translate3d("+GameScreen.pxToPercentX(x)+"em,"+GameScreen.pxToPercentY(y)+"em,"+z+"em)");
        };


        DomElement.prototype.rotateXYZ = function(x, y, z, w) {
            this.applyTransform("rotate3d("+x+","+y+","+z+", "+w+"rad)");
        };

        DomElement.prototype.applyTransition = function(transition) {
            DomUtils.setElementTransition(this.element, transition);
        };

        DomElement.prototype.flashElement = function() {
            if (this.element.style.transition) this.sourceTransition = this.element.style.transition;
            this.sourceColor = this.element.style.backgroundColor;
    //        this.applyTransition('none');
            this.element.style.backgroundColor = "rgba(225, 255, 255, 1)";
            
        };

        DomElement.prototype.deFlashElement = function() {
    //        this.applyTransition(this.sourceTransition);
            this.element.style.backgroundColor = this.sourceColor;

        };

        DomElement.prototype.hideElement = function() {
            DomUtils.quickHideElement(this.element);
        };

        DomElement.prototype.showElement = function() {
            DomUtils.quickShowElement(this.element);
        };


        var events = {
            touchstart:'touchstart',
            touchend:'touchend',
            touchmove:'touchmove'
        };

        DomElement.prototype.enableInteraction = function(startCallback, endCallback) {

    //        var handleTouchStart = function(e) {
    //            //	if (!isFullscreen) enterFullscreen();
    //            evt.fire(evt.list().MESSAGE_UI, {channel:'receive_error', message:'Touch Start'});
    //         //   touchAction[0] = 1;
    //            startCallback();
    //            console.log("TStart")
    //        };
//
    //        var handleTouchEnd = function(e) {
    //       //     touchAction[0] = 0;
    //            endCallback();
    //            evt.fire(evt.list().MESSAGE_UI, {channel:'receive_error', message:'Touch End'});
    //            console.log("TEnd")
    //        };
//
    //       this.element.addEventListener(events.touchstart, handleTouchStart);
    //       this.element.addEventListener(events.touchend, handleTouchEnd);


            DomUtils.enableElementInteraction(this.element);
        };

        DomElement.prototype.removeElement = function() {
            DomUtils.removeElement(this.element);
        };


        

        return DomElement;

    });