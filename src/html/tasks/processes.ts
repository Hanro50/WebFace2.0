import "../util.js";;
import type { log } from "../../taskServ";
import Convert from "../ansi-to-html.js";
var convert = Convert({});
const taskHeader = document.getElementById('task') as HTMLDivElement;
const id = new URL(location.href).searchParams.get('task') || "main";
taskHeader.innerText = id;

let socket: WebSocket;
const term = document.getElementById('terminal') as HTMLDivElement;
function terminate() {
    if (socket && socket.readyState == socket.OPEN) socket.send(JSON.stringify({ task: "kill", data: id }))
    else term.innerHTML += `<div class="error"> Error: Console is disconnected!</div>`;
}
const termbut = document.getElementById('terminate');
if (termbut) termbut.onclick = terminate;
const clr = document.getElementById('clear');
if (clr) clr.onclick = () => {
    term.innerHTML = `<div class="connected"> Open: Cleared the console!</div>`;
    if (socket && socket.readyState == socket.OPEN) socket.send(JSON.stringify({ task: "clear", data: id }))
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
    function broadcast(info: log) {
        const scroll = term.scrollTop + term.clientHeight == term.scrollHeight
        if (info.line.trim().length > 0) term.innerHTML += convert.toHtml((info.code == "error" ? "\\033[31;" : "") + info.line.replace(/\t/g, "&nbsp;&nbsp;&nbsp;&nbsp;").replace(/\s/g, "&nbsp;") + (info.code == "error" ? "\\033[0;" : "")) + "<br>";
        if (scroll) term.scrollTop = term.scrollHeight - term.clientHeight;
    }//
    console.log(json)
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