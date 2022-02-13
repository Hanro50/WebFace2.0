import { config, root } from "../utils/consts.js";
import { Router } from "express";
import { getLicence, getTemplate } from "../utils/template.js";
export const dataFile = root.getFile("sockets.json");
export let data: Map<string, dns> = new Map();
if (dataFile.exists()) dataFile.toJSON<dns[]>().forEach(element => data.set(element.domain, element));
dataFile.exists() ? new Map(dataFile.toJSON()) : new Map();

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
    app: http.Server;
    router: Router;
    port: number;
    protocol: string;
    clientProtocal: string;
    constructor() {
        this.port = config.proxy.port;
        this.clientProtocal = config.proxy.clientProtocal || "http://";
        const self = this;

        //Needs to be wrapped as the 'this' keyword is overwritten by the http server
        const p = ((req: http.IncomingMessage, res: http.ServerResponse) => this.proxy(req, res, self))
        if (config.https) { this.protocol = "https"; this.app = https.createServer(config.https, p).listen(this.port); }
        else { this.protocol = "http"; this.app = http.createServer(p).listen(this.port); }

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
    proxy(client_req: IncomingMessage, client_res: ServerResponse, self: server) {
        async function p(host: string): Promise<void> {
            const result = data.get(host);
            if (result != null) {
                const url = new URL((result.redirect.includes("://") ? "" : self.clientProtocal) + result.redirect);
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

            } else if (host.endsWith(String(":" + self.port))) {
                return p(host.substring(0, host.length - (":" + self.port).length))
            } else if (client_req.url == "/LICENCE") {
                const d = getLicence();
                client_res.writeHead(200, { 'Content-Length': Buffer.byteLength(d), "content-type": "text/html" }).end(d);
            } else {
                let links = "";
                data.forEach((v, k) => { if (v.name && v.open) links += `<a href="${self.protocol}://${k}">${v.name}</a>` });
                links += `<a href="/LICENCE">LICENCE</a>`;
                const d = getTemplate("Error 404", "Error 404: Cannot find resource", links);
                client_res.writeHead(404, { 'Content-Length': Buffer.byteLength(d), "content-type": "text/html" }).end(d);
            }
        }
        p(client_req.headers.host);
    }
}