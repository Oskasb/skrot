import {jsonAsset, loadAssetInstance} from "../../application/utils/AssetUtils.js";
import {SimpleStatus} from "../../application/setup/SimpleStatus.js";
import {PieceControl} from "../controls/PieceControl.js";
import {PieceInput} from "../controls/PieceInput.js";
import {ControlState} from "../controls/ControlState.js";
import {PiecePropulsion} from "../controls/PiecePropulsion.js";
import {ControllableForceProcessor} from "./ControllableForceProcessor.js";
import {PieceSurface} from "../controls/PieceSurface.js";
import {ControllableStatusProcessor} from "./ControllableStatusProcessor.js";
import {PieceHardpoint} from "../controls/PieceHardpoint.js";
import {MATH} from "../../application/MATH.js";
import {ENUMS} from "../../application/ENUMS.js";

let tempArray = [];

let index = 0;

class ControllablePiece {
    constructor() {
        let status = new SimpleStatus()
        this.status = status;

        this.inputs = {};
        this.ui = {};
        this.controlStates = {};
        this.surfaces = {};
        this.propulsion = {};
        this.hardpoints = {};

        new ControllableForceProcessor(this);
    }

    getLabel() {
        return this.json['label'] || "-GO-"
    }
    getObj3d() {
        return this.getAssetInstance().call.getObj3d()
    }

    getPos() {
        return this.getAssetInstance().call.getObj3d().position;
    }

    addToScene() {
        this.getAssetInstance().call.addToScene()
    }

    getStatus(key) {
        return this.status.getStatus(key);
    }

    setStatusKey(key, status) {
        this.status.setStatusKey(key, status);
    }

    getAssetInstance() {
        return this.assetInstance
    }

    getDynamicPoint(id) {
        if (this.assetInstance) {
            return this.assetInstance.call.getPointById(id);
        }
        return null;
    }

    getControlByName(name) {
        if (this.assetInstance) {
            return this.assetInstance.getControlDynamicByName(name);
        }
    }

    detachUi() {
        for (let key in this.ui) {
            this.ui[key].call.close()
        }
    }

    initControllable(id, callback, pos, rot) {

        index++;
        this.setStatusKey(ENUMS.ControllableStatus.CONTROLLABLE_ID, id+'_'+index);

        let _this = this;


        function controllableLoaded(assetInstance) {
            console.log("assetInstance Loaded:", assetInstance);
            _this.assetInstance = assetInstance;
            new ControllableStatusProcessor(_this);
            callback(_this)
        }

        let inputs = this.inputs;
        let ui = this.ui;
        let controlStates = this.controlStates;
        let props = this.propulsion;
        let surfs = this.surfaces;
        let hps = this.hardpoints;

        function attachInput(input) {
            inputs[input.id] = new PieceControl(_this, input.id, input.state);
        }

        function attachUi(id, file) {
            function attach(json) {
                for (let i = 0; i < json.length; i++) {
                    ui[json[i].id] = new PieceInput(_this, json[i].id, json[i])
                }
            }
            jsonAsset(file, attach)
        }

        function attachControls(id, fileName) {
            function attachControlList(data) {
                console.log("Attach Controls List", data)
                for (let i = 0; i < data.length; i++) {
                    controlStates[data[i].id] = new ControlState(_this, data[i].id, data[i]);
                }
            }
            jsonAsset(fileName, attachControlList)
        }

        function attachPropulsion(point, fileName) {
            console.log("attachPropulsion", point, fileName)
            function attachProp(data) {
                    props[point] = new PiecePropulsion(point, data);
                }

            jsonAsset(fileName, attachProp)
        }

        function attachSurface(point, fileName) {
            function attachProp(data) {
                surfs[point] = new PieceSurface(_this, point, data);
            }
            jsonAsset(fileName, attachProp)
        }

        function attachHardpoint(point, fileName) {
            hps[point] = new PieceHardpoint(point, _this)
            hps[point].call.setHardpointAttachment(fileName);
        }

        function onData(json) {
            _this.json = json;
            if (json.inputs) {
                for (let i = 0; i < json.inputs.length; i++) {
                    attachInput(json.inputs[i])
                }
            }

            let ui = json['ui'];

            if (ui.length) {
                for (let i = 0; i < ui.length; i++) {
                    attachUi(ui[i].id, ui[i].file)
                }
            }

            let controls = json['controls'];

            if (controls.length) {
                for (let i = 0; i < controls.length; i++) {
                    attachControls(controls[i].id, controls[i].file)
                }
            }

            let propulsion = json['propulsion'];
            if (propulsion) {
                for (let i = 0; i < propulsion.length; i++) {
                    attachPropulsion(propulsion[i].point, propulsion[i].file);
                }
            }

            let surfaces = json['surfaces']
                if (surfaces) {
                    for (let i = 0; i < surfaces.length; i++) {
                        attachSurface(surfaces[i].point, surfaces[i].file);
                    }
                }

            let hardpoints = json['hardpoints']
            if (hardpoints) {
                for (let i = 0; i < hardpoints.length; i++) {
                    attachHardpoint(hardpoints[i].point, hardpoints[i].file);
                }
            }

            loadAssetInstance(json['controllable'], pos, rot, controllableLoaded)
        }

        jsonAsset(id, onData)

    }

    getInputState(id) {
        return this.inputs[id].getValue();
    }

    setInputTargetState(id, value) {
        return this.inputs[id].setValue(value);
    }

    applyControlState(id, value) {
        if (this.controlStates[id]) {
            this.controlStates[id].call.setControlState(value)
        }
    }

    getControlStateTargets(id) {

        if (this.controlStates[id]) {
            return this.controlStates[id].call.getControlStateDynamicTargets();
        } else {
            return tempArray;
        }
    }

    getControlStateValue(id) {
        if (this.controlStates[id]) {
            return this.controlStates[id].call.getControlCurrentValue();
        } else {
            return 0;
        }
    }

    getAmmoBody() {
        if (this.assetInstance) {
            return this.getObj3d().userData.body;
        }
    }

    getMass() {
        if (this.assetInstance) {
            return this.getObj3d().userData.mass;
        } else {
            return 0;
        }
    }

    getAssetInstanceStatus(key) {
        if (this.assetInstance) {
            return this.assetInstance.status.getStatus(key);
        } else {
            return 0;
        }
    }

    closeControllablePiece() {
        this.assetInstance.call.closeInstance();
    }

    attachPieceToDynamicPoint(point) {
        this.assetInstance.call.attachToPoint(point);
    }


}

export {ControllablePiece}