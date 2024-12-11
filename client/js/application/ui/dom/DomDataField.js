"use strict";


define([
        'evt',
        'PipelineAPI',
        'application/PipelineObject',
        'ui/dom/DomElement',
        'ui/dom/DomButton'
    ],
    function(
        evt,
        PipelineAPI,
        PipelineObject,
        DomElement,
        DomButton
    ) {

        var dataTypeStyles = {
            default:"coloring_data_type_default"
        };


        var DomDataField = function(domElem, fieldData, applyButton) {
            this.category = fieldData.dataCategory;
            for (var i = 0; i < fieldData.dataKeys.length; i++) {
                this.addDataField(domElem, fieldData.dataKeys[i], fieldData.button, i, applyButton);
            }
        };

        DomDataField.prototype.addDataField = function(domElem, dataKey, button, idx, applyButton) {

            var entryElem = new DomElement(domElem.element, 'entry_data_field');
            var keyElem = new DomElement(entryElem.element, 'data_field_key');
            var velueElem = new DomElement(entryElem.element, 'data_field_value');

            keyElem.setText(dataKey);

            if (button) {
                var btElem = new DomElement(entryElem.element, ["tiny_dev_button", "coloring_button_dev_panel"]);
                btElem.enableInteraction();
                var fieldButton = {
                    button:{
                        id:"dev_panel_button",
                        event:{category:this.category, key:'button_'+dataKey, type:'toggle'}
                    },
                    text:dataKey
                };
                applyButton(btElem, fieldButton);

            }


            var callback = function(src, data) {

                velueElem.setText(data);

                if (!data) {
                    velueElem.addStyleJsonId(dataTypeStyles.false);
                    return
                }

                if (dataTypeStyles[typeof(data)]) {
                    velueElem.addStyleJsonId(dataTypeStyles[typeof(data)])
                } else {
                    velueElem.addStyleJsonId(dataTypeStyles.default)
                }

            };

            dataTypeStyles = new PipelineObject('data_types', 'style_map').readData();
            PipelineAPI.cacheCategoryKey(this.category, dataKey, callback);
            
        };

        

        return DomDataField;

    });


