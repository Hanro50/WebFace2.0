import Express from "express"
import bodyParser from "body-parser";
import { existsSync, readFileSync } from "fs";
import expWS from "express-ws"

export const appWS = expWS(Express(), undefined, {});
export const app = appWS.app;

if (!existsSync("LICENSE")) console.error("Licence file is missing?!")

//Backend gui
app.get("/html/license.txt", (req, res) => res.type("txt").send(readFileSync("LICENSE")).end());
app.use(Express.static("html"));
app.use("/modules", Express.static("dist/html"));
app.use(bodyParser.json())

app.listen(8080);
