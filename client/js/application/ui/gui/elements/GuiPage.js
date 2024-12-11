import {ConfigData} from "../../../utils/ConfigData.js";

class GuiPage {
    constructor(pageId) {
        this.isActive = false;
        this.pageId = pageId;
        this.containers = {};
        this.builtContainers= 0;
        this.configData = new ConfigData("UI", "PAGES")

        this.config = this.configData.parseConfigData()[pageId].data;

        let reactivate = function() {
            this.activateGuiPage();
        }.bind(this);

        let onUpdate = function(data) {
            if (this.isActive) {
                GuiAPI.printDebugText('REFLOW '+this.pageId)
                this.configData.reapplyDataToConfig(data, this.config, pageId);
                this.closeGuiPage();
                setTimeout(reactivate,200);
            }
        }.bind(this);

        this.configData.addUpdateCallback(onUpdate)


        let camCallback = function() {

        }.bind(this);

        let camParams = {
            mode:null,
            pos:[0, 0, 0],
            lookAt:[0, 0, 0],
            offsetPos:[0, 0, 0],
            offsetLookAt:[0, 0, 0]
        }

        let applyCamParams = function(camConf) {
            let playerChar = GameAPI.getMainCharPiece();
            let height = playerChar.getStatusByKey('height');
            let inFrontVec = tempVec3;
            inFrontVec.set(-0.2, 0, height*1.4);
            inFrontVec.applyQuaternion(playerChar.getSpatial().getQuat())

            camParams.offsetPos[0] = inFrontVec.x;
            camParams.offsetPos[1] = height*0.8
            camParams.offsetPos[2] = inFrontVec.z;
            camParams.offsetLookAt[0] = 0;
            camParams.offsetLookAt[1] = height*0.5;
            camParams.offsetLookAt[2] = 0;
            camParams.callback = camCallback;
            camParams.time = 0.05;
            if (camConf['mode'] === "portrait_main_char") {
                console.log("Make cam go to char here for nice")
            }
        }

        let updateCamera = function() {
            console.log("Legacy cam update for params")
            // GameAPI.getGameCamera().updatePlayerCamera(camParams)
        };

        this.call = {
            applyCamParams:applyCamParams,
            updateCamera:updateCamera
        }

    }

    activateGuiPage(callback) {
    //    console.log("Activate gui page ", this.config);
        this.isActive = true;

        this.builtContainers = 0;
        for (let i = 0; i < this.config.length; i++) {
            let containers = this.config[i].containers;
            let buttons = this.config[i].buttons;
            let cameraConf = this.config[i].camera;

            if (cameraConf) {
                this.setupCamera(cameraConf);
            }

            for (let j = 0; j < containers.length; j++) {
                this.setupContainer(containers[j], callback, containers.length)
            }
            for (let j = 0; j < buttons.length; j++) {
                this.setupButton(buttons[j])
            }

        }
        return this;
    }

    buildOptionsFromWidgetConfig(conf) {
        let options = GuiAPI.buildWidgetOptions(
            {
                widgetClass:conf['widget_class']     || 'GuiSimpleButton',
                configId: conf['widget_config_id']   || 'button_big_blue',
            }
        );

        for (let key in conf['options']) {
            if (key === 'container_id') {
                let id = conf['options'][key]
                options.container = this.containers[id];
            } else {
                options[key] = conf['options'][key];
            }

        }
        return options;
    }

    setupCamera(conf) {
        console.log("setupCamerae ",conf);
        this.hasCamera = true;

        let mode = conf['mode'];
        let offsetPos = conf['offset_pos'];
        let offsetLookAt = conf['offset_lookAt'];

        let camParams = {
            mode:mode,
            offsetPos:offsetPos,
            offsetLookAt:offsetLookAt
        }

        let scene = GameAPI.getActiveDynamicScenario();
        GameAPI.unregisterGameUpdateCallback(scene.call.updateCamera)
        GameAPI.registerGameUpdateCallback(this.call.updateCamera)
        this.call.applyCamParams(camParams);

    }
    setupContainer(conf, callback, count) {

        let onWidgetReady = function(widget) {
            this.containers[conf.widget_id] = widget;
            this.builtContainers++
            if (count === this.builtContainers) {
                if (typeof(callback) === 'function') {
                    callback(this);
                }
            }
        }.bind(this);

        let options = this.buildOptionsFromWidgetConfig(conf);

        GuiAPI.buildGuiWidget(conf['widget_class'], options, onWidgetReady)
    }



    setupButton(conf) {
        let onWidgetReady = function(widget) {

        }.bind(this);

        let options = this.buildOptionsFromWidgetConfig(conf);

        options.interactive = true;

        GuiAPI.buildGuiWidget(conf['widget_class'], options, onWidgetReady)
    }

    closeGuiPage() {
        if (this.hasCamera) {
            // return camera to scenario setting;
            let scene = GameAPI.getActiveDynamicScenario();
            GameAPI.unregisterGameUpdateCallback(this.call.updateCamera)
            GameAPI.registerGameUpdateCallback(scene.call.updateCamera)
        }
        this.isActive = false;
   //     console.log("Close gui page ", this);
        for (let key in this.containers) {
            let widget = this.containers[key]
            widget.guiWidget.recoverGuiWidget();
        }
        this.containers = {};
    }

}

export { GuiPage }

