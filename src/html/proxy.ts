import type { mapObj } from "../main.js";
import type { proxy } from "../proxy.js";
import { button } from "./util.js";

const div = button("back", () => window.location.href = "./nav.html");
const table = document.getElementById("table") as HTMLTableElement;
let li: Node | null;
div.style.position = "absolute"
div.style.bottom = "5px"
const proxies: mapObj<proxy> = await (await fetch("/api/proxies")).json();

function addCell(proxy: proxy) {
    const r = document.createElement("tr");
    const c1 = document.createElement("td");
    c1.innerText = proxy.host;
    r.appendChild(c1);
    const c2 = document.createElement("td");
    c2.innerText = "=>";
    r.appendChild(c2);
    const c3 = document.createElement("td");
    c3.innerText = proxy.prxy || "localhost";
    r.appendChild(c3);
    const c4 = document.createElement("td");
    c4.innerText = String(proxy.port);
    r.appendChild(c4);
    const c5 = document.createElement("td");
    const inp = document.createElement("input");
    inp.type = "checkbox";
    inp.checked = proxy.hide;
    inp.onclick = () => fetch(`/api/proxies/toggle/${proxy.host}`, { method: "POST" });
    c5.appendChild(inp)
    r.appendChild(c5);
    const c6 = document.createElement("td");
    c6.innerText = "delete";
    c6.onclick = () => {
        li = r.nextElementSibling
        r.remove();
        fetch(`/api/proxies/remove/${proxy.host}`, { method: "POST" });

    }
    r.appendChild(c6);
    if (li?.isConnected) table.insertBefore(r, li);
    else table.appendChild(r);


    li = r;
}
Object.keys(proxies).forEach(e => {
    const proxy = proxies[e];
    addCell(proxy);
})
const hostin = document.getElementById("host") as HTMLInputElement;
const prxyin = document.getElementById("prxy") as HTMLInputElement;
const portin = document.getElementById("port") as HTMLInputElement;
const hidein = document.getElementById("hide") as HTMLInputElement;
const postbt = document.getElementById("post") as HTMLDivElement;

postbt.onclick = async () => {
    const proxy: proxy = { prxy: prxyin.value, host: hostin.value, port: Number(portin.value), hide: hidein.checked };
    const r = await fetch(`/api/proxies/add/${hostin.value}`, { method: "POST", body: JSON.stringify(proxy), headers: { "content-type": "application/json" } })
    if (r.ok) {
        const json = await r.json() as proxy;
        addCell(json);
        hostin.value = "";
        portin.value = "";
    }
}
