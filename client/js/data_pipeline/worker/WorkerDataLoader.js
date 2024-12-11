"use strict";

define([
		'data_pipeline/worker/DataComparator',
		'data_pipeline/worker/XhrThing'
	],
	function(
		DataComparator,
		XhrThing
	) {


		var WorkerDataLoader = function() {
			this.dataComparator = new DataComparator();
			this.xhrThing = new XhrThing();
		};


		var errorUrls = {};


		var jsonUrl = '/';

		WorkerDataLoader.prototype.fetchJson = function(url, dc) {
			var packet = {
				responseType:'text',
				type:"GET",
				url:baseUrl+url
			};

			var responseFail = function(url, err) {
				if (errorUrls[url]) {
					if (errorUrls[url] === err) {
						postMessage(['error_unchanged', 'Unchanged Error:', err])
					} else {
						postMessage(['error_changed', 'Error Changed:', errorUrls[url]])
					}
				}
				errorUrls[url] = err;
				postMessage(['fail', url, err])
			};

		//	console.log('Worker fetch json', url)

			var _this = this;
			var checkJson = function(str) {

				let json;

				try {
					json = JSON.parse(str);
				}

				catch(err) {
					console.log("Bad JSON", url, err)
					return;
				}

				dc.compareAndCacheJson(url, json, _this);
			};

			this.xhrThing.sendXHR(packet, checkJson, responseFail);
		};

		WorkerDataLoader.prototype.storeJson = function(url, json) {
			var packet = {
				crossDomain:true,
				type:"POST",
				dataType: "json",
				data:json,
				url:baseUrl,
				fileUrl:url
			};

			var onFail = function(msg) {
				console.log("FAIL Worker JSON save", msg)
			};

			var onOk = function(msg) {
				console.log("Worker JSON save ok", msg)
			};

			this.xhrThing.saveJson(packet, onOk, onFail);
		};


		WorkerDataLoader.prototype.fetchSvg = function(url, dc) {
			var packet = {
				responseType:'application/text',
				type:"GET",
				url:baseUrl+url
			};

			var checkSvg = function(str) {
				dc.compareAndCacheSvg(url, str);
			};

			this.xhrThing.sendXHR(packet, checkSvg);
		};

		WorkerDataLoader.prototype.fetchBinary = function(url, dc) {
			var packet = {
				responseType:'arraybuffer',
				type:"GET",
				url:baseUrl+url
			};

			var checkBinary = function(res) {
				var byteArray = new Uint8Array(res);
				dc.compareAndCacheBinary(url, byteArray);
			};

			this.xhrThing.sendXHR(packet, checkBinary);
		};

		WorkerDataLoader.prototype.fetchJsonData = function(url) {
			this.fetchJson(url, this.dataComparator)
		};



		WorkerDataLoader.prototype.fetchBinaryData = function(url) {

			this.fetchBinary(url, this.dataComparator);
		};


		WorkerDataLoader.prototype.fetchSvgData = function(url) {

			this.fetchSvg(url, this.dataComparator);
		};




		return WorkerDataLoader;

	});