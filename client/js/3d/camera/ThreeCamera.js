"use strict";


define(['evt',
    'PipelineAPI',
    '3d/camera/CameraFunctions'
], function(
    evt,
    PipelineAPI,
    CameraFunctions
) {

    var cameraFunctions;

    var ThreeCamera = function() {

    };

    var setupThreeCamera = function(e) {
    //    console.log("Setup Three Cam", PipelineAPI.getCachedConfigs());
    //    evt.on(evt.list().CLIENT_TICK, updateCamera);
        
        cameraFunctions = new CameraFunctions();
        PipelineAPI.setCategoryKeyValue('CAMERA_DATA', 'CAMERA', cameraFunctions);
    };
    
    var ownPiece;
    var tpf;

    var updateCamera = function(e) {
        if (!on) return;
    //    tpf = evt.args(e).tpf;
    //    ownPiece = PipelineAPI.readCachedConfigKey('GAME_DATA', 'OWN_PLAYER').ownPiece;
    //    cameraFunctions.setCameraTargetPiece(ownPiece);
    //    cameraFunctions.updateCamera(tpf);
    };

    var on = false;

    var controlledPieceUpdated = function(e) {
        on=true;
    };


    return ThreeCamera

});