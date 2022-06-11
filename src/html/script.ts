
import { mapObj,meta } from "../constants.js";
import { button, uuid4 } from "./util.js";
let saved = true;
class inp {
    private chkBox: boolean;
    input: HTMLInputElement;
    constructor(input: HTMLInputElement) {
        this.input = input;
        this.chkBox = input.type == "checkbox";
        if (this.chkBox)
        this.input.addEventListener('mousedown',() => saved = false);
        this.input.addEventListener('keydown',()=>saved = false);

    }

    getValue() {
        //@ts-ignore
        return this.chkBox ? this.input.checked : this.input.value;
    }

    getID() {
        return this.input.id;
    }
    setDefault() {
        if (this.chkBox)
            this.input.checked = false
        else
            this.input.value = this.input.defaultValue;
    }
    setValue(val?: any) {
        if (!val)
            this.setDefault();
        else if (this.chkBox)
            this.input.checked = !!val;
        else
            this.input.value = val;
    }
}

const inputs: inp[] = [];
Array.from(document.getElementsByTagName('input')).forEach(e => {
    inputs.push(new inp(e));
})


const table = document.getElementById("table") as HTMLDivElement
const buttons = document.getElementById("buttons") as HTMLDivElement


let j: mapObj<meta> = await (await fetch("/api/scripts/")).json();

const namein = document.getElementById("name") as HTMLInputElement;
const runin = document.getElementById("runner") as HTMLInputElement;
const scrptin = document.getElementById("script") as HTMLTextAreaElement;

const savebtn = document.getElementById("savebtn") as HTMLTableCellElement;
const delbtn = document.getElementById("delbtn") as HTMLTableCellElement;
const strttn = document.getElementById("strttn") as HTMLTableCellElement;
strttn.onclick = async () => {

    if (await save())
        window.location.href = `/api/scripts/${namein.value}/run`
}
async function save() {
    if (namein.value.trim().length < 1 && !namein.readOnly) {
        alert("Please provide the a valid name for the script first");
        return false;
    }
    namein.readOnly = true;
    const ret: any = { data: scrptin.value };
    inputs.forEach(e => {
        ret[e.getID()] = e.getValue();
    })
    const r = await fetch(`/api/scripts/${namein.value}`, { headers: { "content-type": "application/json" }, method: "POST", body: JSON.stringify(ret) })
    const svd = r.ok;
    if (svd)
        j = await (await fetch("/api/scripts/")).json();
    else if (r.status == 400) alert("Did not save data due to no data field being empty");
    else alert(`Did not save data due to error\nCode: ${r.status}`);
    genButtons();
    return svd;
}
async function del() {
    if (namein.readOnly) {
        const name = namein.value.length > 0 ? namein.value : `${Date.now()}.${(uuid4())}`;
        const r = await fetch(`/api/scripts/${name}`, { method: "DELETE" });
        if (r.ok)
            j = await (await fetch("/api/scripts/")).json();
        else if (r.status == 404) alert("Failed to find object to delete!");
        else alert(`Did not save data due to error\nCode: ${r.status}`);
        genButtons();
    }
    clear();
}
function clear() {
    buttons.style.display = "none";
    table.style.display = "";
    namein.readOnly = false;
    scrptin.value = "";
    inputs.forEach(e => e.setDefault())
}

scrptin.onkeyup = () => {
    saved = false;
    if (scrptin.value.startsWith("#!")) {
        runin.readOnly = true;
        runin.value = scrptin.value.includes("\n") ? scrptin.value.substring(2, scrptin.value.indexOf("\n")) : scrptin.value.substring(2);
    } else
        runin.readOnly = false;
}
savebtn.onclick = save;
delbtn.onclick = del;


async function load(index: string) {
    const obj = j[index];
    if (!obj) return;
    buttons.style.display = "none";
    table.style.display = "";
    namein.readOnly = true;
    scrptin.value = await (await fetch(`/api/scripts/${obj.name}`)).text();
    inputs.forEach(e => {
        const val = obj as any;
        e.setValue(val[e.getID()])
    })

}
function genButtons() {
    buttons.innerHTML = "";
    button("back", () => window.location.href = "./nav.html", buttons);

    Object.keys(j).forEach(e => {
        button(e, async () => {
            load(e)
        }, buttons);
    });

    button("New script", () => {
        clear();
    }, buttons);
}
table.style.display = "none";

const div = button("back", () => {
    if (!saved)
        if (confirm("Save changes?\nPress 'ok' to save!")) save();
    table.style.display = "none";
    buttons.style.display = "";
}, table);
div.style.position = "absolute"
div.style.bottom = "5px"
console.log(div);
genButtons();


async function loadRuntime() {
    const p = document.getElementById("runners");
    if (!p) return;
    const json = await (await fetch(`/api/runners`, { method: "GET" })).json() as string[];
    json.sort((a, b) => a.localeCompare(b))
    json.forEach(e => {
        const v = document.createElement("option");
        v.value = e;
        p.appendChild(v);
    })
}
loadRuntime();
const script = new URL(location.href).searchParams.get('script');
if (script) {
    load(script);
}

window.onclick = ()=> console.log(namein)