//Main loader class. 

import cluster from "cluster";
import { cpus } from "os";


//Main startup process
if (cluster.isPrimary) {
    console.log("Loading backend server")
    await import("./main.js");
    console.log("Loading proxy server settings")
    await import("./proxy.js");
    console.log("Startup and task manager")
    await import("./taskServ.js");
    console.log("Forking into clusters")
    const start = () => {
        const c = cluster.fork()
        console.log(`Worker ${c.process.pid} Started!`);
    }
    cpus().forEach(start)
    cluster.on('death', function (worker) {
        console.log(`Worker ${worker.pid} died. restarting it!`);
        start();
    });
} else {
    //Worker startup
    await import("./proxy.js");
}





