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
    const errorHTML = readFileSync("./error.html").toString();
    function sendError(client: internal.Duplex | TLSSocket, code: number, message: string) {
        try {
            let j: proxy[] = [];
            proxies.forEach(e => {
                if (!e.hide) j.push(e);
            })
            const content = errorHTML.replace("{code}", code.toString()).replace("{message}", message).replace("{json}", JSON.stringify(j));
            const header = `HTTP/1.1 ${code} ERROR\nContent-Type: text/html\nKeep-Alive: timeout=5\nConnection: keep-alive\nContent-Length: ${content.length}\n\n`
            //@ts-ignore
            client.write(header + content);
        } catch (e) {
            console.error("Failed to send error message!", e)
        } finally {
            client.end();
        }
    }

    process.on("message", (msg) => {
        if (msg == reloadCom) reload();
        console.log(`Worker ${process.pid} reloaded proxy lists!`)
    })

    function connection(client: internal.Duplex | TLSSocket) {
        try {

            client.once('data', (raw) => {
                const chunks: string[] = [];
                client.on("readable", () => {
                    let chunk;
                    // Use a loop to make sure we read all currently available data
                    while (null !== (chunk = client.read())) {
                        chunks.push(String(chunk));
                    }

                })
                const data = raw.toString() as string;
                if (!data.split("\n")[0].includes('HTTP')) {
                    console.log('Data of rejected header->', data);
                    sendError(client, 400, "Malformed data header!")
                    return client.end();
                }

                const hostname = data
                    .split('Host: ')[1]?.split('\r\n')[0].split(":")[0];

                const result = proxies.get(hostname);
                if (!result) {
                    return sendError(client, 404, "Page not found!");
                }

                let port = result != null ? result.port : 8080;
                let host = result != null ? result.prxy : "localhost";

                //   Upgrade: websocket

                let server = net.createConnection({ host, port }, () => {
                    try {
                        server.write(data, () => {
                            client.pipe(server, { end: true });
                            server.pipe(client, { end: true });
                        });
                        chunks.forEach(e => server.write(e));

                        client.uncork()
                    } catch (e) {
                        console.error("Connection crash!")
                        console.trace(e);
                        end();
                    }

                });
                let ended = false;
                function gateWayErr() {
                    client.uncork();
                    sendError(client, 502, "This web service is not available.")
                }
                function end() {
                    if (ended) return;
                    ended = true;
                    if (data.startsWith("POST"))
                        console.log("END \n%s\n_", data)


                    client.end();
                    server.end();

                    //Freeing the internal resources. Since node's Garbage collector isn't always fast enough for this
                    client.destroy();
                    server.destroy();
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
                    gateWayErr()
                    end();
                });


            });
        } catch (err) {
            console.error("Connection crash!")
            console.trace(err);
            client.end()
            client.destroy();
        }
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
        serv.on('secureConnection', connection)

    }
}
else {
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