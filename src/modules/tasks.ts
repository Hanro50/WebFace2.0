import {  Router } from "express";
import { app, ws } from "../main.js";
import { config } from "../utils/consts.js";

const log_router = Router();
app.use("/api/logs", log_router);
console.log("Setting up logs!")
ws.app.ws('/', function (ws, req) {
    ws.on('message', function (msg) {
        ws.send(msg);
    });
});

interface task {
    data: { target: string, message: string, type: "error" | "info" }[];
}

const tasks: Map<string, task> = new Map();
tasks.set("main", { data: [] });
const logLimit = config.logLimit || 10000;
log_router.get("/lists", (req, res) => {
    const task = tasks.get(req.query.task as string || "main")
    if (task == null) res.status(404).type("json").send(JSON.stringify({ error: "data not found" })).end();
    else res.type("json").send(task.data).end();
})

function broadcast(target: string, message: string, type: "error" | "info") {

    const task = tasks.get(target)
    if (task == null) return;
    if (task.data.length > logLimit) task.data.shift()
    const mess = { target, message, type };
    task.data.push(mess);

    ws.getWss().clients.forEach((socket) => {
        socket.send(JSON.stringify(mess));
    })
}
/**@ts-ignore */
process.stdout.write = (...args: any) => {
    try {
        broadcast("main", args[0], "info");
    } catch (e) {
        process.stderr._write(JSON.stringify(e), "utf-8", (err) => { });
    }
    /**@ts-ignore */
    return process.stdout._write(...args);
}

/**@ts-ignore */
process.stderr.write = (...args: any) => {
    broadcast("main", args[0], "error");
    /**@ts-ignore */
    return process.stderr._write(...args);
}

console.log("Logs are set up!")

setInterval(() => console.log("tick"), 1000);