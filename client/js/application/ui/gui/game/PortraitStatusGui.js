
class PortraitStatusGui {
    constructor(hpProgressId) {

        this.hpProgressId = hpProgressId || 'progress_indicator_portrait_hp'

        this.colorMap = {
            on:{"r": 0.11, "g": 0.75, "b": 0.75, "a": 0.99},
            active:{"r": 0.99, "g": 0.93, "b": 0.39, "a": 0.99},
            off:{"r": 0.35, "g": 0.35, "b": 0.85, "a": 0.99},
            available:{"r": 0.01, "g": 0.79, "b": 0.01, "a": 0.99},
            activated:{"r": 0.99, "g": 0.23, "b": 0.2, "a": 0.99},
            unavailable:{"r": 0.7, "g": -0.1, "b": -0.15, "a": 0.39}
        }

        this.container;

        this.portraitMinXY = new THREE.Vector3();
        this.portraitMaxXY = new THREE.Vector3();
        this.potraitCenter = new THREE.Vector3()
        this.tempVec3 = new THREE.Vector3();
        this.tempVec3b = new THREE.Vector3();
        this.attackPointElements = [];
        this.actionPointElements = [];
        let updateCharStatGui = function(tpf) {
              this.updateCharacterStatElement(tpf);
        }.bind(this);

        this.callbacks = {
            updateCharStatGui:updateCharStatGui
        }
    }

    initPortraitStatusGui(actor, portraitWidget) {
        this.actor = actor;
        this.container = portraitWidget;
        this.activatePortraitStatusGui();
    }


    addProgressElement(configId, onReady) {
        let opts = GuiAPI.buildWidgetOptions(

            {
                widgetClass:'GuiProgressBar',
                widgetCallback:onReady,
                set_parent:this.container.guiWidget,
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
                set_parent:this.container.guiWidget,
                configId:configId // 'widget_attack_point_container'
            }
        );

        evt.dispatch(ENUMS.Event.BUILD_GUI_ELEMENT, opts)
    }


    activatePortraitStatusGui() {

    //    console.log("activatePortraitStatusGui")

        let onHpReady = function(element) {
            this.hpProgressElement = element;
        }.bind(this);

        let onSwingReady = function(element) {
            this.swingProgressElement = element;
        }.bind(this);

        let onAttacksContainerReady = function(element) {
            this.attacksContainer = element;
        }.bind(this)

        let onAPContainerReady = function(element) {
            this.actionPointContainer = element;
        }.bind(this)

        this.addProgressElement( this.hpProgressId,  onHpReady)
        this.addProgressElement( 'progress_indicator_portrait_swing',  onSwingReady)
        this.addPointContainer('widget_attack_point_container',  onAttacksContainerReady )
        this.addPointContainer('widget_attack_point_container',  onAPContainerReady )
    }

    deactivatePortraitStatusGui() {
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

    updateCharacterStatElement(tpf) {
        this.portraitMinXY.copy(this.container.guiWidget.guiSurface.minXY)
        this.portraitMaxXY.copy(this.container.guiWidget.guiSurface.maxXY)
        this.potraitCenter.copy(this.container.guiWidget.guiSurface.centerXY);


        let minXY = this.hpProgressElement.guiWidget.guiSurface.minXY;
        let maxXY = this.hpProgressElement.guiWidget.guiSurface.maxXY

        ThreeAPI.tempVec3b.set(0.012, 0.013, 0)
        minXY.copy(this.portraitMinXY)
        maxXY.copy(this.portraitMaxXY)
        let width = Math.abs(maxXY.x - minXY.x);
        minXY.add(ThreeAPI.tempVec3b);
        maxXY.sub(ThreeAPI.tempVec3b);


        minXY = this.swingProgressElement.guiWidget.guiSurface.minXY;
        maxXY = this.swingProgressElement.guiWidget.guiSurface.maxXY

        minXY.copy(this.portraitMinXY)
        maxXY.copy(this.portraitMaxXY)
    //    let width = Math.abs(maxXY.x - minXY.x);
        maxXY.x = minXY.x + width*0.18;
        minXY.x +=0.013;
        ThreeAPI.tempVec3b.set(0.0, 0.013, 0)
        minXY.add(ThreeAPI.tempVec3b);
        maxXY.sub(ThreeAPI.tempVec3b);

    //    this.swingProgressElement.guiWidget.setPosition( ThreeAPI.tempVec3b)
    //    this.swingProgressElement.guiWidget.setPosition( ThreeAPI.tempVec3b)

    //    ThreeAPI.tempVec3b.copy( this.portraitMaxXY);
        ThreeAPI.tempVec3b.y = this.portraitMaxXY.y-0.005;
        ThreeAPI.tempVec3b.x = this.potraitCenter.x
        this.actionPointContainer.guiWidget.setPosition( ThreeAPI.tempVec3b)

    //    ThreeAPI.tempVec3b.copy(this.portraitMinXY);
        ThreeAPI.tempVec3b.y = this.portraitMinXY.y+0.008;
        ThreeAPI.tempVec3b.x = this.potraitCenter.x
        this.attacksContainer.guiWidget.setPosition( ThreeAPI.tempVec3b)

        let maxHP =  this.actor.getStatus(ENUMS.ActorStatus.MAX_HP);
        let hp =  this.actor.getStatus(ENUMS.ActorStatus.HP)
        this.hpProgressElement.setProgress(0, maxHP, hp)
    //    this.tempVec3b.y-=0.002
    //    this.swingProgressElement.guiWidget.setPosition(this.tempVec3b)
     //   this.swingProgressElement.setProgress(0, 1, MATH.curveQuad(Math.sin( this.actor.getStatus('atkProg') * Math.PI)))
    //    this.tempVec3b.y-=0.004
   //     this.attacksContainer.guiWidget.setPosition(this.tempVec3b)
    //    this.updateAttackPointElements(this.actor.getStatus('turnAttacks'), this.actor.getStatus('attack'), this.actor.getStatus('atkProg'))

   //     this.tempVec3b.y += 0.014
    //    this.actionPointContainer.guiWidget.setPosition(this.tempVec3b)
    //    this.updateActionPointElements(this.actor.getStatus('maxAPs'), this.actor.getStatus('actPts'), this.actor.getStatus('activeAPs'))
    }

}

export { PortraitStatusGui }