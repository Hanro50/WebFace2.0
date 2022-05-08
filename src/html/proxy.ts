import type { mapObj } from "../main.js";
import type { proxy } from "../server.js";
import { button } from "./util.js";

const div = button("back", () => window.location.href = "./nav.html");
const table = document.getElementById("table") as HTMLTableElement;
let li: Node | null;
div.style.position = "absolute"
div.style.bottom = "5px"
const proxies: mapObj<proxy> = await (await fetch("/api/proxies")).json();

function addCell(host: string, port: number, id: string, checked?: boolean) {
    const r = document.createElement("tr");
    const c1 = document.createElement("td");
    c1.innerText = host;
    r.appendChild(c1);
    const c2 = document.createElement("td");
    c2.innerText = "=>";
    r.appendChild(c2);
    const c3 = document.createElement("td");
    c3.innerText = String(port);
    r.appendChild(c3);
    const c4 = document.createElement("td");
    const inp = document.createElement("input");
    inp.type = "checkbox";
    inp.checked = !!checked;
    inp.onclick = () => fetch(`/api/proxies/toggle/${id}`, { method: "POST" });
    c4.appendChild(inp)
    r.appendChild(c4);
    const c5 = document.createElement("td");
    c5.innerText = "delete";
    c5.onclick = () => {
        li = r.nextElementSibling
        r.remove();
        fetch(`/api/proxies/remove/${id}`, { method: "POST" });

    }
    r.appendChild(c5);
    if (li?.isConnected) table.insertBefore(r, li);
    else table.appendChild(r);


    li = r;
}
Object.keys(proxies).forEach(e => {
    const proxy = proxies[e];
    addCell(proxy.host, proxy.port, e, proxy.hide);
})
const hostin = document.getElementById("host") as HTMLInputElement;
const portin = document.getElementById("port") as HTMLInputElement;
const hidein = document.getElementById("hide") as HTMLInputElement;
const postbt = document.getElementById("post") as HTMLDivElement;
postbt.onclick = async () => {
    const proxy: proxy = { host: hostin.value, port: Number(portin.value), hide: hidein.checked };
    const r = await fetch(`/api/proxies/add/${hostin.value}`, { method: "POST", body: JSON.stringify(proxy), headers: { "content-type": "application/json" } })
    if (r.ok) {
        const json = await r.json();
        addCell(json.host, json.port, json.host, proxy.hide);
        hostin.value = "";
        portin.value = "";
    }
}
