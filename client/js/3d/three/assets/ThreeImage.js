class ThreeImage {
    constructor(id, config, callback) {

        this.loader = new THREE.ImageBitmapLoader();

        this.id = id;
        this.url = config.url;
        this.bitmap;
        let _this = this;

        let setBitmap = function(bmp) {
            _this.bitmap = bmp;
        //    console.log('set bitmap', bmp)
            callback(_this)
        }

        let bitmapLoaded = function(bmp) {
        //    console.log('bitmap loaded', bmp)
            setBitmap(bmp);
        };

        this.loader.load( config.url, function ( imageBitmap ) {
            bitmapLoaded(imageBitmap);
        });

    };

}

export { ThreeImage }