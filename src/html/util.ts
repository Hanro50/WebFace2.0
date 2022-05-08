


/**
 * Creates a button, but doesn't add it
 * @param title 
 * @param func 
 * @returns 
 */
export function mkButton(title: string, func: () => void) {
    const div = document.createElement("div");
    div.innerText = title;
    div.onclick = func;
    div.className = "button";
    return div;
}

/**
 * Creates a button and appends it to document
 * @param title 
 * @param func 
 * @returns 
 */
export function button(title: string, func: () => void, parent = document.body) {
    const div = mkButton(title, func);
    parent.appendChild(div);
    return div;
}

export function uuid4() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
        var r = Math.random()*16|0, v = c == 'x' ? r : (r&0x3|0x8);
        return v.toString(16);
    });
}


export function licenceButton(){
    button(`Licence txt`, async () => {
        document.body.innerHTML = "";
        button(`Back`,()=> window.location.reload());
        const pre = document.createElement('pre'); 
        const license: string = await (await fetch("license.txt")).text();
  //      console.log(license)
        pre.innerText = license;
        document.body.appendChild(pre);
        const br = document.createElement('div');
        br.innerHTML = "&nbsp;"
        br.style.height = '20px';
        document.body.appendChild(br); 
    })
}