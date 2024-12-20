class ControlState {
    constructor(controllablePiece, id, config) {
        this.id = id;
        this.controllablePiece = controllablePiece;
        console.log("Attach Control State", controllablePiece, config)

        let targets = config.targets;


        function applyStateToDynamicTarget(value, target) {
            let dynamicId = target.dynamic;
            let factor = target['factor'] || 1;
            let assetInstance = controllablePiece.assetInstance;
            let controlDynamics = assetInstance.controlDynamics;
            let controlDynamic = controlDynamics[dynamicId];
            controlDynamic.setTargetState(value * factor)
        }


        function setControlState(value) {
            for (let i = 0; i < targets.length; i++) {
                applyStateToDynamicTarget(value, targets[i]);
            }
        }

        this.call = {
            setControlState: setControlState
        }

    }
}

export { ControlState }