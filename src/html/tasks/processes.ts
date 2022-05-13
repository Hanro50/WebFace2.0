import "../util.js";;
import type { log } from "../../taskServ";
import Convert from "../ansi-to-html.js";
import { button } from "../util.js";
var convert = Convert({});
const taskHeader = document.getElementById('task') as HTMLDivElement;
const id = new URL(location.href).searchParams.get('task') || "main";
const script = new URL(location.href).searchParams.get('script');
const bckbtn = document.getElementById("back");
if (script && bckbtn) {

    bckbtn.onclick = () => {
        terminate();
        window.location.replace(`/html/script.html?script=${script}`);
    }
    const nv = document.getElementById("nav");
    if (nv) {
        const spltbtn = button("Finalize", () => {
            spltbtn.remove();
            bckbtn.onclick = () => window.location.href = './service.html';
            term.innerHTML = term.innerHTML += `<div class="connected"> Info: Process has been marked as finalized. Exiting edit mode!</div>`;
        }, nv)
    }
}
taskHeader.innerText = id;

let socket: WebSocket;
const term = document.getElementById('terminal') as HTMLDivElement;
function terminate() {
    if (socket && socket.readyState == socket.OPEN) socket.send("kill")
    else term.innerHTML += `<div class="error"> Error: Console is disconnected!</div>`;
    if (id !== "main")
        bckbtn?.click()
}
const termbut = document.getElementById('terminate');
if (termbut) termbut.onclick = terminate;
const clr = document.getElementById('clear');
if (clr) clr.onclick = () => {
    term.innerHTML = `<div class="connected"> Open: Cleared the console!</div>`;
    if (socket && socket.readyState == socket.OPEN) socket.send("clear")
    else term.innerHTML = `<div class="error"> Error: Console is disconnected!</div>`;
}
const disc = document.getElementById('disconnect');
if (disc) disc.onclick = () => {
    if (socket && socket.readyState == socket.OPEN) socket.close()
    else term.innerHTML += `<div class="error"> Error: Console is already disconnected!</div>`;
}
const r = await fetch(`/api/tasks/${id}`)

if (r.ok) {
    const json: log[] = await r.json();
    term.innerHTML = "";
    function broadcast(info: log) {
        console.log(info)
        const scroll = term.scrollTop + term.clientHeight == term.scrollHeight
        let out = ">"
        switch (info.code) {
            case ("error"): out = 'class="error">Error: '; break;
            case ("end"): out = 'class="error">Ended: '; break;
        }

        if (info.line.trim().length > 0) term.innerHTML += `<div ${out}${convert.toHtml(info.line.replace(/\t/g, "&nbsp;&nbsp;&nbsp;&nbsp;").replace(/\s/g, "&nbsp;"))}</div>`;
        if (scroll) term.scrollTop = term.scrollHeight - term.clientHeight;
    }//
    //   console.log(json)
    json.forEach(broadcast);
    socket = new WebSocket(`ws://${window.location.host}/api/tasks/${id}`);
    // Listen for messages
    socket.addEventListener('message', function (event) {
        console.log('Message from server ', event.data);
        broadcast(JSON.parse(event.data))
    });
    // Connection opened
    socket.addEventListener('open', function (event) {
        console.log("Connected!");
        term.innerHTML += `<div class="connected"> Open: Connected to console!</div>`;
        // load()
    });
    socket.onclose = () => term.innerHTML += `<span class="error">Error: Lost console connection!</span>`;


} else {
    terminate();
}
//window.taskmon = { clear, terminate,disconnect }