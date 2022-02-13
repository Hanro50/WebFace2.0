import { root } from "../utils/consts.js";
import { Express, Router } from "express";
import proxy from "express-http-proxy";
import exp from "express";
import { getLicence, getTemplate } from "../utils/template.js";
export const dataFile = root.getFile("sockets.json");
export let data: Map<string, dns> = new Map();
if (dataFile.exists()) dataFile.toJSON<dns[]>().forEach(element => data.set(element.domain, element));
dataFile.exists() ? new Map(dataFile.toJSON()) : new Map();
interface dns {
    domain: string,
    redirect: string,
    cloudflare?: boolean,
    open?: boolean,
    name?: string
}
function apiProxy(protocal: string, domain: string) {

    return proxy(protocal + "://" + domain + "/", {
        preserveHostHdr: true,
        // proxyReqPathResolver: req => new URL(req.originalUrl).pathname,
        reqBodyEncoding: null
    })
};
export class server {
    app: Express;
    router: Router;
    constructor(port: number) {
        this.app = exp();
        this.app.use((req, res, next) => {
            function fail() {
                let links = [];
                data.forEach((v, k) => {
                    if (v.name && v.open)
                        links.push(`<a href="${req.protocol}://${k}">${v.name}</a>`)
                });
                links.push(`<a href="/LICENCE">LICENCE</a>`);
                const d = req.path == "/LICENCE" ? getLicence() : getTemplate("Error 404", "Error 404: Cannot find resource", links.join(""));
                res.type("html").status(404).send(d).end();
            }
            if (!req || !req.headers) fail();
            function p(host: string) {
                var result = data.get(host)
                if (result != null) {
                    return apiProxy(req.protocol, result.redirect)(req, res, next);
                } else if (host.endsWith(String(":" + port))) {
                    return p(host.substring(0, host.length - (":" + port).length))
                }
                fail();
            }
            p(req.headers.host);
        })
        this.app.listen(port, () => {
            console.log(`Redirecting stuff from http://localhost:${port}`)
        })

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
}