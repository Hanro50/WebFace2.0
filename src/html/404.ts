import type { proxy } from "../server.js";
import { button } from "./util.js";

const a: proxy[] = await (await fetch("/api/pages")).json();

a.forEach(e => {
    button(`${location.protocol}://${e.host}/`, () => location.href = `https://${e.host}/`)
})