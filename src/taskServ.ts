import { ChildProcess, spawn } from "child_process";
import { createHash, randomUUID } from "crypto";
import { chmodSync, existsSync, mkdirSync, readdirSync, readFileSync, rmSync, writeFileSync } from "fs";
import { tmpdir } from "os";
import path, { join } from "path";
import { dataFile, mapObj, meta } from "./constants.js";
import { app } from "./main.js";

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
    //  console.log(e)
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

app.use("/api/scripts/:script/:run?", (req, res) => {
    const script = req.params.script.replace(/[\/,\\,\.]/g, "_");
    if (req.method == "POST") {
        // console.log(req.body)
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
    //   console.log(data.startsWith(`#!${meta.runner || "/bin/bash"}`))
    if (req.method.toUpperCase() == "GET") {
        if (req.params.run) {
            res.redirect(`/html/tasks/tasks.html?task=${startTask(meta).name}&script=${req.params.script}`);
        } else
            return res.status(200).type("txt").send(data).end();
    }
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
export type logType = "info" | "error" | "end";
export interface log { code: logType, line: string };
export interface infTask {
    readonly log: log[];
}
process.stdout

function startTask(meta: meta): impTask {
    const internal = (lr = 0, task?: impTask, respool: number = 0) => {
        let tsk = task as impTask;
        try {
            //Avoid a reboot if the task is marked as killed.
            respool++;
            if (task && task.killed) return task;
            if (respool > 5) throw "Runaway script detected. Process has surpased the allowed respool limited\nIt has been blocked from being restarted."
            else if (lr + 1000 > Date.now()) { console.error("Detected runaway process!"); }
            else respool = 0;

            chmodSync(meta.path, 0o775)
            const pwd = existsSync(meta.pwd || "") ? meta.pwd : tmpdir();
            console.log(`Using: "${pwd}"`)
            const c = (process.platform == "win32")
                ? spawn("cmd", ["-c", path.resolve(meta.path)], { cwd: pwd })
                : spawn("bash", ["-c", path.resolve(meta.path)], { cwd: pwd });

            tsk = task?.setTask(c) || new impTask(meta.name, c);

            c.addListener('message', (message) => tsk.write("info", message.toString()))
            c.on('message', (message) => tsk.write("info", message.toString()))
            c.on('error', (message) => tsk.write("error", message.toString()))

            c.on('close', () => {
                console.log("test")
                if (meta.restart && !tsk.killed) {
                    try {

                        internal(tsk.start, tsk, respool);
                        tsk.write("end", "Process restarted...")
                    } catch (e) { };
                } else
                    tsk.write("end", "Process has died!")
            });
            return tsk;
        } catch (e) {
            tsk.write("error", String(e));
            throw e;
        };
    }
    return internal();
}


export class impTask implements infTask {

    clients: Map<String, WebSocket>;
    log: log[] = [];
    proc: NodeJS.Process | ChildProcess;
    name: string;
    start: number;
    killed: boolean = false;
    constructor(name: string, proc: NodeJS.Process | ChildProcess) {
        this.start = Date.now();
        this.clients = new Map();

        let n = name;
        let i = 1;
        while (tasks.has(n)) {
            n = `${name}_${i}`
            i++;
        }
        tasks.set(n, this);
        this.name = n;

        // proc.on('close')
        this.proc = proc;
        this.setTask(proc);
    }

    setTask(proc: NodeJS.Process | ChildProcess) {
        try {
            this.proc = proc;
            /**@ts-ignore*/
            proc.stdout.write = (...args: any) => {
                try { mtask.write("info", args[0]) } catch (e) { process.stderr._write(JSON.stringify(e), "utf-8", (err) => { }); }
                /**@ts-ignore */
                return proc.stdout._write(...args);
            }
            /**@ts-ignore */
            proc.stderr.write = (...args: any) => {
                try { mtask.write("error", args[0]) } catch (e) { process.stderr._write(JSON.stringify(e), "utf-8", (err) => { }); }
                /**@ts-ignore */
                return proc.stderr._write(...args);
            }
            proc.stdout?.on('data', this.writeCon('info'))
            proc.stderr?.on('data', this.writeCon('error'))
            return this;
        } catch (err) {
            console.trace(err)

        }
    }

    writeCon(type: logType) {
        return (out: Buffer) => this.write(type, out.toString())
    }
    kill() {

        this.killed = true;
        if (this.name == "main") return this.write("error", "Cannot end 'main' service!")
        tasks.delete(this.name);
        this.clients.forEach(e => e.close());
        if (this.proc.pid)
            this.proc.kill(0);
    }

    addClient(id: String, client: WebSocket) {
        this.clients.set(id, client);
    }
    removeClient(id: string) {
        this.clients.delete(id)
    }
    clear(): void {
        this.log = [];
    }
    write(code: logType, line: String | string) {
        line.split("\n").forEach(e => {
            const transmission = { code, line: typeof e == "object" ? JSON.stringify(e) : e };
            this.log.push(transmission);
            while (this.log.length > 500) this.log.shift();
            this.clients.forEach(e => {
                try { e.send(JSON.stringify(transmission).toString()) } catch { e.close() }
            })
        })
    }
}
const tasks = new Map<String, impTask>();




projects.forEach(e => {
    if (e.startup) {
        try {
            startTask(e);
        } catch (e) {

        }
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
    //    console.log("socket!", req.params.task);
    const tsk = tasks.get(req.params.task);
    if (!tsk)
        return web.close(404);
    const conID = `${randomUUID()}.${Date.now()}.${createHash("sha256").update(req.ip).digest("hex")}`;
    //  console.log("socket3", req.params.task);
    //@ts-ignore
    tsk.addClient(conID, web);
    //    console.log(tsk);

    web.on("close", () => {
        tsk.removeClient(conID);
        console.log("close");
    });
    web.on("error", () => {
        tsk.removeClient(conID);
        console.log("error");
    });

    web.on("message", (data) => {
        const d = data.toString("utf-8");
        if (d == "kill") return tsk.kill();
        if (d == "clear") return tsk.clear();
    })
})

export const mtask = new impTask("main", process);

