"use strict";

define([
		'data_pipeline/GameDataPipeline',
		'data_pipeline/data/ConfigCache'
	],
	function(
		GameDataPipeline,
		ConfigCache
		) {

		var CanvasGuiImages = function() {
			this.urls = {};
			this.data = {};
			this.svg = {};
			this.bin = {};
		};

		CanvasGuiImages.prototype.getImageData = function(id) {
			return this.data[id];
		};


		CanvasGuiImages.prototype.downloadSvgImageRef = function(id, ref) {
			var dataUpdated = function(url, svgData) {
				this.data[id].svg = svgData;
				this.data[id].image = new Image();

				this.data[id].loaded = false;
				this.data[id].image.onload = function() {
					this.data[id].loaded = true;
					ConfigCache.imageDataLoaded(id);
				}.bind(this);
				this.data[id].image.src = url;
			}.bind(this);

			var fail = function(err) {
				console.error("Image download error", err)
			};

			GameDataPipeline.loadSvgFromUrl(ref, dataUpdated, fail, true)

		};

		CanvasGuiImages.prototype.downloadBinaryImageRef = function(id, ref) {

			this.data[id].image = new Image();
			var dataUpdated = function(url, arraybuffer) {
				this.data[id].bin = arraybuffer;


				this.data[id].loaded = false;
				this.data[id].image.onload = function() {
					this.data[id].loaded = true;
					ConfigCache.imageDataLoaded(id);
				}.bind(this);
				this.data[id].image.src = url;
			}.bind(this);

			var fail = function(err) {
				console.error("Image download error", err)
			};

			GameDataPipeline.loadImageFromUrl(ref, dataUpdated, fail, true)

		};



		CanvasGuiImages.prototype.registerBinaryImageRefs = function(refs) {
			for (var index in refs) {
				if (!this.data[index]) {
					ConfigCache.storeImageRef(index, {id:index, url:refs[index]});
					this.data[index] = ConfigCache.getImageRef(index);
					this.downloadBinaryImageRef(index, window.resourcePath + refs[index]);

				}
			}
		};

		CanvasGuiImages.prototype.registerSvgImageRefs = function(refs) {
			for (var index in refs) {
				if (!this.data[index]) {
					ConfigCache.storeImageRef(index, {id:index, url:refs[index]});
					this.data[index] = ConfigCache.getImageRef(index);
					this.downloadSvgImageRef(index, refs[index]);

				}
			}
		};

		return CanvasGuiImages

	});