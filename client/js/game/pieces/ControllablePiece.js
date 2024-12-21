import {JsonAsset} from "../../application/load/JsonAsset.js";
import {poolFetch} from "../../application/utils/PoolUtils.js";
import {loadAssetInstance} from "../../application/utils/AssetUtils.js";
import {SimpleStatus} from "../../application/setup/SimpleStatus.js";
import {PieceControl} from "../controls/PieceControl.js";
import {PieceInput} from "../controls/PieceInput.js";
import {MATH} from "../../application/MATH.js";
import {ControlState} from "../controls/ControlState.js";

class ControllablePiece {
    constructor() {
        let status = new SimpleStatus()
        this.status = status;

        this.inputs = {};
        this.ui = {};


        this.controlStates = {};

        this.call = {

        }

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
        this.controlStates[id].call.setControlState(value)
    }

    getControlStateTargetValue(id) {
        return this.controlStates[id].call.getControlTargetValue();
    }

    getControlStateValue(id) {
        return this.controlStates[id].call.getControlCurrentValue();
    }

}

export {ControllablePiece}