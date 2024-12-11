
class CharacterAbilityGui {
    constructor() {

        this.tempVec3 = new THREE.Vector3();
        this.tempVec3b = new THREE.Vector3();
        this.screenPos = new THREE.Vector3();
        this.buttonContainers = [];
        this.abilityButtons = [];
        let updateCharAbilityGui = function() {
              this.updateCharacterAbilityElements();
        }.bind(this);

        this.callbacks = {
            updateCharAbilityGui:updateCharAbilityGui,
            deactivateCharAbilityGui:this.deactivateCharacterAbilityGui
        }

    }
    initAbilityGui(gameCharacter) {
        this.charater = gameCharacter;
        this.gamePiece = gameCharacter.gamePiece;
        this.spatial = this.gamePiece.getSpatial();
    }
    addAbilityContainer = function(configId, onReady ) {
        let opts = GuiAPI.buildWidgetOptions(
            {
                widgetClass:'GuiExpandingContainer',
                widgetCallback:onReady,
                anchor:'bottom_center',
                configId:configId
            }
        );
        evt.dispatch(ENUMS.Event.BUILD_GUI_ELEMENT, opts)
    }

    addButtonContainer(maxSlots) {
        let abilityButtons = this.abilityButtons
        let containers = this.buttonContainers;
        let slottedAbilities = this.gamePiece.getAbilities()
        let _this = this;

        let onContainerReady = function(element) {
            let barContainer = element;


            let addButtonElement = function(configId, container, slot, onReady) {

                let ability = slot.pieceAbility;
                let config = ability.config;

                let opts = GuiAPI.buildWidgetOptions(
                    {
                        widgetClass:'GuiActionButton',
                        widgetCallback:onReady,
                        onActivate:ability.call.activatePieceAbility,
                        testActive:ability.call.isActivated,
                        container:container,
                        configId:configId,
                        icon:config['icon_key']
                    }
                );
                evt.dispatch(ENUMS.Event.BUILD_GUI_ELEMENT, opts)
            }

            let onButtonReady = function(button) {
            //    element.guiWidget.applyWidgetPosition()
                barContainer.guiWidget.applyWidgetPosition();
                console.log("Action Button; ", button)

                abilityButtons.push(button);

            }

        //    element.guiWidget.applyWidgetPosition()
            containers.push(element);
            for (let i = 0; i < maxSlots; i++) {
                let slot = slottedAbilities[i]
                if (slot) {
                    addButtonElement('widget_action_button', element, slot, onButtonReady)
                }
            }
        }

        this.addAbilityContainer(this.containerConfigId, onContainerReady)
    }

    activateCharacterAbilityGui(containerId,x, y) {
        this.containerConfigId = containerId;
        this.screenPos.set(x, y, 0);
        let maxSlots = this.gamePiece.getStatusByKey('ability_slots_max');
        this.addButtonContainer(maxSlots)
        GameAPI.registerGameUpdateCallback(this.callbacks.updateCharAbilityGui)
        return this;
    }

    deactivateCharacterAbilityGui() {
        GameAPI.unregisterGameUpdateCallback(this.callbacks.updateCharAbilityGui)

        while (this.abilityButtons.length) {
            this.abilityButtons.pop().guiWidget.recoverGuiWidget();
        }
        while (this.buttonContainers.length) {
            this.buttonContainers.pop().guiWidget.recoverGuiWidget();
        }
    }

    updateAbilityElements(availableSlots) {

        let slottedAbilities = this.gamePiece.getAbilities()

    //    console.log(slottedAbilities)
        for (let i = 0; i < this.abilityButtons.length; i++) {
            let actionButton = this.abilityButtons[i];

            let element = actionButton.guiWidget;
            let bufferElem = element.icon.bufferElement;
            let slot = slottedAbilities[i]

            if (slot) {
                let ability = slot.pieceAbility;
                actionButton.updateActionButton(ability)
            } else {
            //    bufferElem.setColorRGBA(this.colorMap['unavailable']);
            }
        }
    }

    updateCharacterAbilityElements() {
    //    this.spatial.getSpatialPosition(this.tempVec3);
    //    this.tempVec3.y +=  this.gamePiece.getStatusByKey('height');
    //    GuiAPI.applyAspectToScreenPosition(this.screenPos, this.tempVec3b)

        this.updateAbilityElements(this.gamePiece.getStatusByKey('ability_slots'))

    //    for (let i = 0; i < this.buttonContainers.length; i++) {
    //        this.setContainerPosition(this.tempVec3b, this.buttonContainers[i], i, this.buttonContainers.length)
    //    }


    }

}

export { CharacterAbilityGui }