import { config, root } from "../utils/consts.js";
import { Router } from "express";
import { getLicence, getTemplate } from "../utils/template.js";
export const dataFile = root.getFile("sockets.json");
export let data: Map<string, dns> = new Map();
if (dataFile.exists()) dataFile.toJSON<dns[]>().forEach(element => data.set(element.domain, element));
dataFile.exists() ? new Map(dataFile.toJSON()) : new Map();
import HttpProxy from 'http-proxy';

const ports: Map<String, HttpProxy> = new Map();
import http, { IncomingMessage, ServerResponse } from "http";
import https from "https";
interface dns {
    domain: string,
    redirect: string,
    cloudflare?: boolean,
    open?: boolean,
    name?: string
}
export class server {
    router: Router;//
    wrap(server: http.Server, port: Number, protocol: string) {
        server.on("upgrade", function (req, socket, head) {
            let proxy = ports.get(req.headers.origin);
            const host = req.headers.host;
            let result = data.get(req.headers.host);

            if (result == null && host.endsWith(String(":" + port))) result = data.get(host.substring(0, host.length - (":" + port).length));
            if (result == null) return socket.end()
            if (proxy == null) {
                console.log("proxying upgrade request", req.url);
                proxy = HttpProxy.createProxyServer({ target: (result.redirect.includes("://") ? "" : protocol + "://") + result.redirect, ws: true })
                ports.set(req.headers.origin, proxy);
            }
            proxy.ws(req, socket, head);
        });
    }

    proxyFunc(port: number, protocal: string) {
        return ((req: http.IncomingMessage, res: http.ServerResponse) => this.proxy(req, res, port, protocal))
    }
    constructor() {
        if (config.https) {
            console.log("HTTPS server redirects active on port " + config.https.port)
            const app = https.createServer(config.https, this.proxyFunc(config.https.port, config.https.passThrough ? "https" : "http")).listen(config.https.port);
            this.wrap(app, config.https.port, config.https.passThrough ? "https" : "http");
        }
        if (config.http) {
            console.log("HTTP server redirects active on port " + config.http.port)
            const app = http.createServer(this.proxyFunc(config.http.port, "http")).listen(config.http.port);
            this.wrap(app, config.http.port, "http");
        }

        //The maintenance endpoints
        this.router = Router();
        this.router.get("/list", (req, res) => {
            res.type("json").send(JSON.stringify(Array.from(data.values()))).end();
        })
        this.router.post("/add", (req, res) => {
            if (typeof req.body.domain == "string" && typeof req.body.redirect == "string") {
                this.redirect(req.body.domain, req.body.redirect);
                return res.status(200).end();
            }
            return res.status(400).send("Misformed body").end();
        });
        this.router.get("/info", (req, res) => {
            if (req.query && typeof req.query.domain == "string") {
                const ret = data.get(req.query.domain);
                if (ret) return res.type("json").send(JSON.stringify(ret)).end();
            }
            return res.status(404).send("Content not found").end();
        });
        this.router.post("/remove", (req, res) => {
            if (typeof req.body.domain == "string") {
                if (this.remove(req.body.domain)) return res.status(200).end();
                else return res.status(404).send("Failed to find element to remove").end();
            }
            return res.status(400).send("Misformed body").end();
        })
        this.router.post("/name", (req, res) => {
            if (typeof req.body.domain == "string" && typeof req.body.name == "string") {
                const redirect = data.get(req.body.domain);
                if (!redirect) return res.status(404).send("Failed to find element to rename").end();
                redirect.name = req.body.name;
                this.save();
                return res.status(200).end();
            }
            return res.status(400).send("Misformed body").end();
        })
        this.router.post("/toggle", (req, res) => {
            if (typeof req.body.domain == "string") {
                const redirect = data.get(req.body.domain);
                if (!redirect) return res.status(404).send("Failed to find element to toggle").end();
                redirect.open = !redirect.open;
                this.save();
                return res.status(200).end();
            }
            return res.status(400).send("Misformed body").end();
        })
    }
    save() {
        dataFile.write(Array.from(data.values()));
    }
    redirect(domain: string, redirect: string): dns {
        const dnz = { domain, redirect };
        data.set(dnz.domain, dnz);
        this.save();
        return dnz;
    }
    remove(dns: dns): boolean
    remove(domain: string): boolean
    remove(id: string | dns): boolean {
        if (typeof id != "string") id = id.domain;
        const r = data.delete(id);
        this.save();
        return r;
    }
    //Uses the native http client to make it faster.
    proxy(client_req: IncomingMessage, client_res: ServerResponse, port: number, protocol: string) {
        async function p(host: string): Promise<void> {
            const result = data.get(host);
            if (result != null) {
                const url = new URL((result.redirect.includes("://") ? "" : protocol + "://") + result.redirect);
                var options: http.RequestOptions = {
                    hostname: url.hostname,
                    port: url.port,
                    path: client_req.url,
                    method: client_req.method,
                    headers: client_req.headers
                };
                var Fproxy = http.request(options, function (res) {
                    client_res.writeHead(res.statusCode, res.headers)
                    res.pipe(client_res, {
                        end: true
                    });
                });
                client_req.pipe(Fproxy, {
                    end: true
                });
            } else if (host.endsWith(String(":" + port))) {
                return p(host.substring(0, host.length - (":" + port).length))
            } else if (client_req.url == "/LICENCE") {
                const d = getLicence();
                client_res.writeHead(200, { 'Content-Length': Buffer.byteLength(d), "content-type": "text/html" }).end(d);
            } else {
                let links = "";
                data.forEach((v, k) => { if (v.name && v.open) links += `<a href="${protocol}://${k}">${v.name}</a>` });
                links += `<a href="/LICENCE">LICENCE</a>`;
                const d = getTemplate("Error 404", "Error 404: Cannot find resource", links);
                client_res.writeHead(404, { 'Content-Length': Buffer.byteLength(d), "content-type": "text/html" }).end(d);
            }
        }
        p(client_req.headers.host);
    }
}