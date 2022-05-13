import { existsSync, readFileSync, writeFileSync } from "fs";
import { IncomingMessage, ServerResponse } from "http";
import net from "net"
import https from "https"
import http from "http"
import cluster from "cluster";
import path, { join } from "path";
const reloadCom = "reloadProxyConfig";
import { dataFile, mapObj, proxy, proxyServerConfig } from "./constants.js";
//Converts a given set of Proxies into an object
export function getProxiesObj() {
    const obj: mapObj<proxy> = {};
    proxies.forEach((v, k) => {
        obj[k] = v;
    });
    return obj;
}

export let proxies = new Map<string, proxy>();



function reload() {
    if (!existsSync(join(dataFile, "proxies.json"))) return;
    proxies = new Map<string, proxy>();
    try {
        const obj: any = JSON.parse(readFileSync(join(dataFile, "proxies.json")).toString());
        Object.keys(obj).forEach(e => {
            proxies.set(e, obj[e]);
        })
    } catch (e){ console.error("Could not read proxy file!",e) }
}
//Backend config files
if (existsSync(join(dataFile, "proxies.json"))) {
    reload();
}

const links = new Map<string, { dist: string, type: string }>();
links.set("/modules/404.js", { dist: "dist/html/404.js", type: "text/javascript" });
links.set("/modules/util.js", { dist: "dist/html/util.js", type: "text/javascript" });
links.set("/css/index.css", { dist: "html/css/index.css", type: "text/css" });
links.set("/license.txt", { dist: "LICENSE", type: "text/plain" });
if (cluster.isWorker) {
    process.on("message", (msg) => {
        if (msg == reloadCom) reload();
        console.log(`Worker ${process.pid} reloaded proxy lists!`)
    })
    //Uses the native http client to make it faster.
    function proxy(req: IncomingMessage, res: ServerResponse) {
        //The host property. Used by the reverse 
        const host = req.headers.host?.split(":")[0] || "";
        //Gets the port that the request should be redirected to
        const result = proxies.get(host || "");
        console.log(result)

        if (result != null) {
            //Adding some of our own headers
            req.headers["wf-time"] = String(Date.now());
            req.headers["wf-proxied"] = "true"; //Used by clients to test for connection
            req.headers["wf-client-ip"] = req.socket.remoteAddress;

            //We need to build the header for the proxy by reconstructing the header we already have
            let head = `${req.method} ${req.url} HTTP/${req.httpVersion}`
            Object.keys(req.headers).forEach(e => {
                head += `\r\n${e}: ${req.headers[e]}`
            });
            //This is the header terminator. The server will not render till it is sent. 
            head += "\r\n\r\n"
            //We're going to be handling the raw http sockets here. 
            const client = req.socket;

            //next we need to create the internal connection. The host property can be the IP or the dns address of the webserver you want to proxy 
            const server = net.connect({ port: result.port, host: result.prxy || "localhost" }, () => {
                
                client.removeAllListeners();
                //This links the server and client
                server.pipe(client);
                server.on('data',e=>{
                    console.log(e.toString())
                })
                client.pipe(server);
                //We're simply passing along the header
                server.write(head)
            });
            console.log(req.headers)
            server.on('connect', () => {

            })
            function done() {
                //Needed to insure everything has been dereverenced to avoid memory leaks
                client.unpipe(server);
                server.unpipe(client);
                client.end().destroy().unref();
                server.end().destroy().unref();
            }
            //If the server or client time out, we need to then destroy the other. 
            server.on('end', done);
            client.on('end', done);

            server.on('error', () => done);
            client.on('error', () => done);
        } else if (req.url && links.has(req.url)) {
            const link = links.get(req.url) || { dist: "", type: "error" };
            const d = existsSync(link.dist) ? readFileSync(link.dist) : "";
            res.writeHead(200, { 'Content-Length': Buffer.byteLength(d), "content-type": link.type }).end(d);
        } else if (req.url == "/api/pages") {
            const pages: proxy[] = [];
            proxies.forEach(e => {
                if (!e.hide) pages.push(e);
            })
            const d = JSON.stringify(pages);
            res.writeHead(200, { 'Content-Length': Buffer.byteLength(d), "content-type": "application/json" }).end(d);
        }
        else {
            const d = readFileSync("proxy-404.html");
            res.writeHead(404, { 'Content-Length': Buffer.byteLength(d), "content-type": "text/html" }).end(d);
        }
    }

    let PSC: proxyServerConfig = { http: { port: 5000 } };
    const PSCpath = join(dataFile, "PSC.json")
    if (existsSync(PSCpath))
        PSC = JSON.parse(readFileSync(join(dataFile, "PSC.json")).toString());
    else writeFileSync(PSCpath, JSON.stringify(PSC).toString());
    if (PSC.http)
        http.createServer(proxy).listen(PSC.http.port);
    if (PSC.https) {
        if (!PSC.https.csr) { console.error("Missing csr parameter") } if (!PSC.https.key) { console.error("Missing key parameter") }
        console.log(path.resolve(PSC.https.key))


        const key = readFileSync(path.resolve(PSC.https.key).toString());
        console.log(path.resolve(PSC.https.csr))

        const cert = readFileSync(path.resolve(PSC.https.csr));
        let ca: string[] = [];
        PSC.https.ca?.forEach(e => {
            ca.push(readFileSync(e).toString());
        })
        https.createServer({ key, cert, ca }, proxy).listen(PSC.https.port)
    }
}
else {
    //Saves the proxies given to file
    function saveProxies() {
       
        writeFileSync(join(dataFile, "proxies.json"), JSON.stringify(getProxiesObj()));
        const ws = cluster.workers
        if (ws) {
            console.log("Reloading workers....")
            Object.keys(ws).forEach(e => ws[e]?.send(reloadCom))
        }
    }
    //Proxy backend
    const app = (await import("./main.js")).app
    app.get("/api/proxies/", (req, res) => res.status(200).type("json").send(JSON.stringify(getProxiesObj())).end())
    app.post("/api/proxies/:method/:proxy/", (req, res) => {
        if (req.params.method == "remove") {
            if (proxies.delete(req.params.proxy)) saveProxies();
            return res.status(200).end();
        }
        if (req.params.method == "toggle") {
            const proxy = proxies.get(req.params.proxy)
            if (proxy) { proxy.hide = !proxy.hide; saveProxies(); }
            return res.status(200).end();
        }
        if (req.params.method == "add") {
            proxies.delete(req.params.proxy)
            let b = req.body;
            b.host = req.params.proxy;
            proxies.set(req.params.proxy, b);
            saveProxies();
            console.log("Added proxy!")
            return res.status(200).type("json").send(JSON.stringify(b)).end();
        }
        return res.status(404).end();
    })
}