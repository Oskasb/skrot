class ControlState {
    constructor(controllablePiece, id, config) {
        this.id = id;
        this.controllablePiece = controllablePiece;
        console.log("Attach Control State", controllablePiece, config)

        let targets = config.targets;

        let controlDynamic = null;
        let targetValue = 0;
        let currentValue = 0;

        function applyStateToDynamicTarget(value, target) {
            currentValue = value;
            let dynamicId = target.dynamic;
            let factor = target['factor'] || 1;
            let assetInstance = controllablePiece.assetInstance;
            let controlDynamics = assetInstance.controlDynamics;
            controlDynamic = controlDynamics[dynamicId];
            controlDynamic.setTargetState(value * factor)
        }


        function setControlState(value) {
            if (targetValue !== value) {
                targetValue = value;
                for (let i = 0; i < targets.length; i++) {
                    applyStateToDynamicTarget(value, targets[i]);
                }
            }

        }

        function getControlCurrentValue() {
            return currentValue;
        }

        function getControlTargetValue() {
            return targetValue;
        }

        this.call = {
            setControlState: setControlState,
            getControlCurrentValue: getControlCurrentValue,
            getControlTargetValue:getControlTargetValue
        }

    }
}

export { ControlState }