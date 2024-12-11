class GuiDebug {
    constructor() {
        this.holdIt = false;
        this.debugControlContainer;
        this.debugControlContainer2;
        this.debugElements = [];
        this.releaseElems = [];
        this.frameDraws = 0;
        this.debugText;
        this.debugButtons = [];
        this.debugAnimsChar;
        this.sprite = {x:8, y:0, z:0.025, w:0.025};
        this.scale  = {x:0.2, y:0.2, z:1.0};
        this.pos  = {x:0, y:0, z:0.0};
        this.rgba = {r:1, g:1, b:1, a:1};
        this.debugTxtPos = new THREE.Vector3();


        let     updateDebugElements = function() {
            this.frameDraws = 0;

            while (this.debugElements.length) {
                this.debugElements.pop().releaseElement();
            }

        }.bind(this);


        ThreeAPI.registerPrerenderCallback(updateDebugElements)


    };


    applyElem = function(elem, x, y) {

        this.debugElements.push(elem);

        elem.setSprite(this.sprite);
        elem.setScaleVec3(this.scale);

        this.rgba.r = Math.sin(elem.index*0.2152)*0.25+0.75;
        this.rgba.g = Math.cos(elem.index*0.3315)*0.25+0.75;

        this.rgba.b = Math.random()*0.75+0.25;

        elem.setColorRGBA(this.rgba);

        this.pos.x = x;
        this.pos.y = y;
        this.pos.z = -1;
        elem.setPositionVec3(this.pos);

        elem.setAttackTime(0.0);
        elem.setReleaseTime(0.2);
        elem.startLifecycleNow();

    };


    reqElem = function(xx, yy) {

        var elemcb = function(e) {
            this.applyElem(e, xx, yy);
        }.bind(this);

        GuiAPI.buildBufferElement("UI_ELEMENTS_MAIN", elemcb)
    };


    drawPointXY = function(x, y) {
        this.frameDraws++;
        this.reqElem(x, y);
    };
    
    setupDebugText = function(container) {
        let onReady = function(textBox) {
            this.debugText = textBox;
            textBox.updateTextContent("Text ready...")
        }.bind(this);

        let onActivate = function(inputIndex, widget) {
            widget.text.clearTextContent()
        };

        let opts = GuiAPI.buildWidgetOptions(

            {
                configId: 'debug_text_box',
                onActivate: null,
                interactive: false,
                text: 'DEBUG TEXT',
                container: container,
                offset_y: 0.20,
                offset_x:-0.01
            }

        );

        GuiAPI.buildGuiWidget('GuiTextBox', opts, onReady);
    };

    debugDrawPoint = function(x, y) {
        this.drawPointXY(x, y);
    };

    drawRectExtents = function(minVec, maxVec) {
        this.drawPointXY(minVec.x, minVec.y);
        this.drawPointXY(maxVec.x, minVec.y);
        this.drawPointXY(minVec.x, maxVec.y);
        this.drawPointXY(maxVec.x, maxVec.y);
    };


    addDebugTextString = function(string) {
        if (!this.debugText) {
            return;
        }
        this.debugText.updateTextContent(string)
    };



    setupDebugControlContainer = function() {
        var onReady = function(expcont) {
            this.debugControlContainer = expcont;
        }.bind(this);

        var opts = GuiAPI.buildWidgetOptions(

            {
                configId: 'widget_vertical_container',
                anchor: 'top_left'
            }

        );

        GuiAPI.buildGuiWidget('GuiExpandingContainer', opts, onReady);
    };

    setupDebugControlContainer2 = function() {
        var onReady = function(expcont) {
            this.debugControlContainer2 = expcont;
            this.debugControlContainer2.addToOffsetXY(15, 0)
        }.bind(this);

        var opts = GuiAPI.buildWidgetOptions(
            {
                configId: 'widget_expanding_container',
                anchor: 'mid_q_right'
            }
        );

        GuiAPI.buildGuiWidget('GuiExpandingContainer', opts, onReady);
    };




    addDebugButton = function(text, onActivate, testActive, container, buttonStore) {
        var onReady = function(widget) {
            container.addChildWidgetToContainer(widget.guiWidget);

            var ta = testActive;
            var w = widget.guiWidget;

            var checkActive = function() {
                var active = ta();
                if (active) {
                    if (w.guiSurface.getSurfaceInteractiveState() === ENUMS.ElementState.NONE) {
                        //    console.log("Activate...")
                        w.setWidgetInteractiveState(ENUMS.ElementState.ACTIVE)
                    }

                } else {
                    if (w.guiSurface.getSurfaceInteractiveState() === ENUMS.ElementState.ACTIVE) {
                        w.setWidgetInteractiveState(ENUMS.ElementState.NONE)
                    }
                }
            };
            widget.checkActive = checkActive;
            ThreeAPI.addPostrenderCallback(checkActive);
            if (buttonStore) {
                buttonStore.push(widget);
            }
        };

        let opts = GuiAPI.buildWidgetOptions(

            {
                configId: 'button_sharp_blue',
                onActivate: onActivate,
                testActive:testActive,
                interactive: true,
                text: text
            }

        );

        GuiAPI.buildGuiWidget('GuiSimpleButton', opts, onReady);

    };

    showAnimationState = function(animState, gamePiece, buttonStore) {

        var testActive = function() {
            return gamePiece.getPlayingAnimation(animState.key)
        };

        var onActivate = function() {
            //    if (testActive()) {
            gamePiece.activatePieceAnimation(animState.key, 1, 0.9+Math.random()*0.1)
            //    }
        };

        this.addDebugButton(animState.key, onActivate, testActive, this.debugControlContainer, buttonStore)


    };


    removeDebugAnimations = function() {
        while (this.debugButtons.length) {
            var w = this.debugButtons.pop();
            ThreeAPI.unregisterPostrenderCallback(w.checkActive);
            w.removeGuiWidget();
        }
        this.debugControlContainer.fitContainerChildren();
    };



    debugPieceAnimations = function(character) {

        if (this.debugAnimsChar) {
            GuiDebug.removeDebugAnimations();
            this.debugAnimsChar = null;
            return;
        }

        if (!character) {
            return;
        }

        var gamePiece = character.getGamePiece();
        this.debugAnimsChar = character;
        for (var i = 0; i < gamePiece.worldEntity.animationStates.length; i++) {
            this.showAnimationState(gamePiece.worldEntity.animationStates[i], gamePiece, this.debugButtons);
        }
    };

    getDebugAnimChar = function() {
        return this.debugAnimsChar;
    };

    showAttachmentButton = function(attachmentJoint, gamePiece, testWeapon) {

        var testActive = function() {
            return gamePiece.getJointActiveAttachment(attachmentJoint.key)
        };

        var onActivate = function() {
            //    if (testActive()) {
            gamePiece.attachWorldEntityToJoint(testWeapon.getWorldEntity(), attachmentJoint.key)
            //    }
        };

        addDebugButton(attachmentJoint.key, onActivate, testActive, this.debugControlContainer2)
    };

    debugPieceAttachmentPoints = function(gamePiece, testWeapon) {

        for (var i = 0; i < gamePiece.worldEntity.attachmentJoints.length; i++) {
            this.showAttachmentButton(gamePiece.worldEntity.attachmentJoints[i], gamePiece, testWeapon);
        }
    };


}

export { GuiDebug }