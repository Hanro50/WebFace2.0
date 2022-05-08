import type { proxy } from "../proxy.js";
import { button, licenceButton } from "./util.js";

const a: proxy[] = await (await fetch("/api/pages")).json();

a.forEach(e => {
    button(`${location.protocol}//${e.host}/`, () => location.href = `${location.protocol}//${e.host}:${location.port}/`)
})

licenceButton();