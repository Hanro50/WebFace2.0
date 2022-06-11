import { createReadStream, existsSync, readFileSync, statSync, writeFileSync } from "fs";
import { IncomingMessage, ServerResponse } from "http";
import net from "net"
import https from "https"
import http from "http"
import cluster from "cluster";
import path, { join } from "path";
const reloadCom = "reloadProxyConfig";
import { dataFile, mapObj, proxy, proxyServerConfig } from "./constants.js";
import internal from "stream";
import { TLSSocket } from "tls";

const nfport = 18000;


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
    } catch (e) { console.error("Could not read proxy file!", e) }
}
//Backend config files
if (existsSync(join(dataFile, "proxies.json"))) {
    reload();
}


if (cluster.isWorker) {
    process.on("message", (msg) => {
        if (msg == reloadCom) reload();
        console.log(`Worker ${process.pid} reloaded proxy lists!`)
    })

    function connection(client: internal.Duplex | TLSSocket) {

        // console.log('Client Connected To Proxy');
        //@ts-ignore
        //console.log(client.encrypted)
        client.once('data', (raw) => {


            const data = raw.toString() as string;
            if (!data.split("\n")[0].includes('HTTP')) {
                console.log('Data of rejected header->', data)
                return client.end();
            }

            const hostname = data
                .split('Host: ')[1]?.split('\r\n')[0].split(":")[0];
            console.warn(hostname + " requested")
            const result = proxies.get(hostname || "");
            let port = result != null ? result.port : nfport;
            let host = result != null ? result.prxy : "localhost";

            //   Upgrade: websocket
            let server = net.createConnection({ host, port }, () => {
                function end() {
                    server.end();
                    client.end();
                    //Freeing the internal resources. Since node's Garbage collector isn't always fast enough for this
                    server.destroy();
                    client.destroy();
                }
                if (client.destroyed) { console.error("Client already dead!"); end() };
                // console.log('PROXY TO SERVER SET UP');

                client.on('end', () => end());
                server.on('end', () => end());

                client.on('error', (err) => {
                    console.log('CLIENT TO PROXY ERROR');
                    console.log(err);
                    end();

                });
                server.on('error', (err) => {
                    console.log('PROXY TO SERVER ERROR');
                    console.log(err);
                    end();
                });
                server.write(data);
                // Piping the sockets
                server.pipe(client);
                client.pipe(server);

            });
            //client.on('error', err => {
            //     console.log('CLIENT TO PROXY ERROR');
            //     console.log(err);
            // });
        });
    }

    let PSC: proxyServerConfig = { http: { port: 5000 } };
    const PSCpath = join(dataFile, "PSC.json")
    if (existsSync(PSCpath))
        PSC = JSON.parse(readFileSync(join(dataFile, "PSC.json")).toString());
    else writeFileSync(PSCpath, JSON.stringify(PSC).toString());
    if (PSC.http) {
        let serv = http.createServer().listen(PSC.http.port);
        serv.on('connection', connection)
    }
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
        let serv = https.createServer({ key, cert, ca }).listen(PSC.https.port);
        serv.on('Connection', (raw) => {
            const data = raw.toString() as string;
            const hostname = data
                .split('Host: ')[1].split('\r\n')[0].split(":")[0];
            const result = proxies.get(hostname || "");
            let port = result != null ? result.port : nfport;
            let host = result != null ? result.host : "localhost";
            //  if (data.indexOf("Upgrade: websocket") && client instanceof TLSSocket) {
            console.log(data)

            //    console.log("true")
        })
        serv.on('secureConnection', connection)

    }
}
else {
    const links = new Map<string, { dist: string, type: string }>();
    links.set("/modules/404.js", { dist: "dist/html/404.js", type: "text/javascript" });
    links.set("/modules/util.js", { dist: "dist/html/util.js", type: "text/javascript" });
    links.set("/css/index.css", { dist: "html/css/index.css", type: "text/css" });
    links.set("/license.txt", { dist: "LICENSE", type: "text/plain" });

    http.createServer((req, res) => {
        const link = links.get(req.url || "") || { dist: "proxy-404.html", type: "text/html" };
        const stat = statSync(link.dist)
        res.writeHead(200, {
            'Content-Type': link.type,
            'Content-Length': stat.size
        });
        var readStream = createReadStream(link.dist);
        readStream.pipe(res);

        //console.log(req.url)
    }).listen(nfport);
    //Saves the proxies given to file
    function saveProxies() {

        writeFileSync(join(dataFile, "proxies.json"), JSON.stringify(getProxiesObj()));
        const ws = cluster.workers
        if (ws) {
            console.log("Reloading workers....")
            console.log(ws)
            Object.keys(ws).forEach(e => { console.log(ws[e]), ws[e]?.send(reloadCom) })
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