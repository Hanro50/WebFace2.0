import http, { IncomingMessage, ServerResponse } from "http";
import { app, dataFile, mapObj } from "./main.js";
import * as net from 'net';
import { existsSync, readFileSync, writeFileSync } from "fs";
import { join } from "path";

export interface proxy {
    port: number;
    host: string;
    hide: boolean;
}

export const proxies = new Map<string, proxy>();

export function getProxiesObj() {
    const obj: mapObj<proxy> = {};
    proxies.forEach((v, k) => {
        obj[k] = v;
    });
    return obj;
}
export function save() {
    writeFileSync(join(dataFile, "proxies.json"), JSON.stringify(getProxiesObj()));
}

if (existsSync(join(dataFile, "proxies.json"))) {
    try {
        const obj: any = JSON.parse(readFileSync(join(dataFile, "proxies.json")).toString());
        Object.keys(obj).forEach(e => {
            proxies.set(e, obj[e]);
        })
    } catch { console.error("Could not read proxy file!") }
} else {
    save();
}
app.get("/api/proxies/", (req, res) => res.status(200).type("json").send(JSON.stringify(getProxiesObj())).end())
app.post("/api/proxies/:method/:proxy/", (req, res) => {
    console.log(req.body)
    if (req.params.method == "remove") {
        if (proxies.delete(req.params.proxy)) save();
        return res.status(200).end();
    }
    if (req.params.method == "toggle") {
        const proxy = proxies.get(req.params.proxy)
        if (proxy) { proxy.hide = !proxy.hide; save(); }
        return res.status(200).end();
    }
    if (req.params.method == "add") {
        proxies.delete(req.params.proxy)
        let b = req.body;
        b.host = req.params.proxy;
        proxies.set(req.params.proxy, b);
        save();
        console.log("Added proxy!")
        return res.status(200).type("json").send(JSON.stringify(b)).end();
    }
    return res.status(404).end();
})

const links = new Map<string, { dist: string, type: string }>();
links.set("/modules/404.js", { dist: "dist/html/404.js", type: "text/javascript" });
links.set("/modules/util.js", { dist: "dist/html/util.js", type: "text/javascript" });
links.set("/css/button.css", { dist: "html/css/button.css", type: "text/css" });
links.set("/license.txt", { dist: "license.txt", type: "text/plain" });

//Uses the native http client to make it faster.
function proxy(req: IncomingMessage, res: ServerResponse) {
    //The host property. Used by the reverse 
    const host = req.headers.host?.split(":")[0] || "";
    //Gets the port that the request should be redirected to
    const result = proxies.get(host || "");
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
        const server = net.connect({ port: result.port, host: "localhost" }, () => {
            //This links the server and client
            server.pipe(client);
            //We're simply passing along the header
            server.write(head)
        });
        //If the server or client time out, we need to then destroy the other. 
        server.on('end', () => client.end());
        client.on('end', () => server.end());

        server.on('error', () => client.end());
        client.on('error', () => server.end());
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

http.createServer(proxy).listen(5000);