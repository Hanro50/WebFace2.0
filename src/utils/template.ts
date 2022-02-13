import { LICENCE } from "./consts.js";
import { file } from "./files.js";
const template = new file("private", "template.html");

export function getLicence() {
    return getTemplate("Licence", "WebFace 2.0 Copyright (C) 2022  Hanro50", `<a href="#" onclick="history.go(-1)">Back</a><pre>${LICENCE.read()}</pre>`)
}

export function getTemplate(title: string, header: string, body: string) {
    return format(template, { title, header, body });
}
export function format(base: file, data: object) {
    let r = base.read();

    Object.keys(data).forEach(k => {
        const v = data[k];
        r = r.replaceAll("${" + k + "}", v);
    })
    return r;
}