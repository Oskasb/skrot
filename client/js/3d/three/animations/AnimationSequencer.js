class AnimationSequencer {
    constructor() {

        this.actionStateMap = {};
        this.actionStateMap[ENUMS.ActionState.ACTIVATING]     = 'prep';
        this.actionStateMap[ENUMS.ActionState.ACTIVE]         = 'exec';
        this.actionStateMap[ENUMS.ActionState.ON_COOLDOWN]    = 'end';
        //    actionStateMap[ENUMS.ActionState.AVAILABLE]      = 'end';

        this.moveStateMap = {};
        this.moveStateMap[ENUMS.CharacterState.COMBAT] = 'WALK_COMBAT';
        this.moveStateMap[ENUMS.CharacterState.IDLE] = 'WALK';

        this.stationaryStateMap = {};
        this.stationaryStateMap[ENUMS.CharacterState.COMBAT] = 'GD_RT_FF';
        this.stationaryStateMap[ENUMS.CharacterState.IDLE_HANDS] = 'IDLE_HANDS';


        this.bodyIdleMap = {};
        this.bodyIdleMap[ENUMS.CharacterState.COMBAT] = 'GD_RT_FF';
        this.bodyIdleMap[ENUMS.CharacterState.IDLE_HANDS] = 'IDLE_HANDS';

        this.speedRefMap = {};
        this.speedRefMap[ENUMS.CharacterState.COMBAT] = 'walk_combat_speed';
        this.speedRefMap[ENUMS.CharacterState.IDLE_HANDS] = 'walk_cycle_speed';

        this.combatMoveIdles = ['GD_SID_R', 'GD_MID_R', 'GD_HNG_R', 'GD_HI_R'];
        this.combatIdles = ['GD_SID_R', 'GD_MID_R', 'GD_BCK_R', 'GD_HNG_R', 'GD_INS_R', 'GD_HI_R'];

        this.peaceMoveIdle = ['WALK_BODY'];
        this.peaceIdle = ['GD_BCK_R'];

        this.poseTimeLimit = 1.3;
    }

    getGamePieceActionStateKey = function(action, gamePiece) {

        let actionState = action.getActionState();

        let actionMap = gamePiece.getPieceAnimator().getActionMap(action.getActionType());

        let animKeys = this.actionMap[actionStateMap[actionState]];
        if (!animKeys) {
            GuiAPI.printDebugText("NO ANIM KEY "+action.getActionType()+" "+actionState);
            //    console.log("No Keys", action.getActionState(), actionStateMap, actionMap)
            return;
        }
        let key = MATH.getRandomArrayEntry(animKeys);

        return key;
    };

    sequenceLegAnimation = function(state, movement, gamePiece) {

        let speed = movement.getMovementSpeed();
        let key;
        let animRefSpeed;

        if (speed) {
            key = moveStateMap[state] ;
            animRefSpeed = movement.readConfig(this.speedRefMap[state]);
        } else {
            key = this.stationaryStateMap[state];
            speed = 1;
            animRefSpeed = 1;
        }

        gamePiece.activatePieceAnimation(key, 1, speed / animRefSpeed, 1)
    };


    sequenceBodyAnimation = function(state, movement, gamePiece) {

        if (gamePiece.activeActions.length === 0) {

            let animator = gamePiece.getPieceAnimator();

            if (animator.getTimeAtKey() < this.poseTimeLimit) {
                return;
            }

            let speed = movement.getMovementSpeed();
            let key;

            if (state === ENUMS.CharacterState.IDLE_HANDS) {

                if (speed) {
                    key = MATH.getRandomArrayEntry(this.peaceMoveIdle);
                    gamePiece.activatePieceAnimation(key, 1, 1, 0.25)
                } else {
                    key = MATH.getRandomArrayEntry(this.peaceIdle);
                    gamePiece.activatePieceAnimation(key, 1, 1, 0.25)
                }

            } else {

                if (speed) {
                    key =  MATH.getRandomArrayEntry(this.combatMoveIdles);
                } else {
                    key = MATH.getRandomArrayEntry(this.combatIdles);
                }

                gamePiece.activatePieceAnimation(key, 1, 1, 0.25);

            }

            animator.setPoseKey(key);

        }

    };

}

export { AnimationSequencer }

