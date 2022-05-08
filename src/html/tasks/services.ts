
import { button } from "../util.js";
const r = await fetch("/api/tasks");
const json = await r.json()
console.log(json);
button("Back", () => window.location.href = "../nav.html");

json.forEach((element: string) => {
    button(element, () => window.location.href = `./tasks.html?task=${element}`);
});