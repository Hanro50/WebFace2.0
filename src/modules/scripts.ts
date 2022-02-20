import { execFileSync } from "child_process";
import e, { Router } from "express";
import { app, ws } from "../main.js";
import { script, sysSettings } from "../utils/consts.js";
import { dir, file } from "../utils/files.js";
const script_folder = new dir("./scripts")
const script_router = Router();
app.use("/api/scripts", script_router);
var isElevated: boolean;

if (process.getuid() == 0) isElevated = true
else
    try {
        execFileSync("net", ["session"], { "stdio": "ignore" });
        isElevated = true;
    }
    catch (e) {
        isElevated = false;
    }
export const root = isElevated;

function getList() {
    const scripts: Map<string, script> = new Map();
    script_folder.ls().forEach(e => {
        try {
            if (e instanceof file && e.getName().endsWith(".json")) scripts.set(e.getName(), e.toJSON<script>())
        } catch {
            console.error("Failed to read " + e.sysPath());
        }
    })
    return scripts;
}

script_router.get("/system/list", (req, res) => {
    const scripts = getList();
    const ret = [];
    scripts.forEach((v, k) => {
        if (v.system) ret.push({ script: k, name: v.name, description: v.description || "" });
    })
    res.type("json").send(JSON.stringify(ret)).end()
})

script_router.get("/list", (req, res) => {
    const scripts = getList();
    const ret = [];
    scripts.forEach((v, k) => {
        if (!v.system) ret.push({ script: k, name: v.name, description: v.description || "" });
    })
    res.type("json").send(JSON.stringify(ret)).end()
})


script_router.post("/run", (req, res) => {
    if (!req.body.script) return res.status(400).type("json").send(JSON.stringify({ error: "No script specified" })).end();
    const scriptFile: string = req.body.script;
    if (scriptFile.includes("..")) return res.status(401).type("json").send(JSON.stringify({ error: "Script name breaks security policy" })).end();
    const script = script_folder.getFile(req.body.script);
    if (!script.exists()) return res.status(404).type("json").send(JSON.stringify({ error: "Script not found" })).end();
    let scriptINI: script;
    try {
        scriptINI = script.toJSON();
    } catch {
        return res.status(500).type("json").send(JSON.stringify({ error: "Failed to parse script data" })).end();
    }
    const result = run(scriptINI);
    if ("error" in result) return res.status(result.code).type("json").send(JSON.stringify({ error: result.error })).end();


    res.status(200).end();
})

function run(script: script): { error: string, code: number } {
    let sys: sysSettings;

    if ("supported" in script.settings) {
        sys = script.settings;
    } else {
        let system: "windows" | "darwin" | "linux";
        switch (process.platform) {
            case ("win32"): system = "windows"; break;
            case ("darwin"): system = "darwin"; break;
            default: system = "linux";
        }
        if (system in script.settings)
            sys = script.settings[system];
    }
    if (!sys || !sys.supported) return { error: `[Error]: Cannot run "${script.name}" as the Host os does not support it`, code: 400 }
    if (!isElevated && sys.root) return { error: `[Error]: Lacking administrator privilidges to run script "${script.name}"`, code: 401 }

    

}