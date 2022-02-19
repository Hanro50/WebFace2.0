import bodyParser from "body-parser";
import exp from "express";
import { config, LICENCE } from "./utils/consts.js";
export const app = exp();
import { server } from "./modules/sockets.js";
import { getLicence } from "./utils/template.js";
import wsserv from "express-ws";
import { join } from "path/posix";

export const ws = wsserv(app);
const proxy = new server();
//This is here to insure the LICENCE file is not excluded
if (!LICENCE.exists() || !LICENCE.sha1("b4d7662bb6b0b804c8fc94f7bc81f59dce0c36f3")) {
    console.error("Cannot validate licence")
    process.exit();
}

app.get("/LICENSE", (req, res) => {
    res.type("html").send(getLicence()).end();
})
//ansi-to-html
app.use(exp.static("public"));
app.use("/xterm",exp.static(join("node_modules","xterm")));
app.use("/ansi",exp.static(join("node_modules","ansi-to-html","lib")));
app.use(bodyParser.json());
app.use("/api/ports", proxy.router);
app.listen(config.main.port, () => {
    console.log(`Main maintenance interface on http://localhost:${config.main.port}`)
})
