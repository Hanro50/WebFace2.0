//Main loader class. 

import cluster from "cluster";
import { cpus } from "os";
import type { log } from "./taskServ.js";


//Main startup process
if (cluster.isPrimary) {

    console.log("Loading backend server")
    await import("./main.js");
    console.log("Loading proxy server settings")
    await import("./proxy.js");
    console.log("Startup and task manager")
    const ts = await import("./taskServ.js");
    console.log("Forking into clusters")

    const start = () => {
        const c = cluster.fork()
        console.log(`Worker ${c.process.pid} Started!`);
        console.log(c.process)
        c.on('message', (data: log) => {
            data.code == "info" ? console.log(data.line) : console.error(data.line)
        })
    }

    cpus().forEach(start)
    cluster.on('death', function (worker) {
        console.log(`Worker ${worker.pid} died. restarting it!`);
        start();
    });

} else {
    //Worker startup
    await import("./proxy.js");
    /**@ts-ignore */
    process.stdout.write = (...args: any) => {
        if (process.send)
            try { process.send({ code: "info", line: args[0] }) } catch (e) { process.stderr._write(JSON.stringify(e), "utf-8", (err) => { }); }
        /**@ts-ignore */
        return proc.stderr._write(...args);
    }
    /**@ts-ignore */
    process.stderr.write = (...args: any) => {
        if (process.send)
            try { process.send({ code: "error", line: args[0] }) } catch (e) { process.stderr._write(JSON.stringify(e), "utf-8", (err) => { }); }
        /**@ts-ignore */
        return proc.stderr._write(...args);
    }
}





