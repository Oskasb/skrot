
function init() {

    const textures = getTexturesFromAtlasFile( 'textures/cube/sun_temple_stripe.jpg', 6 );
    const materials = [];

    for ( let i = 0; i < 6; i ++ ) {
        materials.push( new THREE.MeshBasicMaterial( { map: textures[ i ] } ) );
    }

    const skyBox = new THREE.Mesh( new THREE.BoxGeometry( 1, 1, 1 ), materials );
    skyBox.geometry.scale( 1, 1, - 1 );
    scene.add( skyBox );

    // window.addEventListener( 'resize', onWindowResize );

}

function buildCubeMap( image ) {

    console.log("Build Cube Map", image)


    let loader = new THREE.CubeTextureLoader()
    let cubeMap = loader.load( [
            image.url,
            image.url,
            image.url,
            image.url,
            image.url,
            image.url
        ] );

    console.log(cubeMap);
/*
    const textures = [];

    let tilesNum = 6;

    for ( let i = 0; i < tilesNum; i ++ ) {
        textures[ i ] = new THREE.Texture();
    }

            let canvas, context;
            const tileWidth = image.bitmap.height;

            for ( let i = 0; i < textures.length; i ++ ) {

                canvas = document.createElement( 'canvas' );
                context = canvas.getContext( '2d' );
                canvas.height = tileWidth;
                canvas.width = tileWidth;
                context.drawImage( image, tileWidth * i, 0, tileWidth, tileWidth, 0, 0, tileWidth, tileWidth );
                textures[ i ].colorSpace = THREE.SRGBColorSpace;
                textures[ i ].image = canvas;
                textures[ i ].needsUpdate = true;

            }
*/

    return cubeMap;

}

let blendCanvasCtxToTexture = function(ctx, texture) {

    // let addImage = ctx.getImageData(0, 0, ctx.canvas.width, ctx.canvas.height);
    let originalBitmap = texture.originalBitmap;

    texture.ctx.globalCompositeOperation = 'copy';
    texture.ctx.drawImage(ctx.canvas, 0, 0, originalBitmap.width , originalBitmap.height)
      texture.ctx.globalCompositeOperation = 'mix';
    texture.ctx.drawImage(originalBitmap, 0, 0, originalBitmap.width, originalBitmap.height)

    texture.needsUpdate = true;
}

class ThreeTexture {
    constructor(id, config, callback) {

        this.id = id;
        this.config = {};
        let _this = this;

        let imgLoaded = function(asset) {
   //         console.log("imgLoaded: ", asset)
            if (_this.config.settings.retain_canvas) {


                let canvas = document.createElement("canvas");
                let tx = _this.texture;

            //    console.log("Canvas asset: ", asset)
                    canvas.id = id+'_canvas';
                    canvas.width  = asset.bitmap.width;
                    canvas.height = asset.bitmap.height;
                    canvas.dataReady = true;

                _this.texture = ThreeAPI.newCanvasTexture(canvas);
                _this.texture.originalBitmap = asset.bitmap;
                _this.texture.canvas = canvas;
                _this.texture.ctx = canvas.getContext('2d')
                _this.texture.ctx.drawImage( asset.bitmap, 0, 0, canvas.width, canvas.height );
                _this.texture.flipY = false;
            //    _this.texture.ctx.save();
                _this.texture.combine = THREE.MixOperation;

                _this.texture.mapping = THREE.EquirectangularReflectionMapping;
                ThreeAPI.getScene().environemt = _this.texture;
                let applySkyGradient = function(ctx) {
                    blendCanvasCtxToTexture(ctx, _this.texture)
                }

                evt.on(ENUMS.Event.SKY_GRADIENT_UPDATE, applySkyGradient)
            //    _this.texture = new THREE.CanvasTexture( asset.bitmap);
            } else {
                _this.texture = new THREE.CanvasTexture( asset.bitmap);
            }

            _this.texture.isTexture = true;
            _this.applyTxSettings(_this.texture, _this.config.settings);
            _this.texture.sourceUrl = asset.url;
            _this.texture.generateMipmaps = false;
            _this.texture.needsUpdate = true;
            callback(this)
        }.bind(this);

        let txSettingsLoaded = function(asset, xx) {
//                    console.log("txSettingsLoaded", asset, xx, config);
            for (let key in asset.config) {
                this.config[key] = asset.config[key];
            }

            ThreeAPI.loadThreeAsset('FILES_IMAGES_', config.img, imgLoaded);
        }.bind(this);

        ThreeAPI.loadThreeAsset('TEXTURE_SETTINGS_', config.settings, txSettingsLoaded);

    };

    applyTxSettings = function(tx, settings) {

        tx.userData = {};

        if (settings.combine)           tx.combine                  = THREE[settings.combine];
        if (settings.magFilter)         tx.magFilter                = THREE[settings.magFilter];
        if (settings.minFilter)         tx.minFilter                = THREE[settings.minFilter];
        if (settings.wrapS)             tx.wrapS                    = THREE[settings.wrapS];
        if (settings.wrapT)             tx.wrapT                    = THREE[settings.wrapT];

        if (settings.mapping)           tx.mapping                  = THREE[settings.mapping];

        if (settings.generateMipmaps)   tx.generateMipmaps          = settings.generateMipmaps;
        if (typeof (settings.flipY) === 'boolean')        tx.flipY                    = settings.flipY;
        if (settings.data_rows)         tx.userData.data_rows       = settings.data_rows;
        if (settings.tiles_x)           tx.userData.tiles_x         = settings.tiles_x;
        if (settings.tiles_y)           tx.userData.tiles_y         = settings.tiles_y;
        if (settings.retain_canvas)     tx.userData.retain_canvas   = settings.retain_canvas;
        tx.needsUpdate = true;

    };

}

export { ThreeTexture }