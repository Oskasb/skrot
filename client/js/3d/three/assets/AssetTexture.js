class AssetTexture {
    constructor() {

        let ready = false;


        function initTx() {


        }

        function subscribe(cb) {

        }

        this.call = {
            initTx:initTx,
            subscribe:subscribe
        }

    }

    initAssetTexture(textureFileName) {
        this.call.initTx(textureFileName);
    }

    subscribeToTexture(cb) {
        this.call.subscribe(cb);
    }

}



export {AssetTexture};