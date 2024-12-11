var baseUrl = './../../../../';

var MainWorker;

importScripts(baseUrl+'client/libs/require.js');

require.config({
	baseUrl: baseUrl,
	paths: {
		data_pipeline:'client/js/data_pipeline'
	}
});


require(
	['data_pipeline/worker/WorkerDataLoader'],
	function(WorkerDataLoader) {

		var WorkerMain = function() {
			this.workerDataLoader = new WorkerDataLoader();
		};

		WorkerMain.prototype.storeJsonData = function(url, json) {
			this.workerDataLoader.storeJson(url, json)
		};
		
		WorkerMain.prototype.setupJsonRequest = function(url) {
			this.workerDataLoader.fetchJsonData(url)
		};

		WorkerMain.prototype.setupSvgRequest = function(url) {
			this.workerDataLoader.fetchSvgData(url);
		};

		WorkerMain.prototype.setupBinaryRequest = function(url) {
			this.workerDataLoader.fetchBinaryData(url);
		};

		MainWorker = new WorkerMain();
		postMessage(['ready']);
	//	console.log("Worker Require Loaded OK!")
	}
);

let handleMessage = function(oEvent) {

	if (!MainWorker) {
		console.log("MainWorker not yet ready: ", oEvent);
		setTimeout(function() {
			handleMessage(oEvent);
		}, 250);
		return;
	}

	if (oEvent.data[0] == 'storeJson') {
		MainWorker.storeJsonData(oEvent.data[1], oEvent.data[2]);
	}
	
	if (oEvent.data[0] == 'json') {
		MainWorker.setupJsonRequest(oEvent.data[1]);
	}

	if (oEvent.data[0] == 'svg') {
		MainWorker.setupSvgRequest(oEvent.data[1]);
	}

	if (oEvent.data[0] == 'bin') {
		MainWorker.setupBinaryRequest(oEvent.data[1]);
	}
};

onmessage = function (oEvent) {
	handleMessage(oEvent);
};