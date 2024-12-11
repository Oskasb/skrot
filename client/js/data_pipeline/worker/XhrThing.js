

define([

],
	function(

		) {

        var fileServerUrl = "http://localhost:3000";

        var paths = [];
        var fileSystem;

        var setupFileReader = function() {
            function onLoad() {
                document.addEventListener("deviceready", onDeviceReady, false);
            }



            function gotFS(fileSystem) {
                fileSystem.root.getFile("readme.txt", null, gotFileEntry, fail);
            }

            function gotFileEntry(fileEntry) {
                fileEntry.file(gotFile, fail);
            }

            function gotFile(file){
                readDataUrl(file);
                readAsText(file);
            }

            function readDataUrl(file) {
                var reader = new FileReader();
                reader.onloadend = function(evt) {
                    console.log("Read as data URL");
                    console.log(evt.target.result);
                };
                reader.readAsDataURL(file);
            }

            function readAsText(file) {
                var reader = new FileReader();
                reader.onloadend = function(evt) {
                    console.log("Read as text");
                    console.log(evt.target.result);
                };
                reader.readAsText(file);
            }

            function fail(evt) {
                console.log(evt.target.error.code);
            }



            function getAllEntries(dirReader) {
                var entries = dirReader.readEntries();

                for (var i = 0, entry; entry = entries[i]; ++i) {
                    paths.push(entry.toURL()); // Stash this entry's filesystem: URL.

                    // If this is a directory, we have more traversing to do.
                    if (entry.isDirectory) {
                        getAllEntries(entry.createReader());
                    }
                }
            }

            // PhoneGap is ready
            //
        //    function onDeviceReady() {
            fileSystem = self.requestFileSystemSync(PERSISTENT, 0 ,  gotFS, fail);
            console.log("File Sys:", fileSystem);
            getAllEntries(fileSystem.root.createReader());

            var fileEntry = fileSystem.root.getFile('testFile.blob', {create: true});

            //    postMessage('Got file entry.');

            //    var arrayBuffer = makeRequest(request.url);
            var blob = new Blob([0], {type: 'arraybuffer'});
                            //        postMessage('Begin writing');
                fileEntry.createWriter().write(blob);

            console.log("Paths:", paths, blob);
        //    gotFS(fileSystem);

        //    }

        };

		var XhrThing = function() {

		};

		XhrThing.prototype.sendXHR = function(packet, successCallback, failCallback) {

			if (paths.indexOf(packet.url) !== -1) {
				console.log("File Reader is present!", LocalFileSystem);

                    var pkt = packet;
                    var reader = new FileReaderSync();
                    reader.onloadend = function(evt) {
                        console.log("read success");
                        console.log(evt.target.result);
                        successCallback(evt.target.result, pkt);
                    };
                    reader.onerror = function(err) {
                        failCallback(pkt.url, "File Reader Error", err);
                    };

                    if (pkt.responseType === 'arraybuffer') {
                        reader.readAsDataURL(pkt.url);
                    } else {
                        reader.readAsText(pkt.url);
                    }
                    return;

			}

			var body = "";

			var request = new XMLHttpRequest();
			request.packet = packet;

			var asynch = true;
			//    if (packet.contentType == 'application/x-www-form-urlencoded') asynch = false;

         //   console.log("xhr packet:", packet);
			request.open(packet.type, packet.url, asynch);

			if (packet.responseType === '') {
				request.responseType = 'json';
			} else if (packet.responseType) {
				request.responseType = packet.responseType;
			}

			if (packet.contentType == 'application/json') {
				//	body = JSON.stringify(packet.body);
				request.setRequestHeader("Content-Type", packet.contentType);
				//	request.setRequestHeader("ClientConnection", "close");
			}

			if (packet.contentType == 'application/x-www-form-urlencoded') {
				body = packet.params;
				request.setRequestHeader("Content-Type", packet.contentType);

				//    request.setRequestHeader("Content-length", packet.params.length);
				//
			}

			if (packet.auth) request.setRequestHeader('Authorization', packet.auth.header);

			request.onreadystatechange = function() {
				if (request.readyState === 4) {
				//    console.log('XHR Response: ', request);
				    successCallback(request.response, request.packet);
				}
			};

			request.onError = function() {
                console.log('XHR Fail: ', request);
				failCallback(packet.url, "XHR Fail!")
			};

			request.send(body);
		};



		XhrThing.prototype.saveJson = function(packet, json) {
            var xmlhttp = new XMLHttpRequest();   // new HttpRequest instance
            xmlhttp.open("POST", fileServerUrl+'/'+packet.fileUrl);
            xmlhttp.setRequestHeader("Content-Type", "text/json");
            xmlhttp.send(JSON.stringify([packet.fileUrl, packet.data]));

		};


		return XhrThing;

	});