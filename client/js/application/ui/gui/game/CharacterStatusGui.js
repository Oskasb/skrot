
class CharacterStatusGui {
    constructor() {
        this.colorMap = {
            on:{"r": 0.11, "g": 0.75, "b": 0.75, "a": 0.99},
            active:{"r": 0.99, "g": 0.93, "b": 0.39, "a": 0.99},
            off:{"r": 0.35, "g": 0.35, "b": 0.85, "a": 0.99},
            available:{"r": 0.01, "g": 0.79, "b": 0.01, "a": 0.99},
            activated:{"r": 0.99, "g": 0.23, "b": 0.2, "a": 0.99},
            unavailable:{"r": 0.7, "g": -0.1, "b": -0.15, "a": 0.39}
        }

        this.tempVec3 = new THREE.Vector3();
        this.tempVec3b = new THREE.Vector3();
        this.attackPointElements = [];
        this.actionPointElements = [];
        let updateCharStatGui = function() {
              this.updateCharacterStatElement();
        }.bind(this);

        this.callbacks = {
            updateCharStatGui:updateCharStatGui
        }

    }
    initStatusGui(gameCharacter) {
        this.charater = gameCharacter;
        this.gamePiece = gameCharacter.gamePiece;
        this.spatial = this.gamePiece.getSpatial();
    }


    addProgressElement(configId, onReady) {
        let opts = GuiAPI.buildWidgetOptions(

            {
                widgetClass:'GuiProgressBar',
                widgetCallback:onReady,
                configId:configId
            }
        );

        evt.dispatch(ENUMS.Event.BUILD_GUI_ELEMENT, opts)

    }


    addPointContainer(configId, onReady ) {
        let opts = GuiAPI.buildWidgetOptions(
            {
                widgetClass:'GuiExpandingContainer',
                widgetCallback:onReady,
                configId:configId // 'widget_attack_point_container'
            }
        );

        evt.dispatch(ENUMS.Event.BUILD_GUI_ELEMENT, opts)
    }


    activateCharacterStatusGui() {

        let onHpReady = function(element) {
            this.hpProgressElement = element;
        }.bind(this);

        let onSwingReady = function(element) {
            this.swingProgressElement = element;
        }.bind(this);

        let onAttacksContainerReady = function(element) {
            this.attacksContainer = element;
            element.guiWidget.applyWidgetPosition()
        }.bind(this)

        let onAPContainerReady = function(element) {
            this.actionPointContainer = element;
            element.guiWidget.applyWidgetPosition()
        }.bind(this)



        this.addProgressElement( 'progress_indicator_char_hp', onHpReady)
        this.addProgressElement( 'progress_indicator_char_swing', onSwingReady)
        this.addPointContainer('widget_attack_point_container', onAttacksContainerReady )
        this.addPointContainer('widget_attack_point_container', onAPContainerReady )
        GameAPI.registerGameUpdateCallback(this.callbacks.updateCharStatGui)
    }

    deactivateCharacterStatusGui() {
        GameAPI.unregisterGameUpdateCallback(this.callbacks.updateCharStatGui)
        if (this.hpProgressElement) {
            this.hpProgressElement.guiWidget.recoverGuiWidget();
        }
        if (this.swingProgressElement) {
            this.swingProgressElement.guiWidget.recoverGuiWidget();
        }
        while (this.attackPointElements.length) {
            this.attackPointElements.pop().guiWidget.recoverGuiWidget();
        }
        if (this.attacksContainer) {
            this.attacksContainer.guiWidget.recoverGuiWidget();
        }

        while (this.actionPointElements.length) {
            this.actionPointElements.pop().guiWidget.recoverGuiWidget();
        }
        if (this.actionPointContainer) {
            this.actionPointContainer.guiWidget.recoverGuiWidget();
        }

    }

    addAttackElement(configId, container, onReady) {

        let opts = GuiAPI.buildWidgetOptions(
            {
                widgetClass:'GuiExpandingContainer',
                widgetCallback:onReady,
                container:container,
                configId:configId // 'icon_attack_point'
            }
        );

        evt.dispatch(ENUMS.Event.BUILD_GUI_ELEMENT, opts)
    }

    updateMaxAttackCount(maxAttacks) {
        let attackElements = this.attackPointElements
        let container = this.attacksContainer;
        let onReady = function(element) {
            attackElements.push(element);
            container.guiWidget.applyWidgetPosition()
        }

        if (attackElements.length < maxAttacks) {
            this.addAttackElement('icon_attack_point', container, onReady)
        } else {
            while (attackElements.length > maxAttacks) {
                attackElements.pop().guiWidget.recoverGuiWidget();
            }
        }
    }

    updateAttackPointElements(maxAttacks, currentAttack, attackProgress) {
        if (this.attackPointElements.length !== maxAttacks) {
            this.updateMaxAttackCount(maxAttacks)
        }

        for (let i = 0; i < this.attackPointElements.length; i++) {
            let element = this.attackPointElements[i].guiWidget;
            let bufferElem = element.icon.bufferElement;
            if (maxAttacks - i === currentAttack) {
                element.setWidgetIconKey('atk_on');
                if (attackProgress < 0.5) {
                    bufferElem.setColorRGBA(this.colorMap['active']);
                } else {
                    bufferElem.setColorRGBA(this.colorMap['off']);
                }

            } else if (maxAttacks - i < currentAttack) {
                element.setWidgetIconKey('atk_off');
                bufferElem.setColorRGBA(this.colorMap['off']);
            } else {
                element.setWidgetIconKey('atk_on');
                bufferElem.setColorRGBA(this.colorMap['on']);
            }

        }

    }

    updateMaxAPCount(maxAttacks) {
        let attackElements = this.actionPointElements
        let container = this.actionPointContainer;
        let onReady = function(element) {
            attackElements.push(element);
            container.guiWidget.applyWidgetPosition()
        }

        if (attackElements.length < maxAttacks) {
            this.addAttackElement('icon_action_point', container, onReady)
        } else {
            while (attackElements.length > maxAttacks) {
                attackElements.pop().guiWidget.recoverGuiWidget();
            }
        }
    }

    updateActionPointElements(maxAPs, availableAPs, activeAPs) {
        if (this.actionPointElements.length !== maxAPs) {
            this.updateMaxAPCount(maxAPs)
        }

        for (let i = 0; i < this.actionPointElements.length; i++) {
            let element = this.actionPointElements[i].guiWidget;
            let bufferElem = element.icon.bufferElement;
            if (i < activeAPs) {

                element.setWidgetIconKey('ap_light');
                bufferElem.setColorRGBA(this.colorMap['activated']);

            } else if (i < availableAPs) {
                element.setWidgetIconKey('ap_light');
                bufferElem.setColorRGBA(this.colorMap['available']);
            } else {
                element.setWidgetIconKey('ap_light');
                bufferElem.setColorRGBA(this.colorMap['unavailable']);
            }

        }

    }

    updateCharacterStatElement() {
        this.spatial.getSpatialPosition(this.tempVec3);
        this.tempVec3.y += this.gamePiece.getStatusByKey('height');
        ThreeAPI.toScreenPosition(this.tempVec3, this.tempVec3b)
     //   ThreeAPI.tempVec3b.z = 0;
        this.hpProgressElement.guiWidget.setPosition(this.tempVec3b)
        this.hpProgressElement.setProgress(0, this.gamePiece.getStatusByKey('maxHP'), this.gamePiece.getStatusByKey('hp'))
        this.tempVec3b.y-=0.002
        this.swingProgressElement.guiWidget.setPosition(this.tempVec3b)
        this.swingProgressElement.setProgress(0, 1, Math.sin( this.gamePiece.getStatusByKey('atkProg') * Math.PI))
        this.tempVec3b.y-=0.004
        this.attacksContainer.guiWidget.setPosition(this.tempVec3b)
        this.updateAttackPointElements(this.gamePiece.getStatusByKey('turnAttacks'), this.gamePiece.getStatusByKey('attack'), this.gamePiece.getStatusByKey('atkProg'))

        this.tempVec3b.y += 0.014
        this.actionPointContainer.guiWidget.setPosition(this.tempVec3b)
        this.updateActionPointElements(this.gamePiece.getStatusByKey('maxAPs'), this.gamePiece.getStatusByKey('actPts'), this.gamePiece.getStatusByKey('activeAPs'))
    }

}

export { CharacterStatusGui }