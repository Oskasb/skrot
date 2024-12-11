import {notifyCameraStatus} from "../../3d/camera/CameraFunctions.js";
import {getStatusPosition} from "../../../../Server/game/actor/ActorStatusFunctions.js";

class CameraStatusProcessor {
    constructor() {
    }

    processCameraStatus(actor) {


        let frameTravelDist = actor.getStatus(ENUMS.ActorStatus.FRAME_TRAVEL_DISTANCE);
        if (frameTravelDist !== 0) {
            actor.getSpatialPosition(ThreeAPI.getCameraCursor().getPos())
            ThreeAPI.getCameraCursor().getLookAroundPoint().copy(getStatusPosition(actor))
        }

        let navigationState = actor.getStatus(ENUMS.ActorStatus.NAVIGATION_STATE);

        if (navigationState !== ENUMS.NavigationState.WORLD) {
            notifyCameraStatus( ENUMS.CameraStatus.LOOK_AT, ENUMS.CameraControls.CAM_TARGET, null)
            notifyCameraStatus( ENUMS.CameraStatus.LOOK_FROM, ENUMS.CameraControls.CAM_AHEAD, null)
            notifyCameraStatus( ENUMS.CameraStatus.CAMERA_MODE, ENUMS.CameraControls.CAM_ORBIT, null)
            return;
        }

        let travelMode = actor.getStatus(ENUMS.ActorStatus.TRAVEL_MODE);
        let statusKey = ENUMS.CameraStatus.CAMERA_MODE;
        let controlKey = ENUMS.CameraControls.CAM_AUTO;


        let partySelected = actor.getStatus(ENUMS.ActorStatus.PARTY_SELECTED);
        let sequencerSelected = actor.getStatus(ENUMS.ActorStatus.SEQUENCER_SELECTED);
        let hasTurn = actor.getStatus(ENUMS.ActorStatus.HAS_TURN);
        let selectedTarget = GameAPI.getActorById(actor.getStatus(ENUMS.ActorStatus.SELECTED_TARGET))

        if (travelMode === ENUMS.TravelMode.TRAVEL_MODE_FLY) {
            controlKey = ENUMS.CameraControls.CAM_FLIGHT;
            notifyCameraStatus( ENUMS.CameraStatus.LOOK_AT, ENUMS.CameraControls.CAM_AHEAD, null)
            notifyCameraStatus( ENUMS.CameraStatus.LOOK_FROM, ENUMS.CameraControls.CAM_SHOULDER, null)
        }

        if (travelMode === ENUMS.TravelMode.TRAVEL_MODE_MENU) {
            controlKey = ENUMS.CameraControls.CAM_MENU;
        }

        if (travelMode === ENUMS.TravelMode.TRAVEL_MODE_INACTIVE) {
            controlKey = ENUMS.CameraControls.CAM_EDIT;
        //    notifyCameraStatus( ENUMS.CameraStatus.LOOK_AT, ENUMS.CameraControls.CAM_AHEAD, null)
        //    notifyCameraStatus( ENUMS.CameraStatus.LOOK_FROM, ENUMS.CameraControls.CAM_SHOULDER, null)
        }

        if (travelMode === ENUMS.TravelMode.TRAVEL_MODE_LEAP) {
            controlKey = ENUMS.CameraControls.CAM_MOVE;
            notifyCameraStatus( ENUMS.CameraStatus.LOOK_AT, ENUMS.CameraControls.CAM_AHEAD, true)
            notifyCameraStatus( ENUMS.CameraStatus.LOOK_FROM, ENUMS.CameraControls.CAM_PARTY, true)
        }

        if (travelMode === ENUMS.TravelMode.TRAVEL_MODE_PASSIVE) {
            controlKey = ENUMS.CameraControls.CAM_MOVE;
            notifyCameraStatus( ENUMS.CameraStatus.LOOK_AT, ENUMS.CameraControls.CAM_AHEAD, null)
            notifyCameraStatus( ENUMS.CameraStatus.LOOK_FROM, ENUMS.CameraControls.CAM_SHOULDER, null)
        }

        if (travelMode === ENUMS.TravelMode.TRAVEL_MODE_GRID) {
            let moveControlActive = actor.getControl(ENUMS.Controls.CONTROL_MOVE_ACTION)
            if (partySelected) {
                if (moveControlActive === 1) {
                    controlKey = ENUMS.CameraControls.CAM_GRID;
                    if (selectedTarget) {
                        controlKey = ENUMS.CameraControls.CAM_POINT;
                        notifyCameraStatus( ENUMS.CameraStatus.LOOK_AT, ENUMS.CameraControls.CAM_TARGET, null)
                        notifyCameraStatus( ENUMS.CameraStatus.LOOK_FROM, ENUMS.CameraControls.CAM_SHOULDER, null)
                    } else {
                        notifyCameraStatus( ENUMS.CameraStatus.LOOK_AT, ENUMS.CameraControls.CAM_AHEAD, null)
                        notifyCameraStatus( ENUMS.CameraStatus.LOOK_FROM, ENUMS.CameraControls.CAM_HIGH, null)
                    }


                } else {
                    controlKey = ENUMS.CameraControls.CAM_MOVE;
                    if (selectedTarget) {
                        controlKey = ENUMS.CameraControls.CAM_POINT;
                        notifyCameraStatus( ENUMS.CameraStatus.LOOK_AT, ENUMS.CameraControls.CAM_TARGET, null)
                    } else {
                        notifyCameraStatus( ENUMS.CameraStatus.LOOK_AT, ENUMS.CameraControls.CAM_AHEAD, null)
                    }
                    notifyCameraStatus( ENUMS.CameraStatus.LOOK_FROM, ENUMS.CameraControls.CAM_PARTY, null)
                }
            } else {
                controlKey = ENUMS.CameraControls.CAM_GRID;
                if (selectedTarget) {
                    controlKey = ENUMS.CameraControls.CAM_POINT;
                    notifyCameraStatus( ENUMS.CameraStatus.LOOK_AT, ENUMS.CameraControls.CAM_TARGET, null)
                    notifyCameraStatus( ENUMS.CameraStatus.LOOK_FROM, ENUMS.CameraControls.CAM_SHOULDER, null)
                } else {
                    notifyCameraStatus( ENUMS.CameraStatus.LOOK_AT, ENUMS.CameraControls.CAM_AHEAD, null)
                    notifyCameraStatus( ENUMS.CameraStatus.LOOK_FROM, ENUMS.CameraControls.CAM_HIGH, null)
                }

            }
        }

        if (travelMode === ENUMS.TravelMode.TRAVEL_MODE_WALK) {
            let moveControlActive = actor.getControl(ENUMS.Controls.CONTROL_RUN_ACTION)
            if (partySelected) {
                if (moveControlActive === 1) {

                    if (selectedTarget) {
                        controlKey = ENUMS.CameraControls.CAM_POINT;
                        notifyCameraStatus( ENUMS.CameraStatus.LOOK_AT, ENUMS.CameraControls.CAM_TARGET, null)
                        notifyCameraStatus( ENUMS.CameraStatus.LOOK_FROM, ENUMS.CameraControls.CAM_SHOULDER, null)
                    } else {
                        controlKey = ENUMS.CameraControls.CAM_MOVE;
                        notifyCameraStatus( ENUMS.CameraStatus.LOOK_AT, ENUMS.CameraControls.CAM_AHEAD, null)
                        notifyCameraStatus( ENUMS.CameraStatus.LOOK_FROM, ENUMS.CameraControls.CAM_HIGH, null)
                    }


                } else {
                    controlKey = ENUMS.CameraControls.CAM_MOVE;
                    if (selectedTarget) {
                        controlKey = ENUMS.CameraControls.CAM_POINT;
                        notifyCameraStatus( ENUMS.CameraStatus.LOOK_AT, ENUMS.CameraControls.CAM_TARGET, null)
                    } else {
                        notifyCameraStatus( ENUMS.CameraStatus.LOOK_AT, ENUMS.CameraControls.CAM_AHEAD, null)
                    }
                    notifyCameraStatus( ENUMS.CameraStatus.LOOK_FROM, ENUMS.CameraControls.CAM_HIGH, null)
                }
            } else {
            //

                if (moveControlActive === 1) {

                    if (selectedTarget) {
                        controlKey = ENUMS.CameraControls.CAM_POINT;
                        notifyCameraStatus( ENUMS.CameraStatus.LOOK_AT, ENUMS.CameraControls.CAM_TARGET, null)
                        notifyCameraStatus( ENUMS.CameraStatus.LOOK_FROM, ENUMS.CameraControls.CAM_SHOULDER, null)
                    } else {
                        controlKey = ENUMS.CameraControls.CAM_MOVE;
                        notifyCameraStatus( ENUMS.CameraStatus.LOOK_AT, ENUMS.CameraControls.CAM_AHEAD, null)
                        notifyCameraStatus( ENUMS.CameraStatus.LOOK_FROM, ENUMS.CameraControls.CAM_HIGH, null)
                    }

                } else {

                    controlKey = ENUMS.CameraControls.CAM_MOVE;
                    if (selectedTarget) {
                        controlKey = ENUMS.CameraControls.CAM_POINT;
                        notifyCameraStatus( ENUMS.CameraStatus.LOOK_AT, ENUMS.CameraControls.CAM_TARGET, null)
                    } else {
                        notifyCameraStatus( ENUMS.CameraStatus.LOOK_AT, ENUMS.CameraControls.CAM_AHEAD, null)
                    }
                    notifyCameraStatus( ENUMS.CameraStatus.LOOK_FROM, ENUMS.CameraControls.CAM_HIGH, null)

                }

            }
        }

        if (travelMode === ENUMS.TravelMode.TRAVEL_MODE_RUN) {
            let moveControlActive = actor.getControl(ENUMS.Controls.CONTROL_RUN_ACTION)
            if (partySelected) {
                if (moveControlActive === 1) {
                    controlKey = ENUMS.CameraControls.CAM_MOVE;
                    if (selectedTarget) {
                        controlKey = ENUMS.CameraControls.CAM_POINT;
                        notifyCameraStatus( ENUMS.CameraStatus.LOOK_AT, ENUMS.CameraControls.CAM_TARGET, null)
                        notifyCameraStatus( ENUMS.CameraStatus.LOOK_FROM, ENUMS.CameraControls.CAM_SHOULDER, null)
                    } else {
                        notifyCameraStatus( ENUMS.CameraStatus.LOOK_AT, ENUMS.CameraControls.CAM_AHEAD, null)
                        notifyCameraStatus( ENUMS.CameraStatus.LOOK_FROM, ENUMS.CameraControls.CAM_SHOULDER, null)
                    }


                } else {
                    controlKey = ENUMS.CameraControls.CAM_MOVE;
                    if (selectedTarget) {
                        controlKey = ENUMS.CameraControls.CAM_POINT;
                        notifyCameraStatus( ENUMS.CameraStatus.LOOK_AT, ENUMS.CameraControls.CAM_TARGET, null)
                    } else {
                        notifyCameraStatus( ENUMS.CameraStatus.LOOK_AT, ENUMS.CameraControls.CAM_AHEAD, null)
                    }
                    notifyCameraStatus( ENUMS.CameraStatus.LOOK_FROM, ENUMS.CameraControls.CAM_HIGH, null)
                }
            } else {
                controlKey = ENUMS.CameraControls.CAM_MOVE;
                if (selectedTarget) {
                    controlKey = ENUMS.CameraControls.CAM_POINT;
                    notifyCameraStatus( ENUMS.CameraStatus.LOOK_AT, ENUMS.CameraControls.CAM_TARGET, null)
                    notifyCameraStatus( ENUMS.CameraStatus.LOOK_FROM, ENUMS.CameraControls.CAM_SHOULDER, null)
                } else {
                    notifyCameraStatus( ENUMS.CameraStatus.LOOK_AT, ENUMS.CameraControls.CAM_PARTY, null)
                    notifyCameraStatus( ENUMS.CameraStatus.LOOK_FROM, ENUMS.CameraControls.CAM_HIGH, null)
                }

            }
        }


        if (travelMode === ENUMS.TravelMode.TRAVEL_MODE_JETPACK) {
            controlKey = ENUMS.CameraControls.CAM_MOVE;
            notifyCameraStatus( ENUMS.CameraStatus.LOOK_AT, ENUMS.CameraControls.CAM_AHEAD, true)
            notifyCameraStatus( ENUMS.CameraStatus.LOOK_FROM, ENUMS.CameraControls.CAM_PARTY, true)
            notifyCameraStatus( ENUMS.CameraStatus.POINTER_ACTION, ENUMS.CameraControls.CAM_MOVE, null)
        }

        if (travelMode === ENUMS.TravelMode.TRAVEL_MODE_BATTLE) {

            if (!actor.getStatus(ENUMS.ActorStatus.HAS_TURN)) {
            //    return;
            }

            let isRemote = false;
            if (actor.call.getRemote()) {
                isRemote = true;
            }

            let turnActiveActor = GameAPI.call.getTurnActiveSequencerActor();
            let targetActor = null;
            if (turnActiveActor) {
                targetActor = GameAPI.getActorById(turnActiveActor.getStatus(ENUMS.ActorStatus.SELECTED_TARGET))
            }

            let moveControlActive = actor.getControl(ENUMS.Controls.CONTROL_MOVE_ACTION)
            let partySelected = actor.getStatus(ENUMS.ActorStatus.PARTY_SELECTED)
            controlKey = ENUMS.CameraControls.CAM_SEQUENCER;
            /*
            if (turnActiveActor !== actor || isRemote) {

                if (!targetActor) {
                    controlKey = ENUMS.CameraControls.CAM_GRID;

                    notifyCameraStatus( ENUMS.CameraStatus.LOOK_AT, ENUMS.CameraControls.CAM_AHEAD, true)
                    if (partySelected) {
                        notifyCameraStatus( ENUMS.CameraStatus.LOOK_FROM, ENUMS.CameraControls.CAM_PARTY, true)
                    } else {
                        notifyCameraStatus( ENUMS.CameraStatus.LOOK_FROM, ENUMS.CameraControls.CAM_HIGH, true)
                    }

                } else {
                    controlKey = ENUMS.CameraControls.CAM_ENCOUNTER;
                    notifyCameraStatus( statusKey, controlKey, true)
                    if (partySelected) {
                        notifyCameraStatus( ENUMS.CameraStatus.LOOK_AT, ENUMS.CameraControls.CAM_TARGET, null)
                        notifyCameraStatus( ENUMS.CameraStatus.LOOK_FROM, ENUMS.CameraControls.CAM_HIGH, null)
                    } else {
                        notifyCameraStatus( ENUMS.CameraStatus.LOOK_AT, ENUMS.CameraControls.CAM_TARGET, null)
                        notifyCameraStatus( ENUMS.CameraStatus.LOOK_FROM, ENUMS.CameraControls.CAM_HIGH, null)
                    }
                }

            } else {

                if (targetActor) {
                    if (targetActor !== turnActiveActor) {

                        if (moveControlActive === 1) {
                            controlKey = ENUMS.CameraControls.CAM_GRID;
                            notifyCameraStatus( statusKey, controlKey, true)
                            notifyCameraStatus( ENUMS.CameraStatus.LOOK_AT, ENUMS.CameraControls.CAM_AHEAD, true)
                            if (partySelected) {
                                notifyCameraStatus( ENUMS.CameraStatus.LOOK_FROM, ENUMS.CameraControls.CAM_HIGH, true)
                            } else {
                                notifyCameraStatus( ENUMS.CameraStatus.LOOK_FROM, ENUMS.CameraControls.CAM_HIGH, true)
                            }

                        } else {
                            controlKey = ENUMS.CameraControls.CAM_ENCOUNTER;
                            if (partySelected) {
                                notifyCameraStatus( ENUMS.CameraStatus.LOOK_AT, ENUMS.CameraControls.CAM_AHEAD, null)
                                notifyCameraStatus( ENUMS.CameraStatus.LOOK_FROM, ENUMS.CameraControls.CAM_PARTY, null)
                            } else {
                                notifyCameraStatus( ENUMS.CameraStatus.LOOK_AT, ENUMS.CameraControls.CAM_AHEAD, null)
                                notifyCameraStatus( ENUMS.CameraStatus.LOOK_FROM, ENUMS.CameraControls.CAM_HIGH, null)
                            }
                        }

                    } else {

                        if (partySelected) {

                            if (moveControlActive === 1) {
                                controlKey = ENUMS.CameraControls.CAM_GRID;
                                notifyCameraStatus( statusKey, controlKey, true)
                                notifyCameraStatus( ENUMS.CameraStatus.LOOK_AT, ENUMS.CameraControls.CAM_TARGET, true)
                                notifyCameraStatus( ENUMS.CameraStatus.LOOK_FROM, ENUMS.CameraControls.CAM_HIGH, true)
                            } else {
                                controlKey = ENUMS.CameraControls.CAM_ENCOUNTER;
                                notifyCameraStatus( ENUMS.CameraStatus.LOOK_AT, ENUMS.CameraControls.CAM_TARGET, null)
                                notifyCameraStatus( ENUMS.CameraStatus.LOOK_FROM, ENUMS.CameraControls.CAM_PARTY, null)
                            }

                        } else {

                            if (moveControlActive === 1) {
                                controlKey = ENUMS.CameraControls.CAM_GRID;
                                notifyCameraStatus( ENUMS.CameraStatus.LOOK_AT, ENUMS.CameraControls.CAM_TARGET, true)
                                notifyCameraStatus( ENUMS.CameraStatus.LOOK_FROM, ENUMS.CameraControls.CAM_HIGH, true)
                            } else {
                                controlKey = ENUMS.CameraControls.CAM_ENCOUNTER;
                                notifyCameraStatus( ENUMS.CameraStatus.LOOK_AT, ENUMS.CameraControls.CAM_AHEAD, null)
                                notifyCameraStatus( ENUMS.CameraStatus.LOOK_FROM, ENUMS.CameraControls.CAM_HIGH, null)
                            }

                        }

                    }

                } else {

                    if (partySelected) {
                        if (moveControlActive === 1) {
                            controlKey = ENUMS.CameraControls.CAM_SEQUENCER;
                            notifyCameraStatus( ENUMS.CameraStatus.LOOK_AT, ENUMS.CameraControls.CAM_AHEAD, true)
                            notifyCameraStatus( ENUMS.CameraStatus.LOOK_FROM, ENUMS.CameraControls.CAM_PARTY, true)
                        } else {
                            controlKey = ENUMS.CameraControls.CAM_SEQUENCER;
                            notifyCameraStatus( ENUMS.CameraStatus.LOOK_AT, ENUMS.CameraControls.CAM_AHEAD, null)
                            notifyCameraStatus( ENUMS.CameraStatus.LOOK_FROM, ENUMS.CameraControls.CAM_PARTY, null)
                        }

                    } else {
                        controlKey = ENUMS.CameraControls.CAM_SEQUENCER;
                        if (targetActor) {
                            controlKey = ENUMS.CameraControls.CAM_SEQUENCER;
                            notifyCameraStatus( ENUMS.CameraStatus.LOOK_AT, ENUMS.CameraControls.CAM_TARGET, null)
                        } else {
                            notifyCameraStatus( ENUMS.CameraStatus.LOOK_AT, ENUMS.CameraControls.CAM_AHEAD, null)
                        }
                        notifyCameraStatus( ENUMS.CameraStatus.LOOK_FROM, ENUMS.CameraControls.CAM_HIGH, null)
                    }
                }
            }

            */
        }



        notifyCameraStatus( statusKey, controlKey, null)

    }

}

export { CameraStatusProcessor}