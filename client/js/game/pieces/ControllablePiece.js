import {JsonAsset} from "../../application/load/JsonAsset.js";
import {poolFetch} from "../../application/utils/PoolUtils.js";
import {loadAssetInstance} from "../../application/utils/AssetUtils.js";
import {SimpleStatus} from "../../application/setup/SimpleStatus.js";
import {PieceControl} from "../controls/PieceControl.js";
import {PieceUi} from "../controls/PieceUi.js";

class ControllablePiece {
    constructor() {
        let status = new SimpleStatus()
        this.status = status;

        this.controls = {};
        this.ui = {};



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

        let controls = this.controls;
        let ui = this.ui;
        function attachControl(ctrl) {
            controls[ctrl.id] = new PieceControl(ctrl.id, ctrl.state);
        }

        function attachUi(id, file) {
            function attach(json) {
                for (let i = 0; i < json.length; i++) {
                    ui[json[i].id] = new PieceUi(_this, json[i].id, json[i])
                }


            }
            new JsonAsset(file).subscribe(attach)
        }

        function onData(json) {
            _this.json = json;
            if (json.controls) {
                for (let i = 0; i < json.controls.length; i++) {
                    attachControl(json.controls[i])
                }
            }

            let ui = json['ui'];

            if (ui.length) {
                for (let i = 0; i < ui.length; i++) {
                    attachUi(ui[i].id, ui[i].file)
                }
            }

            loadAssetInstance(json['controllable'], controllableLoaded)
        }

        jsonAsset.subscribe(onData)

    }

    getControlState(id) {
        return this.controls[id].getValue();
    }

    setControlState(id, state) {
        return this.controls[id].setValue(state);
    }

}

export {ControllablePiece}