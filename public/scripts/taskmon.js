var Convert = require('ansi-to-html');
var convert = new Convert();
const taskHeader = document.getElementById('task')
const id = new URL(location.href).searchParams.get('task') || "main";
taskHeader.innerText = id;
/**@type {WebSocket} */
let socket;
const term = document.getElementById('terminal')
function terminate() {
    if (socket && socket.readyState == socket.OPEN) socket.send(JSON.stringify({ task: "kill", data: id }))
    else term.innerHTML += `<div class="error"> Error: Console is disconnected!</div>`;
}
function clear() {
    term.innerHTML = `<div class="connected"> Open: Cleared the console!</div>`;
    if (socket && socket.readyState == socket.OPEN) socket.send(JSON.stringify({ task: "clear", data: id }))
    else term.innerHTML = `<div class="error"> Error: Console is disconnected!</div>`;
}
function disconnect(){
    if (socket && socket.readyState == socket.OPEN)  socket.close()
    else term.innerHTML += `<div class="error"> Error: Console is already disconnected!</div>`;
}
const a = async () => {
    /**@type {HTMLDivElement}*/

    /**@param info {{ target:string, message:string, type:"error"|"info" }}*/
    function broadcast(info) {
        if (info.target != id) return;
        const scroll = term.scrollTop + term.clientHeight == term.scrollHeight
        info.message.split("\n").forEach(v => { if (v.trim().length > 0) term.innerHTML += convert.toHtml(v.replace(/\t/g, "&nbsp;&nbsp;&nbsp;&nbsp;").replace(/\s/g, "&nbsp;")) + "<br>" });
        if (scroll) term.scrollTop = term.scrollHeight - term.clientHeight;
    }//
    socket = new WebSocket('ws://' + window.location.host);
    // Listen for messages
    socket.addEventListener('message', function (event) {
        broadcast(JSON.parse(event.data))
    });
    // Connection opened
    socket.addEventListener('open', function (event) {
        term.innerText = ""
        console.log("Connected!");
        term.innerHTML += `<div class="connected"> Open: Connected to console!</div>`;
        socket.send(JSON.stringify({ task: "refresh", data: id }))
        // load()
    });
    socket.onclose = () => term.innerHTML += `<span class="error">Error: Lost console connection!</span>`;
};
a();

window.taskmon = { clear, terminate,disconnect }