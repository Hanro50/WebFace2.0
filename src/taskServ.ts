import { createHash, randomUUID } from "crypto";
import { existsSync, mkdirSync, readdirSync, readFileSync, rmSync, writeFileSync } from "fs";
import { join } from "path";
import { app, appWS, dataFile, mapObj } from "./main.js";
export interface meta {
    name: string;
    path: string;
    startup?: boolean;
    restart?: boolean;
    pwd?: string;
    runner?: string;
}
export interface script {
    meta: meta,
    data: string,

}
const projects = new Map<string, meta>();
const folder = join(dataFile, "scripts")
function tometaObj() {
    const obj: mapObj<meta> = {};
    projects.forEach((v, k) => {
        try { obj[k] = v } catch { }
    });
    return obj;
}

if (!existsSync(folder)) mkdirSync(folder);
const ext = ".m.json"
readdirSync(folder).forEach(e => {
    console.log(e)
    if (e.endsWith(ext)) return;

    const filebase = join(folder, e);
    const file = filebase + ext;


    const meta: meta = (() => {
        try { if (existsSync(file)) return JSON.parse(readFileSync(file).toString()) }
        catch (e) { console.error(e) };
        const metFile = { name: e, path: filebase };
        writeFileSync(file, JSON.stringify(metFile)); return metFile;
    })();

    projects.set(e, meta);
})

app.get("/api/scripts/", (req, res) => {

    return res.status(200).type("json").send(JSON.stringify(tometaObj())).end();
})

app.use("/api/scripts/:script", (req, res) => {
    const script = req.params.script.replace(/[\/,\\,\.]/g, "_");
    if (req.method == "POST") {
        console.log(req.body)
        if (!req.body.data) return res.status(400).type("txt").send("No data sent!").end();
        const filebase = join(folder, script);
        const file = filebase + ext;
        // const metFile: meta = { name: script, path: filebase, runner: req.body.runner || "/bin/bash", pwd: req.body.pwd || "", startup: !!req.body.startup };
        const metFile: meta = req.body;
        metFile.name = script;
        metFile.path = filebase;
        writeFileSync(filebase, String(req.body.data).startsWith("#!") ? req.body.data : `#!${metFile.runner}\n${req.body.data}`);
        //@ts-ignore
        delete metFile.data;
        writeFileSync(file, JSON.stringify(metFile));
        projects.delete(script);
        projects.set(script, metFile);
        return res.status(200).type("json").send(JSON.stringify({ metFile, data: req.body.data })).end();
    }
    const meta = projects.get(script);
    if (!meta) return res.status(404).end();
    let data = readFileSync(meta.path).toString();

    if (data.startsWith(`#!${meta.runner || "/bin/bash"}\n`)) data = data.substring(data.indexOf("\n") + 1);
    console.log(data.startsWith(`#!${meta.runner || "/bin/bash"}`))
    if (req.method.toUpperCase() == "GET")
        return res.status(200).type("txt").send(data).end();
    if (req.method.toUpperCase() == "DELETE") {
        const filebase = join(folder, script);
        const file = filebase + ext;
        projects.delete(script);
        rmSync(filebase);
        rmSync(file);
        return res.status(200).type("json").send(JSON.stringify({ meta, data })).end();
    }

    return res.status(403).end();
})

app.get("/api/runners", (req, res) => {
    if (process.platform == "win32" || !process.env.PATH) return res.status(200).type("json").send("[]").end();
    const runners: string[] = []
    const pathsL = process.env.PATH.split(":");
    pathsL.forEach(path => {
        if (existsSync(path))
            readdirSync(path).forEach(e => runners.push(join(path, e)))
    })
    return res.status(200).type("json").send(JSON.stringify(runners)).end();

})
export type logType = "info" | "error";
export interface log { code: logType, line: string };
export interface infTask {
    readonly log: log[];
}
process.stdout
class impTask implements infTask {
    clients: Map<String, WebSocket>;
    log: log[] = [];
    constructor(name: string) {
        this.clients = new Map();
        let n = name;
        let i = 1;
        while (tasks.has(n)) {
            n = `${name}_${i}`
            i++;
        }
        tasks.set(n, this);
    }

    addClient(id: String, client: WebSocket) {
        this.clients.set(id, client);
    }
    removeClient(id: string) {
        this.clients.delete(id)
    }
    write(code: logType, line: String) {
        line.split("\n").forEach(e => {
            const transmission = { code, line: typeof e == "object" ? JSON.stringify(e) : e };
            this.log.push(transmission);
            if (this.log.length > 1000) this.log.shift();
            this.clients.forEach(e => {
                try { e.send(JSON.stringify(transmission).toString()) } catch { e.close() }
            })
        })
    }
}
const tasks = new Map<String, impTask>();


const mtask = new impTask("main");
/**@ts-ignore */
process.stdout.write = (...args: any) => {
    try { mtask.write("info", args[0]) } catch (e) { process.stderr._write(JSON.stringify(e), "utf-8", (err) => { }); }
    /**@ts-ignore */
    return process.stdout._write(...args);
}
/**@ts-ignore */
process.stderr.write = (...args: any) => {
    try { mtask.write("error", args[0]) } catch (e) { process.stderr._write(JSON.stringify(e), "utf-8", (err) => { }); }
    /**@ts-ignore */
    return process.stderr._write(...args);
}


projects.forEach(e => {
    if (e.startup) {

    }
})

app.get("/api/tasks", (req, res) => {
    return res.status(200).type("json").send(Array.from(tasks.keys())).end();
})

app.get("/api/tasks/:task", (req, res) => {
    const tsk = tasks.get(req.params.task)
    if (!tsk) return res.status(404).end();
    res.status(200).type("json").send(JSON.stringify(tsk.log)).end();
})


app.ws("/api/tasks/:task", (web, req) => {
    console.log("socket!", req.params.task);
    const tsk = tasks.get(req.params.task);
    if (!tsk)
        return web.close(404);
    const conID = `${randomUUID()}.${Date.now()}.${createHash("sha256").update(req.ip).digest("hex")}`;
    console.log("socket3", req.params.task);
    //@ts-ignore
    tsk.addClient(conID, web);
    console.log(tsk);

    web.on("close", () => {
        tsk.removeClient(conID);
        console.log("close");
    });
    web.on("error", () => {
        tsk.removeClient(conID);
        console.log("error");
    });
})
//setInterval(() => console.log("hello world"), 500)