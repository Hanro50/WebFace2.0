import e, { Router } from "express";
import { app, ws } from "../main.js";
import { script } from "../utils/consts.js";
import { dir, file } from "../utils/files.js";
const script_folder = new dir("./scripts")
const script_router = Router();
app.use("/api/scripts", script_router);

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