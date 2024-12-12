import {PipelineObject} from '../../application/load/PipelineObject.js';
import {pipelineAPI} from "../../application/utils/DataUtils.js";
import {Texture} from "../../../../libs/three/Three.Core.js";


class ThreeTextureMaker {

        constructor() {
            this.textureImages = {};
            this.images = {};
            this.textures = {};

            this.textureFiles;

            let meta = {
                textures:{},
                images:{}
            };

            let getUrlById = function(id) {

                for (var i = 0; i < textureFiles.length; i++) {
                    if (textureFiles[i].id === id) {
                        return textureFiles[i].url
                    }
                }
                console.log("No texture file by id:", id, textureFiles);
                return false;
            };

            let getIdByUrl = function(url) {

                for (var i = 0; i < textureFiles.length; i++) {
                    if (textureFiles[i].url === url) {
                        return textureFiles[i].id
                    }
                }
                console.log("No texture file by id:", id, textureFiles);
                return false;
            };

            let contentUrl = function(url) {
                return 'content'+url.slice(1);
            };

            let saveJsonUrl = function(json, url) {
                let shiftUrl = url.slice(1);
                pipelineAPI.saveJsonFileOnServer(json, shiftUrl)
            };


            let createBufferTexture = function(url, txType) {

                textures[txType][url] = true;

                var registerTexture = function(tx) {

                    if (typeof(textures[txType][url]) === 'Texture') {

                        textures[txType][url].image = tx.image;
                        textures[txType][url].needsUpdate = true;

                    } else {
                        if (txType === 'envMap' || txType === 'data_texture' || txType === 'particle_texture') {
                            tx.combine = THREE.AddOperation;
                            tx.generateMipmaps = false;
                            tx.magFilter = THREE.LinearFilter;
                            tx.minFilter = THREE.LinearFilter;

                            if (txType === 'envMap') {
                                tx.mapping = THREE.SphericalReflectionMapping;
                                console.log("Load Env Map; ", tx)
                            }

                            if (txType === 'particle_texture') {
                                tx.wrapS = THREE.RepeatWrapping;
                                tx.wrapT = THREE.RepeatWrapping;

                            }

                        } else {
                            tx.wrapS = THREE.RepeatWrapping;
                            tx.wrapT = THREE.RepeatWrapping;
                        }

                        tx.sourceUrl = url;
                        textures[txType][url] = tx;

                        //    PipelineAPI.setCategoryKeyValue('THREE_TEXTURE', txType+'_'+url, tx);

                        pipelineAPI.setCategoryKeyValue('THREE_TEXTURE', getIdByUrl(url), tx);
                    }

                };

                let jsonImageLoaded = function(src, data) {
                    pipelineAPI.cancelFileUrlPoll(src);
                    new THREE.TextureLoader().load(data.url, registerTexture);
                };

                let originalImageUpdated = function(src, data) {

                    //    console.log("Buffer Data Updated:  ", url, txType, src, [data]);
                    let onLoad = function(tx) {
                        if (pipelineAPI.getPipelineOptions('imagePipe').polling.enabled_) {
                            let imgId = tx.toJSON(meta).image;
                            delete meta.images[imgId].uuid;
                            let json = JSON.stringify(meta.images[imgId]);
                            //      var json = meta.images[imgId].url;
                            console.log("JSON Image:", imgId, [json]);
                            saveJsonUrl(json, url);
                            new PipelineObject('JSON_IMAGE', url, jsonImageLoaded)
                            pipelineAPI.pollFileUrl(src);
                        } else {

                        }
                        registerTexture(tx);
                    };

                    new THREE.TextureLoader().load(url, onLoad);
                };

                originalImageUpdated(url)

                // new PipelineObject('BUFFER_IMAGE', url, originalImageUpdated);
                return;

                if (pipelineAPI.getPipelineOptions('imagePipe').polling.enabled) {
                    new PipelineObject('BUFFER_IMAGE', url, originalImageUpdated)
                } else {
                    new PipelineObject('JSON_IMAGE', url, jsonImageLoaded)
                }

            };

        }


        loadTextures = function() {

            let textureImages = this.textureImages;
            let images = this.images;

            let createTexture = function(textureStore) {

                if (!textures[textureStore.txType]) {
                    textures[textureStore.txType] = {};
                } else {

                    if (textures[textureStore.txType][textureStore.url]) {
                        //        console.log("Tx url already loaded...", [textureStore.txType], [textureStore.url]);
                        return;
                    }

                    if (textures[textureStore.txType].src === textureStore.url) {
                        //        console.log("Texture already loaded", textureStore, textureStore.url, textures);
                        return;
                    }
                }

                createBufferTexture(textureStore.url, textureStore.txType);
            };

            let loadImage = function(textureStore) {

                let jsonImage = function(src, json) {
                    pipelineAPI.setCategoryKeyValue('JSON_IMAGE', textureStore.url, json);
                };

                let ok = function(src, data) {
                    images[textureStore.url] = data;
                    //        console.log("TextureCached", src, textureStore);
                    textureStore.bufferData = data;
                    pipelineAPI.setCategoryKeyValue('BUFFER_IMAGE', textureStore.url, data);
                    //    PipelineAPI.subscribeToConfigUrl(contentUrl(textureStore.url), jsonImage, fail);
                };

                let fail = function(src, data) {
                    console.log("Texture Failed", src, data);
                };

                if (!images[textureStore.url]) {
                    images[textureStore.url] = {};

                    pipelineAPI.cacheImageFromUrl(textureStore.url, ok, fail)

                    /*
                    if (PipelineAPI.getPipelineOptions('imagePipe').polling.enabled) {
                //        console.log("PipelineState:",PipelineAPI.readCachedConfigKey('STATUS', 'PIPELINE'))
                        PipelineAPI.cacheImageFromUrl(textureStore.url, ok, fail)
                    } else {
                        console.log("Load TX Production Mode")
                        PipelineAPI.subscribeToConfigUrl(contentUrl(textureStore.url), jsonImage, fail);
                    }
                    */
                }

            //    createTexture(textureStore);
            };


            let textureListLoaded = function(scr, data) {
                for (let i = 0; i < data.length; i++){

                    for (let j = 0; j < data[i].textures.length; j++) {
                        for (let key in data[i].textures[j]) {
                            let url = getUrlById(data[i].textures[j][key]);
                            let textureStore = {txType:key, url:url, bufferData:null};
                            textureImages[url] = textureStore;
                            loadImage(textureStore);
                        }
                    }
                }
                //    console.log("Texture List", textureImages);
            };

            let loadParticleTexture = function(src, data) {

                for (let i = 0; i < data.length; i++){
                    let url = getUrlById(data[i].particle_texture);
                    let textureStore = {txType:'particle_texture', url:url, bufferData:null};
                    textureImages[url] = textureStore;
                    loadImage(textureStore);
                }
            };


            let loadTextures = function() {
            //    new PipelineObject("MATERIALS", "THREE", textureListLoaded);
            //    new PipelineObject("PARTICLE_MATERIALS", "THREE", loadParticleTexture);
            };


            let init = 0;
            let registerTextureFiles = function(src, data) {
                textureFiles = data;
                if (!init) {
                    loadTextures();
                    init = 1
                }
            };

        //    new PipelineObject("TEXTURES", "FILES", registerTextureFiles);

        };



        createImageTexture = function(srcUrl) {
            return new Texture(srcUrl);
        };

        createCanvasTexture = function(canvas) {
            return new Texture(canvas);
        };

    }

export { ThreeTextureMaker }