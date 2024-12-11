class Ocean {
    constructor() {

    }

    generateOcean() {
        let addSceneInstance = function(instance) {
            console.log(instance);

            instance.setActive(ENUMS.InstanceState.ACTIVE_VISIBLE);

            instance.spatial.setScaleXYZ(10, 0, 10);

        //    instance.spatial.stickToObj3D(this.obj3d);
            ThreeAPI.tempVec4.x = 0;
            ThreeAPI.tempVec4.y = 0;
            ThreeAPI.tempVec4.z = 1;
            ThreeAPI.tempVec4.w = 1;
            instance.setAttributev4('sprite', ThreeAPI.tempVec4)
            ThreeAPI.getScene().remove(instance.spatial.obj3d)

        }

    //    client.dynamicMain.requestAssetInstance('asset_ocean_16', addSceneInstance)

    }

}

export {Ocean}