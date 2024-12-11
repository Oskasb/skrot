
import {WebSocketServer} from "ws";
import {createServer} from 'node:http';
import {readFile} from 'node:fs';
import {writeFile} from 'node:fs';
import {existsSync} from 'node:fs';
import {mkdirSync} from 'node:fs';
import {readdirSync} from 'node:fs';
import {lstatSync} from 'node:fs';
import {readdir} from 'node:fs';
import {lstat} from 'node:fs';
import {watchFile} from 'node:fs';
import {extname} from 'node:path';
import {resolve} from 'node:path';
const ws = WebSocketServer.Server;
let localPort = 5006;
const port = process.env.PORT || localPort;
import {ServerMain} from "./Server/ServerMain.js";
let serverMain = new ServerMain();
let publishedServer = true;
let server = createServer(

    function (request, response) {

        let filePath = '.' + request.url;
        if (filePath.length === 2 || filePath[2] === '?') {
            console.log("Host:", request.headers.host)
            let host = request.headers.host;
            let src = host.split(':')[0];
            if (src === '127.0.0.1' || src === 'localhost') {
                publishedServer = false;
                console.log("Server running Locally")
            } else {
                console.log("Server running Remotely")
            }

            filePath = './index.html';
        }



        let ext = extname(filePath);
        let contentType = 'text/html';
        let cacheControl = 'max-age=3, must-revalidate'
        if (publishedServer === true) {
            cacheControl = 'max-age=3600, public'  // 'no-cache'
        } else {
            cacheControl = 'max-age=3, must-revalidate'
            cacheControl = 'no-cache';
        }
        switch (ext) {
            case 'glb':
                if (publishedServer) {
                    cacheControl = 'max-age=36000, public'
                } else {
                    cacheControl = 'max-age=1, public'
                }
                break;
            case '.js':
                contentType = 'text/javascript';
                break;
            case '.css':
                contentType = 'text/css';
                break;
            case '.json':
                contentType = 'application/json';
                break;
            case '.wasm':
                contentType = 'application/wasm';
                cacheControl = 'max-age=36000, public'
                break;
            case '.png':
                contentType = 'image/png';
                if (publishedServer) {
                    cacheControl = 'max-age=36000, public'
                }
                break;
            case '.jpg':
                contentType = 'image/jpg';
                break;
            case '.wav':
                contentType = 'audio/wav';
                break;
        }

        readFile(filePath, function(error, content) {
            if (error) {
                console.log("Read File error ", filePath, error, content)
                if(error.code === 'ENOENT'){
                    readFile('./404.html', function(error, content) {
                        response.writeHead(200, { 'Content-Type': contentType });
                        response.end(content, 'utf-8');
                    });
                } else {
                    response.writeHead(500);
                    response.end('Sorry, check with the site admin for error: '+error.code+' ..\n');
                    response.end();
                }
            } else {

                response.setHeader('Access-Control-Allow-Origin', '*');
                response.setHeader('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content, Accept, Content-Type, Authorization');
                response.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, PATCH, OPTIONS');
                response.setHeader('Cross-origin-Embedder-Policy', 'require-corp');
                response.setHeader('Cross-origin-Opener-Policy','same-origin');
                response.setHeader('Access-Control-Max-Age', 60*60*24*30);
                response.setHeader('Content-Type', contentType);

                response.setHeader('Cache-control', cacheControl)
                // response.writeHead(200, {                'Content-Type': contentType             });
                response.end(content, 'utf-8');
                //   console.log('response - Content-Type:'+contentType);
            }
        });
    }

).listen(port);

server.writeFile = writeFile;
server.readFile = readFile;
server.existsSync = existsSync;
server.mkdirSync = mkdirSync;
server.readdirSync = readdirSync;
server.lstatSync = lstatSync;
server.resolvePath = resolve;
server.lstat = lstat;
server.watchFile = watchFile;
server.readdir = readdir;

let wss = new WebSocketServer({server: server});

serverMain.indexContentData(server);

serverMain.initServerConnection(wss, server);

console.log('Server running at port: '+port);

