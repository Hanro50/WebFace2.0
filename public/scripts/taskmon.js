var Convert = require('ansi-to-html');
var convert = new Convert();
const a = async () => {
    let id_main = "main";
    /**@type {HTMLDivElement}*/
    const term = document.getElementById('terminal')
    /**@param info {{ target:string, message:string, type:"error"|"info" }}*/
    function broadcast(info) {
        if (info.target != id_main) return;
        const scroll = term.scrollTop + term.clientHeight == term.scrollHeight
        info.message.split("\n").forEach(v => { if (v.trim().length > 0) term.innerHTML += convert.toHtml(v.replace(/\t/g, "&nbsp;&nbsp;&nbsp;&nbsp;").replace(/\s/g, "&nbsp;")) + "<br>" });
        if (scroll) term.scrollTop = term.scrollHeight - term.clientHeight;
    }//
    const socket = new WebSocket('ws://' + window.location.host);
    // Listen for messages
    socket.addEventListener('message', function (event) {
        broadcast(JSON.parse(event.data))
    });
    async function load(id) {
        id_main = id;
        const r = await fetch("/api/logs/lists?task=" + id_main);
        /**@type {{ target:string, message:string, type:"error"|"info" }[]}*/
        const logs = await r.json();
        term.innerText = ""
        logs.forEach((v)=>setTimeout(broadcast(v),1));
        term.innerHTML += `<div class="connected"> Open: Connected to console!</div>`;
    }
    // Connection opened
    socket.addEventListener('open', function (event) {
        console.log("Connected!")
        load(id_main)
    });
    socket.onclose =() => term.innerHTML += `<span class="error">Error: Lost console connection!</span>`;
};
a();