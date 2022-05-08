const frame = document.getElementById("frame") as HTMLIFrameElement;

const loc = localStorage.getItem("page") || "/html/main.html"

frame.onload = (ev) => {
    if (frame.contentWindow?.location.pathname.startsWith("/html")) {
        localStorage.setItem("page", frame.contentWindow?.location.pathname)
    }

    console.log(frame.contentWindow?.location.pathname)

}
if (loc.startsWith("/html")) {
    const r = await fetch(loc);
    if (r.ok)
        window.onload = () => frame.src = loc;
}

export { };
