import {JsonAsset} from "../../application/load/JsonAsset.js";
import {poolFetch} from "../../application/utils/PoolUtils.js";
import {loadAssetInstance} from "../../application/utils/AssetUtils.js";
import {SimpleStatus} from "../../application/setup/SimpleStatus.js";
import {PieceControl} from "../controls/PieceControl.js";
import {PieceInput} from "../controls/PieceInput.js";
import {MATH} from "../../application/MATH.js";
import {ControlState} from "../controls/ControlState.js";
import {PiecePropulsion} from "../controls/PiecePropulsion.js";

let tempArray = [];

class ControllablePiece {
    constructor() {
        let status = new SimpleStatus()
        this.status = status;

        this.inputs = {};
        this.ui = {};
        this.controlStates = {};

        this.propulsion = {};

        this.call = {

        }

    }

    getObj3d() {
        return this.getAssetInstance().call.getObj3d()
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

    initControllable(id, callback) {

        let _this = this;
        let jsonAsset = new JsonAsset(id);

        function controllableLoaded(assetInstance) {
            console.log("assetInstance Loaded:", assetInstance);
            _this.assetInstance = assetInstance;
            callback(_this)
        }

        let inputs = this.inputs;
        let ui = this.ui;
        let controlStates = this.controlStates;
        let props = this.propulsion;

        function attachInput(input) {
            inputs[input.id] = new PieceControl(_this, input.id, input.state);
        }

        function attachUi(id, file) {
            function attach(json) {
                for (let i = 0; i < json.length; i++) {
                    ui[json[i].id] = new PieceInput(_this, json[i].id, json[i])
                }
            }
            new JsonAsset(file).subscribe(attach)
        }

        function attachControls(id, fileName) {
            function attachControlList(data) {
                console.log("Attach Controls List", data)
                for (let i = 0; i < data.length; i++) {
                    controlStates[data[i].id] = new ControlState(_this, data[i].id, data[i]);
                }
            }
            new JsonAsset(fileName).subscribe(attachControlList)
        }

        function attachPropulsion(point, fileName) {
            console.log("attachPropulsion", point, fileName)
            function attachProp(data) {
                console.log("Attach attachProp List", data)
                    props[point] = new PiecePropulsion(point, data);
                }

            new JsonAsset(fileName).subscribe(attachProp)
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

            loadAssetInstance(json['controllable'], controllableLoaded)
        }

        jsonAsset.subscribe(onData)

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

}

export {ControllablePiece}