import { AnimationSequencer } from "./AnimationSequencer.js";

class AnimationStateProcessor {
    constructor() {

    }

        applyActionStateToGamePiece = function(action, gamePiece) {

            let actionState = action.getActionState();

            if (actionState === ENUMS.ActionState.AVAILABLE) {
                return;
            }

            let targetTime;

            let key = AnimationSequencer.getGamePieceActionStateKey(action, gamePiece);

            if (actionState === ENUMS.ActionState.ON_COOLDOWN) {
                targetTime = action.getActionRecoverTime();
                gamePiece.actionStateEnded(action);
                gamePiece.getPieceAnimator().setPoseKey(key);
            } else {
                targetTime = action.getActionTargetTime();
            }

            gamePiece.activatePieceAnimation(key, 1, 1/targetTime, targetTime)

        };

        applyMovementStateToGamePiece = function(state, movement, gamePiece) {
            AnimationSequencer.sequenceLegAnimation(state, movement, gamePiece);
            AnimationSequencer.sequenceBodyAnimation(state, movement, gamePiece);
        };

    }

    export { AnimationStateProcessor }

