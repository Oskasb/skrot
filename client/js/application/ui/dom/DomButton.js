"use strict";


import {pipelineAPI} from "../../utils/DataUtils.js";

define([
        'evt',
        'PipelineAPI'
    ],
    function(
        evt,
        PipelineAPI
    ) {

        var DomButton = function() {
            this.active = false;

        };
        
        DomButton.prototype.setupReady = function(domElem, buttonData) {
            if (this.active) return;
            
            var state = {
                pressed:false,
                active:pipelineAPI.readCachedConfigKey(buttonData.event.category, buttonData.event.key),
                value:true
            };

            if (buttonData.event.type == 'float') {
                state.value = 0;
            }

            var data = {};
            data[buttonData.event.key] = state.value;

            var onHover = function() {

            };

            var onPress = function(key, value) {
                if (buttonData.event.type === 'float') {
                    var value = pipelineAPI.readCachedConfigKey('POINTER_STATE', 'dx');
                    if (value != state.value) {
                        data[buttonData.event.key] = state.value;

                    //    evt.fire(evt.list().BUTTON_EVENT, {category:buttonData.event.category, data:data, element:domElem.element});
                    }
                    state.active = true;
                }
            };

            var onActive = function(key, value) {

                if (key !== buttonData.event.key) {
                    console.log("Wong Key? ", key);
                    return
                }

                state.active = value;
                notifyActive()
            };

            var notifyActive = function() {

            };

            var releaseActive = function(key, value) {
                if (buttonData.event.type === 'float') {
                    state.value += 0.1;
                    data[buttonData.event.key] = state.value;
                    //    evt.fire(evt.list().BUTTON_EVENT, {category:buttonData.event.category, data:data, element:domElem.element});
                }

                state.active = value;
            };

            var enableActive = function(data) {
                domElem.enableActive(data.active.style);
                notifyActive = function() {
                    domElem.setActive(state.active);
                };
            };
            
            var onClick = function() {

                if (buttonData.event.type === 'float') {
                    state.value += 0.1;
                } else {
                    state.value = !state.active;
                }


                data[buttonData.event.key] = state.value;
            //    evt.fire(evt.list().BUTTON_EVENT, {category:buttonData.event.category, data:data, element:domElem.element});
            };


            if (buttonData.event.type === 'toggle') {
                pipelineAPI.cacheCategoryKey(buttonData.event.category, buttonData.event.key, onActive);
            }

            if (buttonData.event.type === 'float') {
                pipelineAPI.cacheCategoryKey(buttonData.event.category, buttonData.event.key, onPress);
            }

            var callback = function(key, data) {
                domElem.setHover(data.hover.style, onHover);
                domElem.setPress(data.press.style, onPress);
                domElem.setClick(onClick);

                if (buttonData.event.type === 'toggle') {
                    enableActive(data);
                    notifyActive()
                }

                if (buttonData.event.type === 'float') {
                    releaseActive(data);
                    notifyActive()
                }

            };

            pipelineAPI.cacheCategoryKey('ui_buttons', buttonData.id, callback);
            this.active = true;
        };
         
        
        return DomButton;

    });


