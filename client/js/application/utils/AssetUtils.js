import {getConfigs, pipeMsgLoadInitCB} from "./DataUtils.js";


function loadAsset(fileName, fileType, callback) {
    pipeMsgLoadInitCB('load '+fileType, fileName+'.'+fileType);

    let configs = getConfigs();
    let files = configs['files'];
    let assetCfgs = files[fileType];
    let assetCfg = assetCfgs[fileName];
    let url = assetCfg.url;
    console.log("load url:", url);

}

export {
    loadAsset
}