import {Vector3} from "../../../../../libs/three/math/Vector3.js";

class ElementStateProcessor {

    constructor() {
        this.offset = new Vector3();
        this.anchor = new Vector3();
        this.widgetOrigin = new Vector3();
        this.widgetExtents = new Vector3();
        this.parentExtents = new Vector3();
    };

    applyStateToTextElement = function(element, elementState) {
        let feedbackId = element.getFeedbackConfigId();
        let state_feedback =  GuiAPI.getGuiSettingConfig('FEEDBACK', 'TEXT', feedbackId);
        if (state_feedback) {
            let stateKey = ENUMS.getKey('ElementState', elementState);
            if (state_feedback[stateKey]) {
                let color = state_feedback[stateKey]['color_rgba'];
                if (color) {
                    for (let  i = 0; i < element.guiStrings.length; i++) {
                        element.guiStrings[i].setStringColorRGBA(color, state_feedback[stateKey]['lut_color']);
                    }
                }
            }
        }
    };

    applyStateToIconElement = function(element, elementState) {
        let feedbackId = element.getFeedbackConfigId();
        let state_feedback =  GuiAPI.getGuiSettingConfig('FEEDBACK', 'ICON', feedbackId);

        if (state_feedback) {

            let stateKey = ENUMS.getKey('ElementState', elementState);

            if (state_feedback[stateKey]) {

                let color = state_feedback[stateKey]['color_rgba'];
                if (color) {
                    element.setGuiIconColorRGBA(color);
                }
                let lutColor = state_feedback[stateKey]['lut_color'];
                if (lutColor) {
                    element.setGuiIconLutColor(lutColor)
                }
            }
        }
    };

    applyElementStateFeedback = function(element, elementState) {

        let imgConf = element.config['image'] || null;

        let feedbackId = element.getFeedbackConfigId();
        let state_feedback =  GuiAPI.getGuiSettingConfig('FEEDBACK', 'SURFACE', feedbackId);

        if (imgConf) {
            if (state_feedback) {

                let stateKey = ENUMS.getKey('ElementState', elementState);

                if (state_feedback[stateKey]) {
                    let bufferElem = element.getBufferElement();


                    let color = state_feedback[stateKey]['color_rgba'];
                    if (color) {
                        bufferElem.setColorRGBA(color);
                    }

                    let lutColor = state_feedback[stateKey]['lut_color'];

                    if (lutColor) {
                        bufferElem.setLutColor(ENUMS.ColorCurve[lutColor]);
                        bufferElem.applyDataTexture();
                    }


                    let spriteName = state_feedback[stateKey]['sprite'];

                    if (spriteName) {

                        let sprites = GuiAPI.getUiSprites(imgConf['atlas_key']);
                        let sprite = sprites[spriteName];

                        element.sprite.x = sprite[0];
                        element.sprite.y = sprite[1];

                        element.getBufferElement().setSprite(element.sprite);

                    }
                }
            }
        }
    };



    applyElementLayout = function(widget) {
        let layoutId = widget.getLayoutConfigId();
        let layout =  GuiAPI.getGuiSettingConfig('SURFACE_LAYOUT', 'SURFACES', layoutId);

        widget.getWidgetSurface().getSurfaceExtents(this.widgetExtents);

        if (widget.parent) {
            widget.parent.getWidgetSurface().getSurfaceExtents(this.parentExtents);
            if (widget.parent.parent) {

                this.widgetOrigin.copy(widget.parent.originalPosition);
            } else {

                this.widgetOrigin.copy(widget.parent.pos);
            }

        } else {
            this.parentExtents.set(1, 1, 1);
            GuiAPI.applyAspectToScreenPosition(widget.originalPosition, this.widgetOrigin);

            let limit = layout.anchor['limitAspect'];
            if (limit) {
                this.widgetOrigin.x = MATH.clamp(this.widgetOrigin.x, -limit/2, limit/2);
            }
        }

        this.offset.set(layout.offset.x * this.widgetExtents.x, layout.offset.y * this.widgetExtents.y, layout.offset.z * this.widgetExtents.z);
        this.anchor.set(layout.anchor.x * this.parentExtents.x, layout.anchor.y * this.parentExtents.y, layout.anchor.z * this.parentExtents.z);

        if (layout.offset.center) {

            if (widget.parent) {
                widget.pos.copy(widget.parent.pos);
            }

        } else {

            this.widgetOrigin.add(this.offset);
            this.widgetOrigin.add(this.anchor);
            widget.pos.copy(this.widgetOrigin);
        }

        widget.pos.add(widget.offsetPosition);

        let layoutSize = function(widget, layout, offset, parentExtents) {

            let child;
            let children;
            let sourcePos = new THREE.Vector3();
            let pExt = new THREE.Vector3();
            let tempVec1 = new THREE.Vector3();
            let tempVec2 = new THREE.Vector3();
            let tempMin = new THREE.Vector3();
            let tempMax = new THREE.Vector3();
            let gridMinXY = new THREE.Vector3();
            let gridMaxXY = new THREE.Vector3();
            let gridSize = new THREE.Vector3();
            let padx = 0;
            let pady = 0;
            let columns;
            let col;
            let row;
            let gridX;
            let gridY;
            let osx;
            let osy;

            let layoutGridX = function(widget, layout, offset) {

                if (widget.parent) {
                    widget.parent.getWidgetSurface().getSurfaceExtents(pExt);
                } else {
                    pExt.set(0, 0, 0);
                }

                children = widget.children;

                tempVec1.set(0, 0, 0);
                gridMinXY.set(9, 9, 0);
                gridMaxXY.set( -9,  -9, 0);

                gridX = layout.size.gridx || 1;
                gridY = layout.size.gridy || 1;

                padx = layout.size.pad || 0;
                pady = layout.size.pad || 0;
                columns = layout.size.cols || 1;

                col = 0;
                row = 0;

                for (let i = 0; i < children.length; i++) {
                    child = children[i];
                    child.getWidgetOuterSize(tempVec2);

                    col = i % columns;
                    row = Math.floor(i / columns) +1;

                    osx = (tempVec2.x+padx)*col;
                    osy = (tempVec2.y+pady)*row;

                    tempVec1.x = osx*gridX + layout.offset.x * pExt.x; //+ offset.x;
                    tempVec1.y = osy*gridY + layout.offset.y * pExt.y; // -0.1 //+ offset.y;

                    //    tempVec1.add(offset);
                    child.offsetWidgetPosition(tempVec1);
                    child.getWidgetMinMax(tempMin, tempMax);

                    if (gridMinXY.x > tempMin.x-padx) {
                        gridMinXY.x = tempMin.x-padx
                    }

                    if (gridMinXY.y > tempMin.y-pady) {
                        gridMinXY.y = tempMin.y-pady
                    }

                    if (gridMaxXY.x < tempMax.x+padx) {
                        gridMaxXY.x = tempMax.x+padx
                    }

                    if (gridMaxXY.y < tempMax.y+pady) {
                        gridMaxXY.y = tempMax.y+pady
                    }

                }

                gridSize.subVectors(gridMaxXY, gridMinXY);

                widget.size.copy(gridSize);

                gridSize.multiplyScalar(0.5);

                widget.pos.copy(gridMinXY);
                widget.pos.add(gridSize);
                //    widget.pos.add(sourcePos);

            };

            if (layout.size.x === 'auto') {
                layoutGridX(widget, layout, offset, parentExtents)
            } else {
                widget.size.x = layout.size.x;
            }

            if (layout.size.y === 'auto') {

            } else {
                widget.size.y = layout.size.y;
            }

            widget.size.z = layout.size.z;

        };

        layoutSize(widget, layout, this.anchor);

        if (widget.text) {
            widget.text.setTextLayout(layout.text)
        }

    };

}

export { ElementStateProcessor }

