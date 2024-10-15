class ToastQueue {
    constructor() {
        this.toast_element = document.getElementsByClassName("toast")[0];
        this.queue = [];
        this.showing = false;
        this.canceled = false;
    }

    #toggle() {
        this.toast_element.classList.toggle("inactive");
        this.toast_element.classList.toggle("active");
    }
    
    async show() {
        this.showing = true;
        await sleep(150);
        while (this.queue.length > 0) {
            if (this.canceled) {
                this.canceled = false;
                this.showing = false;
                return;
            }
            
            this.toast_element.innerText = this.queue[0];
            this.#toggle();
            await sleep(2000 + 50 * this.queue[0].length);  
            this.#toggle();
            await sleep(750);
            this.queue = this.queue.slice(1);
        }
        this.showing = false;
    }

    cancel_toast() {
        this.canceled = true;
        this.queue = [];
    }

    add(toast) {
        this.queue.push(toast);
        if (!this.showing) this.show();
    }

    get length() {
        return this.queue.length;
    }
}

class AchievementHandler {
    constructor(toast_queue) {
        this.achievements = {};
        this.complex_achievements = {};
        this.queue = toast_queue;
        this.enabled = true;
        this.unlocked = [];
        this.unlockedE = [];
    }

    disable() {
        this.enabled = false;
    }
    
    register(requirement, name, explanation) {
        this.achievements[name] = {
            req: requirement,
            expl: explanation
        };
    }

    register_complex(requirement, name, explanation, type) {

        if (!type) {
            this.complex_achievements[name] = {
                req: requirement.split(" + "),
                expl: explanation
            };
        } else {
            this.complex_achievements[name] = {
                req: requirement,
                expl: explanation
            };
        }
    }

    unregister_below() {
        let requirements = Object.values(this.achievements).map(e => e.req);
        while (created.length >= requirements[0]) {
            let name = Object.keys(this.achievements)[0];
            delete this.achievements[name];
            requirements = requirements.slice(1);
        }
    }

    filter(safe) {
        if (!safe) {
            for (let achievement of this.unlocked) {
                if (achievement in this.achievements) {
                    delete this.achievements[achievement];
                } else if (achievement in this.complex_achievements) {
                    delete this.complex_achievements[achievement];
                }
            }
        } else {
            for (let achievement of this.unlocked) {
                if (achievement in this.achievements) {
                    this.unlockedE.push(this.achievements[achievement].expl);
                    delete this.achievements[achievement];
                } else if (achievement in this.complex_achievements) {
                    this.unlockedE.push(this.complex_achievements[achievement].expl);
                    delete this.complex_achievements[achievement];
                }
            }
        }
    }
    
    check() {
        if (!this.enabled) return;
        // Simple
        let requirements = Object.values(this.achievements).map(e => e.req);
        requirements.sort((a, b) => {
            if (a == b) return 0;
            return a - b;
        });
        
        while (requirements.length > 0 && created.length >= requirements[0]) {
            let name = Object.keys(this.achievements)[Object.values(this.achievements).map(e => e.req).indexOf(requirements[0])];
            let expl = this.achievements[name].expl;
            this.queue.add(`Achievement Unlocked: ${name}`);
            this.queue.add(expl);
            this.unlocked.push(name);
            this.unlockedE.push(expl);
            delete this.achievements[name];
            requirements = requirements.slice(1);
        }

        // Complex - HAS
        let complex_requirements = Object.values(this.complex_achievements).map(e => {
            if (typeof(e.req) == "object" && e.req[0].split(" ")[0] == "HAS") {
                let reqs = e.req;
                reqs[0] = reqs[0].split(" ").slice(1).join(" ");
                return reqs;
            } else return false;
        });

        complex_requirements = complex_requirements.filter(e => e != false);
        
        if (complex_requirements.length != 0) {
            for (let req of complex_requirements) {
                let achievable = true;
                for (el of req) {
                    if (!created.includes(el)) achievable = false;
                }
    
                if (achievable) {
                    let name = Object.keys(this.complex_achievements)[complex_requirements.indexOf(req)];
                    let expl = this.complex_achievements[name].expl;
                    this.queue.add(`Achievement Unlocked: ${name}`);
                    this.queue.add(expl);
                    this.unlocked.push(name);
                    this.unlockedE.push(expl);
                    delete this.complex_achievements[name];
                }
            }
        }

        // Complex - TIME
        complex_requirements = Object.values(this.complex_achievements).map(e => {
            if (typeof(e.req) == "string" && e.req.split(" ")[0] == "TIME") {
                return [Object.values(this.complex_achievements).indexOf(e), Number(e.req.split(" ")[1])];
            } else return false;
        });

        complex_requirements = complex_requirements.filter(e => e != false);
        complex_requirements.sort((e1, e2) => {
            if (e1[1] == e2[1]) return 0;
            return e1[1] - e2[1];
        });
        
        while (complex_requirements.length > 0 && performance.now() > complex_requirements[0][1]) {
            let name = Object.keys(this.complex_achievements)[complex_requirements[0][0]];
            let expl = this.complex_achievements[name].expl;
            this.queue.add(`Achievement Unlocked: ${name}`);
            this.queue.add(expl);
            this.unlocked.push(name);
            this.unlockedE.push(expl);
            delete this.complex_achievements[name];
            complex_requirements = complex_requirements.slice(1);
        }
    }
}

class ElementHandler {
    constructor() {
        this.created = {};
        this.special = {};
    }

    get_created(element) {
        if (element in this.created) return this.created[element];
        else return -1;
    }

    add(element, left, top) {
        if (element in this.created) this.created[element] += 1;
        else this.created[element] = 1;
        if (element in this.special) return this.check(element, left, top);
    }

    add_special(element, creates, req_fn = (count) => count == n, cancel) {
        this.special[element] = [creates, req_fn, cancel];
        creatable++;
    }

    check(el, left, top) {
        let [creates, req_fn, cancel] = this.special[el];
        if (req_fn(this.created[el])) {
            let elm = document.createElement("div");
            elm.className = "element";
            elm.innerText = creates;
            elm.style.left = String(left + generate_random_offset(2)) + "px";
            elm.style.top = String(top + generate_random_offset(2)) + "px";
            elm.id = String(++id);
            if (underlined.includes(elm.innerText)) elm.classList.add("final");
            else if (bold.includes(elm.innerText)) elm.classList.add("important");
            canvas.appendChild(elm);

            if (!created.includes(elm.innerText)) {
                created.push(elm.innerText);
                let sidebar_element = document.createElement("li");
                sidebar_element.className = "displayelement";
                if (elm.classList.contains("final")) {
                    sidebar_element.classList.add("final");
                }
                if ((hide_items && elm.classList.contains("final")) || !elm.innerText.includes(query)) sidebar_element.style.display = "none";
                sidebar_element.innerText = creates;
                if (sidebar_element.innerText.length > 36) {
                    sidebar_element.style.width = "90%";
                }
                
                sidebar.appendChild(sidebar_element);
                order(sidebar);
            }

            this.add(creates);
            if (cancel) return true;
        }
    }
}

function to(n) {
    return n.toString(36);
}

function from(n) {
    return parseInt(n, 36);
}

function to_b62(n) {
    let charset = "0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ";
    let c2 = charset[Math.floor(n / 62)];
    let c1 = charset[n % 62];
    return String(c2) + String(c1);
}

function to_b10(b62) {
    let charset = "0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ";
    let c2 = b62[0];
    let c1 = b62[1];
    return charset.indexOf(c2) * 62 + charset.indexOf(c1);
}

var LZW = {
    compress: function (uncompressed) {
        "use strict";
        // Build the dictionary.
        var i,
            dictionary = {},
            c,
            wc,
            w = "",
            result = [],
            dictSize = 256;
        for (i = 0; i < 256; i += 1) {
            dictionary[String.fromCharCode(i)] = i;
        }

        for (i = 0; i < uncompressed.length; i += 1) {
            c = uncompressed.charAt(i);
            wc = w + c;
            //Do not use dictionary[wc] because javascript arrays 
            //will return values for array['pop'], array['push'] etc
           // if (dictionary[wc]) {
            if (dictionary.hasOwnProperty(wc)) {
                w = wc;
            } else {
                result.push(dictionary[w]);
                // Add wc to the dictionary.
                dictionary[wc] = dictSize++;
                w = String(c);
            }
        }

        // Output the code for w.
        if (w !== "") {
            result.push(dictionary[w]);
        }
        return result;
    },


    decompress: function (compressed) {
        "use strict";
        // Build the dictionary.
        var i,
            dictionary = [],
            w,
            result,
            k,
            entry = "",
            dictSize = 256;
        for (i = 0; i < 256; i += 1) {
            dictionary[i] = String.fromCharCode(i);
        }

        w = String.fromCharCode(compressed[0]);
        result = w;
        for (i = 1; i < compressed.length; i += 1) {
            k = compressed[i];
            if (dictionary[k]) {
                entry = dictionary[k];
            } else {
                if (k === dictSize) {
                    entry = w + w.charAt(0);
                } else {
                    return null;
                }
            }

            result += entry;

            // Add w+entry[0] to the dictionary.
            dictionary[dictSize++] = w + entry.charAt(0);

            w = entry;
        }
        return result;
    }
}


function k_from_v(o, v) {
    if (Object.values(o).includes(v))
        return Object.keys(o)[Object.values(o).indexOf(v)];
    else
        for (val of Object.values(o)) {
            if (val.split(" + ").includes(v))
                return Object.keys(o)[Object.values(o).indexOf(val)];
        }
}

async function populate() {
    for (let i = 0; i < 50; i++) {
        let px = Math.round(Math.random() * 0.75 * window.innerWidth);
        let py = Math.round(Math.random() * window.innerHeight);
        let element = created[Math.floor(Math.random() * created.length)];
        let el = document.createElement("div");
        el.className = "element";
        el.id = ++id;
        el.style.left = String(px) + "px";
        el.style.top = String(py) + "px";
        el.innerText = element;
        canvas.appendChild(el);
        // Note to future me:
        // element should not be added to handler as this is the populate function. idiot.
        // element_handler.add(element)
        await sleep(5);
    }
}

// Combinations
async function show_hint() {
    // Using created & elements
    found = false;
    if (created.length < creatable - hidden.length) {
        while (!found) {
            // await sleep(1);
            i = Math.floor(Math.random() * creatable);
            el = elements[i];
            if (!created.includes(el) && !hidden.includes(el)) {
                let e = k_from_v(combinations, el).split(" + ");
                let makeable = true
                for (ele of e) {
                    if (!created.includes(ele)) {
                        makeable = false;
                    }
                }
                
                if (makeable) {
                    queue.add(`Try making "${el}"!`);
                    return;
                }
            }
        }
    } else {
        queue.add("You've made everything!");
    } 
}

function generate_random_offset(offset) {
    return Math.round(Math.random() * offset * 30) - (offset * 15);
}

let id = 1;

async function get_combinations() {
    creatable = 0;
    combinations = {};
    elements = ["air", "earth", "fire", "water"]
    let file = await fetch("static/txt/combinations.txt");
    let text = await file.text();
    let lines = text.split("\n");
    let raw_combinations = lines.map((e) => e.split(" = "));
    let accounted_for = [];
    for (combination of raw_combinations) {
        if (combination[0].length > 0) {
            let els = combination[0].split(" + ");
            els = els.sort();
            
            let combos = combination[1].split(" + ");
            combination[1] = combos.join(" + ");
            combination[0] = els.join(" + ");
            combinations[combination[0]] = combination[1];
            for (el of combination[1].split(" + ")) {
                cel = el;
                if (!accounted_for.includes(cel)) {
                    accounted_for.push(cel);
                    creatable++;
                }
            }
            
            for (el of combination[1].split(" + ")) {
                elements.push(el);
            }
        }

        elements = [...new Set(elements)];
        creatable = elements.length;
    }

    underline()
    await get_bold();
    await get_hidden();
}

function underline() {
    // All elements used in recipes
    let used_elements = [];
    for (recipe of Object.keys(combinations)) {
        for (el of recipe.split(" + ")) {
            if (!used_elements.includes(el)) {
                used_elements.push(el);
            }
        }
    }

    for (element of elements) {
        if (!used_elements.includes(element)) {
            underlined.push(element);
        }
    }
}

async function get_bold() {
    let file = await fetch("static/txt/important-combinations.txt");
    let text = await file.text();
    let lines = text.split("\n");
    bold = lines;
}

async function get_hidden() {
    let file = await fetch("static/txt/hidden.txt");
    let text = await file.text();
    let lines = text.split("\n");
    hidden = lines;
}

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

async function clear_canvas() {
    let cw = get_value(getComputedStyle(document.documentElement).getPropertyValue('--canvas-width'));
    els = [...document.getElementsByClassName("element")];
    // els.sort(function(a, b) {
    //     return a.offsetLeft == b.offsetLeft ? 0 : (Math.min(cw - a.offsetLeft, a.offsetLeft) < Math.min(cw - b.offsetLeft, b.offsetLeft) ? 1 : -1);
    // });

    els.sort((a, b) => Math.random());
    for (element of els) {
        let offX = get_value(element.style.left);
        if (offX > 0.35 * window.innerWidth) element.classList.add("offscreenL");
        else element.classList.add("offscreenR")
        await sleep(30);
    }

    await sleep(2000);
    
    for (element of els) {
        element.parentElement.removeChild(element);
    }
}

let creatable = 0;
let elements = [];
let underlined = [];
let combinations = {}; get_combinations();
let created = ["earth", "fire", "water", "air"]
let hide_items = false;

// Dragging
let mx = 0;
let my = 0;
let smx = 0;
let smy = 0;
let original_positions = [];
let ctrl = false;
let selected = null;
let offX = 0;
let offY = 0;
let canvas = document.getElementsByClassName("canvas")[0];
let counter = document.getElementsByClassName("counter")[0];
let sidebar = document.getElementsByClassName("sidebar")[0];
let query = "";
let queue = new ToastQueue();
let achievements = new AchievementHandler(queue);
let element_handler = new ElementHandler();
let bold = [];
let hidden = [];

// Must be in pixels.
document.documentElement.style.setProperty("--canvas-width", String(Math.round(window.innerWidth * 0.75)) + "px");

function get_value(string) {
            return parseInt(string.replace("px", ""));
}

function order(sidebar) {
    let elements = [...sidebar.children].slice(2);
    
    elements.sort(function(a, b) {
        return a.innerHTML == b.innerHTML ? 0 : (a.innerHTML > b.innerHTML ? 1 : -1);
    });
    
    for (child of [...sidebar.children].slice(2)) {
        sidebar.removeChild(child);
    }

    for (el of elements) {
        if (underlined.includes(el.innerText)) {
            el.classList.add("final");
        } else if (bold.includes(el.innerText)) {
            el.classList.add("important");
        }
        if ((hide_items && el.classList.contains("final")) || !el.innerText.includes(query)) el.style.display = "none";
        if (el.innerText.length > 36) {
            el.style.width = "90%";
        }

        sidebar.appendChild(el);
    }

    update_counter();
}

function is_overlapping(el1, el2) {
    // rect1 = {
    //     left: get_value(el1.style.left),
    //     right: get_value(el1.style.left) + el1.clientWidth,

    //     top: get_value(el1.style.top),
    //     bottom: get_value(el1.style.top) + el1.clientHeight
    // };
    
    // rect2 = {
    //     left: el2.offsetLeft,
    //     right: el2.offsetLeft + el2.clientWidth,

    //     top: el2.offsetTop,
    //     bottom: el2.offsetTop + el2.clientHeight
    // };

    rect1 = el1.getBoundingClientRect();
    rect2 = el2.getBoundingClientRect();

    
    var overlap = !(rect1.right < rect2.left || 
        rect1.left > rect2.right || 
        rect1.bottom < rect2.top || 
        rect1.top > rect2.bottom);

    if (overlap) {
        if (`${el1.innerText} + ${el2.innerText}` in combinations) {
            el2.parentElement.removeChild(el2);
            let offL = el.offsetLeft;
            let offT = el.offsetTop;
            el1.parentElement.removeChild(el1);
            
            to_create = combinations[`${el1.innerText} + ${el2.innerText}`].split(" + ");
            for (element of to_create) {
                let el = document.createElement("div");
                el.className = "element";
                el.innerText = element;
                el.style.left = String(offL + generate_random_offset(to_create.length)) + "px";
                el.style.top = String(offT + generate_random_offset(to_create.length)) + "px";
                el.id = String(++id);
                if (underlined.includes(el.innerText)) el.classList.add("final");
                else if (bold.includes(el.innerText)) el.classList.add("important");
                if (!element_handler.add(element, offL, offT)) canvas.appendChild(el);
                
                if (!created.includes(el.innerText)) {
                    created.push(el.innerText);
                    let sidebar_element = document.createElement("li");
                    sidebar_element.className = "displayelement";
                    if (el.classList.contains("final")) {
                        sidebar_element.classList.add("final");
                    }
                    if ((hide_items && el.classList.contains("final")) || !el.innerText.includes(query)) sidebar_element.style.display = "none";
                    sidebar_element.innerText = element;
                    if (sidebar_element.innerText.length > 36) {
                        sidebar_element.style.width = "90%";
                    }
                    sidebar.appendChild(sidebar_element);
                    order(sidebar);
                }
            }
            return [true, true];
        } else if (`${el2.innerText} + ${el1.innerText}` in combinations) {
            el2.parentElement.removeChild(el2);
            let offL = el.offsetLeft;
            let offT = el.offsetTop;
            el1.parentElement.removeChild(el1);
            
            to_create = combinations[`${el2.innerText} + ${el1.innerText}`].split(" + ");
            for (element of to_create) {
                let el = document.createElement("div");
                el.className = "element";
                el.innerText = element;
                el.style.left = String(offL + generate_random_offset(to_create.length)) + "px";
                el.style.top = String(offT + generate_random_offset(to_create.length)) + "px";
                el.id = String(++id);
                if (underlined.includes(el.innerText)) el.classList.add("final");
                else if (bold.includes(el.innerText)) el.classList.add("important");
                if (!element_handler.add(element, offL, offT)) canvas.appendChild(el);
                if (!created.includes(el.innerText)) {
                    created.push(el.innerText);
                    let sidebar_element = document.createElement("li");
                    sidebar_element.className = "displayelement";
                    if (el.classList.contains("final")) {
                        sidebar_element.classList.add("final");
                    }
                    if ((hide_items && el.classList.contains("final")) || !el.innerText.includes(query)) sidebar_element.style.display = "none";
                    sidebar_element.innerText = element;
                    if (sidebar_element.innerText.length > 36) {
                        sidebar_element.style.width = "90%";
                    }
                    sidebar.appendChild(sidebar_element);
                    update_counter();
                    order(sidebar);
                }
            }
            return [true, true];            
        }
        return [true, false];
    }
    return [false, false];
}

document.addEventListener("keydown", (e) => {
    if (e.target.classList.contains("search")) return;
    
    else if (e.key === "Escape") {
        get_combinations();
        clear_canvas();
    } else if (e.key === "p") {
        if (!confirm("Populate?")) return
        populate();
    } else if (e.key === "c") {
        if (!confirm("Cheat?")) return
        cheat();
    }
});

document.addEventListener("keyup", (e) => {
    if (e.key === "Control") {
        ctrl = false;
        canvas.style.cursor = "";
    }
});

document.addEventListener("mousemove", (e) => {
    mx = e.x;
    my = e.y;

    ctrl = e.ctrlKey;
    if (ctrl) canvas.style.cursor = "pointer";
    else canvas.style.cursor = "";

    if (selected) {
        if (selected.classList.contains("canvas")) {
            dx = mx - smx;
            dy = my - smy;
            let i = 0;
            for (el of document.querySelectorAll(".element")) {
                el.style.left = String(original_positions[i][0] + dx) + "px";
                el.style.top = String(original_positions[i][1] + dy) + "px";
                i += 1
            }
        } else {
            selected.style.left = String(mx + offX) + "px";
            if (selected.classList.contains("element")) selected.style.top = String(my + offY) + "px";
            else document.documentElement.style.setProperty("--canvas-width", String(mx) + "px");
        }
    }
})

document.addEventListener("mousedown", (e) => {
    if (e.target.classList.contains("element")) { // || e.target.classList.contains("scroll")
        selected = e.target;
        smx = mx;
        smy = my;
        offX = e.target.offsetLeft - mx;
        offY =  e.target.offsetTop - my;
        e.target.classList.add("selected");
    }

    else if (e.target.classList.contains("displayelement")) {
        let element = document.createElement("div")
        element.style = e.target.style;
        element.className = "element selected";
        if (e.target.classList.contains("final")) {
            element.classList.add("final");
        }
        element.innerText = e.target.innerText;
        selected = element;
        element.style.left = String(mx) + "px";
        element.style.top  = String(my) + "px";
        offX = e.target.offsetLeft + get_value(getComputedStyle(document.documentElement).getPropertyValue("--canvas-width")) - mx;
        offY =  -e.target.clientHeight / 2;
        
        element.id = String(++id);
        if (e.target.classList.contains("important")) element.classList.add("important");
        canvas.appendChild(element);
        // Note to future me:
        // Element should not be added to handler as this is pulling from the sidebar.
    }

    else if (e.target.classList.contains("canvas") && ctrl) {
        smx = mx;
        smy = my;
        selected = e.target;
        original_positions = []
        for (el of document.querySelectorAll(".element")) {
            original_positions.push([el.offsetLeft, el.offsetTop]);
            el.classList.add("selected");
        }
    }
});

document.addEventListener("mouseup", (e) => {
    if (selected) {
        if (selected.classList.contains("element")) {
            selected.classList.remove("selected");
            let posX = mx + offX + (selected.clientWidth / 2);
            if (posX > get_value(getComputedStyle(document.documentElement).getPropertyValue('--canvas-width'))) {
                selected.parentElement.removeChild(selected);
            } else {
                created_new = false;
                contacted = [];
                for (el of document.querySelectorAll(".element")) {
                    if (el != selected) {
                        let [overlapped, created_element] = is_overlapping(el, selected);
                        if (overlapped) {
                            if (created_element) {
                                created_new = true;
                                break;
                            } else {
                                contacted.push(el);
                            }
                        }
                    }
                }

                if (!created_new && contacted.length >= 2) {
                    contacted.push(selected);
                    contactedE = contacted.map((e) => e.innerText);
                    contactedE = contactedE.sort();
                    offL = contacted[0].offsetLeft;
                    offT = contacted[0].offsetTop;
                    
                    if (contactedE.join(" + ") in combinations) {
                        for (el of contacted) {
                            el.parentElement.removeChild(el);
                        }

                        to_create = combinations[contactedE.join(" + ")].split(" + ");
                        for (element of to_create) {
                            let el = document.createElement("div");
                            el.className = "element";
                            el.innerText = element;
                            el.style.left = String(offL + generate_random_offset(to_create.length)) + "px";
                            el.style.top = String(offT + generate_random_offset(to_create.length)) + "px";
                            el.id = String(++id);
                            if (underlined.includes(el.innerText)) el.classList.add("final");
                            if (bold.includes(el.innerText)) el.classList.add("important");
                            if (!element_handler.add(element, offL, offT)) canvas.appendChild(el);
                            if (!created.includes(el.innerText)) {
                                created.push(el.innerText);
                                let sidebar_element = document.createElement("li");
                                sidebar_element.className = "displayelement";
                                if (el.classList.contains("final")) {
                                    sidebar_element.classList.add("final");
                                }
                                if (hide_items || !el.innerText.includes(query)) sidebar_element.style.display = "none";
                                sidebar_element.innerText = element;
                                if (sidebar_element.innerText.length > 36) {
                                    sidebar_element.style.width = "90%";
                                }
                                sidebar.appendChild(sidebar_element);
                                update_counter();
                                order(sidebar);
                            }
                        }
                    }
                } else if (contacted.length == 0 && !created_new && smx == mx && smy == my) {
                    let el = selected.cloneNode();
                    el.innerText = selected.innerText;
                    canvas.appendChild(el);
                }
            }
        } else if (selected.classList.contains("canvas")) {
            for (el of document.querySelectorAll(".element")) {
                el.classList.remove("selected");
            }
        }

        // else if (selected.classList.contains("scroll")) {
        //     [...document.querySelectorAll(".element")].forEach(e => {
        //         if (e.offsetLeft + (e.clientWidth / 2) > selected.offsetLeft) {
        //             e.parentElement.removeChild(e);
        //         }
        //     });
        // }
        
        selected = null;
    }
})

// Other

async function main() {
    while (creatable == 0) await sleep(1000);
    update_counter();

    if (localStorage.getItem("save")) {
        queue.add("To load your save, click load save.");
    }

    document.getElementsByClassName("logo")[0].classList.add("inactive");
    document.getElementsByClassName("logotitle")[0].classList.add("inactive");
    await sleep(1000);
    document.querySelector("body > div.clear-canvas").classList.replace("active", "inactive");
    
    while (true) {
        await sleep(1000);
        document.documentElement.style.setProperty("--canvas-width", String(Math.round(window.innerWidth * 0.75)) + "px");
        achievements.check();
    }
}

async function cheat(item) {
    achievements.disable();
    queue.add("Achievements disabled.");
    if (!item) {
        for (el of elements) {
            if (!created.includes(el)) {
                created.push(el);
                let li = document.createElement("li");
                li.className = "displayelement";
                li.innerText = el;
                if (underlined.includes(el)) {
                    li.className = "displayelement final"; 
                    await sleep(1);
                }
                if ((hide_items && li.classList.contains("final")) || !li.innerText.includes(query)) li.style.display = "none";;
                if (li.innerText.length > 36) {
                    li.style.width = "90%";
                }
                sidebar.appendChild(li);
                order(sidebar);    
            }
        }
    } else {
        let li = document.createElement("li");
        li.className = "displayelement";
        li.innerText = item;
        if (underlined.includes(item)) li.className = "displayelement final";
        if (li.innerText.length > 36) {
            li.style.width = "90%";
        }
        sidebar.appendChild(li);
        if ((hide_items && li.classList.contains("final")) || !li.innerText.includes(query)) li.style.display = "none";;    
        order(sidebar);
    }
}

document.getElementsByClassName("loadsave")[0].onclick = (e) => {
    let raw_string = localStorage.getItem("save");
    while (raw_string.charAt(0) == "&") raw_string = raw_string.slice(1);
    if (created.length > 4 && !confirm("Load save? (This cannot be undone)")) return;
    if (raw_string) {
        let cancel = false;
        if (localStorage.getItem("ach")) {
            let achievements_unlocked = localStorage.getItem("ach").split(";");
            achievements.unlocked = achievements_unlocked;

            if (localStorage.getItem("achE")) {
                achievements.unlockedE = localStorage.getItem("achE").split(";");
                achievements.filter(false);
            } else achievements.filter(true);
        } else {
            localStorage.setItem("ach", "");
            cancel = true;
        }
        
        let created_elements = raw_string.split("&");
        let to_create = [];
        created = ["air", "water", "earth", "fire"];
        
        for (element of created_elements) {
            if (k_from_v(combinations, element) || created.includes(element)) {
                if (!created.includes(element)) created.push(element);
                to_create.push(element);
            }
        }    

        // achievements.unregister_below();
        
        created_elements = to_create.map(function (e) {
            let li = document.createElement("li");
            li.className = "displayelement";
            if (underlined.includes(e)) li.className = "displayelement final";
            li.innerText = e;
            return li;
        });
    
        // sidebar.innerHTML = "<input type='checkbox' class='hidefinal' checked>";
        // if (!hide_items) sidebar.firstChild.checked = false;
        // document.getElementsByClassName("hidefinal")[0].onchange = async function(e) {
        //     if (e.target.checked) {
        //         for (element of document.querySelectorAll(".displayelement.final")) {
        //             element.style.display = "block";
        //         }
        //     } else {
        //         for (element of document.querySelectorAll(".displayelement.final")) {
        //             element.style.display = "none";
        //         }
        //     }
        // }

        for (el of [...sidebar.children].slice(2)) {
            el.parentElement.removeChild(el);
        }
        
        for (element of created_elements) {
            if ((hide_items && element.classList.contains("final")) || !element.innerText.includes(query)) element.style.display = "none";
            if (element.innerText.length > 36) {
                element.style.width = "90%";
            }
            sidebar.appendChild(element);
        }

        for (el of document.querySelectorAll(".canvas > .element")) el.parentElement.removeChild(el);

        raw_string = get_save_code();
        localStorage.setItem("save", raw_string); // Remove possible duplicates

        if (cancel) queue.cancel_toast();
    }

    order(sidebar);
}

function get_save_code() {
    created_elements = [...sidebar.children].slice(2);
    created_elements = created_elements.map((e) => e.innerText);
    raw_string = created_elements.join("&");
    return raw_string
}

document.getElementsByClassName("save")[0].onclick = (e) => {
    raw_string = get_save_code();
    raw_achievements = achievements.unlocked.join(";");
    raw_achievementsE = achievements.unlockedE.join(";");
    localStorage.setItem("save", raw_string);
    localStorage.setItem("ach", raw_achievements);
    localStorage.setItem("achE", raw_achievementsE);
    queue.add("Saved!");
}

document.getElementsByClassName("deletesave")[0].onclick = (e) => {
    if (confirm("Delete save? (This cannot be undone!)")) {
        localStorage.removeItem("save");
        queue.add("Save deleted!");
    }
}

window.onload = (e) => {
    if (getCookie("save")) {
        localStorage.setItem("save", getCookie("save"));
        document.cookie="save=;";
        queue.add("Migrated from cookies to localstorage.");
    }
}

window.addEventListener("beforeunload", function (e) {
    if (created.length != 4 && ((!localStorage.getItem("save") && created.length > 4) || (localStorage.getItem("save") != get_save_code()))) (e || window.event).returnValue = true;
});

document.getElementsByClassName("hidefinal")[0].onchange = async function(e) {
    hide_items = !hide_items;
    if (e.target.checked) {
        for (element of document.querySelectorAll(".displayelement.final")) {
            if (element.innerText.includes(query)) element.style.display = "block";
        }
    } else {
        for (element of document.querySelectorAll(".displayelement.final")) {
            element.style.display = "none";
        }
    }
}

document.getElementsByClassName("search")[0].oninput = function (e) {
    query = e.target.value;
    
    for (el of [...sidebar.children].slice(2)) {
        if (!el.innerText.includes(query)) {
            el.style.display = "none";
        } else if ((el.classList.contains("final") && !hide_items) || !el.classList.contains("final")) {
            el.style.display = "block";
        }
    }
}

async function register_achievements() {
    while (creatable == 0) await sleep(1);
    // achievements.register(count, name, explanation);
    achievements.register(5, "Baby Steps", "Your first element!");
    achievements.register(29, "Getting Started", "You created 25 elements");
    achievements.register(54, "Getting Going", "You created 50 elements!");
    achievements.register(104, "Dedicated", "100 elements in and still going strong!");
    achievements.register(204, "Getting Serious", "200 elements! Congratulations!");
    achievements.register(304, "Serious", "300 elements... Incredible.");
    achievements.register(404, "Getting unhealthy", "400 elements... Too many.");
    achievements.register(creatable, "Unhealthy", "You've completed the game... or cheated.");

    // achievements.register_complex(items (+ sep), name, explanation);
    achievements.register_complex("HAS pneumonoultramicroscopicsilicovolcanoconiosis + allergy + coronavirus", "Pathologist", "Call the CDC!");    
    
    achievements.register_complex("TIME 1800000", "Time flies like an arrow", "You've spent 30 minutes straight on the game.", true);
    achievements.register_complex("TIME 3600000", "Don't forget to save!", "You've been playing the game for a whole hour!", true);
    achievements.register_complex("TIME 7200000", "You should seriously take a break", "2 hours on this game is far too long.", true);



    element_handler.add_special("dead bacteria", "antibiotic resistant bacteria", (count) => count >= 5, true);
}

function update_counter() {
    counter.innerText = `${sidebar.children.length - 6} / ${creatable - 4}`;
    // achievements.check();
}

function getCookie(name) { // compatability
    const value = `; ${document.cookie}`;
    const parts = value.split(`; ${name}=`);
    if (parts.length === 2) return parts.pop().split(';').shift();
}

async function show_help() {
    let toast = document.querySelector("body > div.large-toast");
    let ccanvas = document.querySelector("body > div.clear-canvas");

    toast.innerHTML = 'Welcome to Little Archiemy!<br>The game works by combining two (or more) elements in order to create something new. Combine elements by dragging them over one another.<br><u><i>Underlined</i></u> elements are final elements. These are elements which you cannot create anything new with.<br><b>Bold</b> elements are important elements. These are elements which you will use for many recipes.<br>Useful shortcuts:<br><br>- To clear the canvas, press escape.<br>- To move the canvas, hold ctrl and drag on the background.<br>- To hide final items, uncheck the checkbox in the sidebar.<br><p onclick="show_help();">[Got it!]</p> <a href="static/txt/changelog.txt" target="_blank" onclick="show_help();">[View Changelog]</a><p onclick="convert_code();">[Convert old save code to new]</p><p onclick="get_code();">[Get save code]</p><p onclick="load_from_code();">[Load from save code]</p>';

    if (toast.classList.contains("inactive")) {
        ccanvas.classList.toggle("active");
        ccanvas.classList.toggle("inactive");
        await sleep(1000);
        toast.classList.toggle("active");
        toast.classList.toggle("inactive");
    } else {
        toast.classList.toggle("active");
        toast.classList.toggle("inactive");
        await sleep(1000);
        ccanvas.classList.toggle("active");
        ccanvas.classList.toggle("inactive");
    }
}

async function show_list() {
    let toast = document.querySelector("body > div.large-toast");
    let ccanvas = document.querySelector("body > div.clear-canvas");
    let ach_string = "";
    for (let i = 0; i < achievements.unlocked.length; i++) {
        ach_string += "• " + achievements.unlocked[i] + ": ";
        ach_string += achievements.unlockedE[i] + "<br>";
    }

    if (!ach_string) {
        ach_string = "Nothing here yet... Start making some stuff!<br>";
    }
    
    toast.innerHTML = "Unlocked achievements:<br>" + ach_string + "<p onclick='show_list();'>[Got it!]</p>";

    if (toast.classList.contains("inactive")) {
        ccanvas.classList.toggle("active");
        ccanvas.classList.toggle("inactive");
        await sleep(1000);
        toast.classList.toggle("active");
        toast.classList.toggle("inactive");
    } else {
        toast.classList.toggle("active");
        toast.classList.toggle("inactive");
        await sleep(1000);
        ccanvas.classList.toggle("active");
        ccanvas.classList.toggle("inactive");
    }
}

function get_code() {
    let items = LZW.compress(get_save_code()).map(e => to_b62(e)).join("");
    let ach = LZW.compress(achievements.unlocked.join("&")).map(e => to_b62(e)).join("");
    let achE = LZW.compress(achievements.unlockedE.join("&")).map(e => to_b62(e)).join("");

    if (confirm("Save code to clipboard?")) {
        copy([items, ach, achE].join(";"));
    } else {
        return [items, ach, achE].join(";");
    }
}

function split2(arr) {
    arr2 = [];
    for (let i = 0; i < arr.length; i++) {
        if (i % 2 == 0) {
            arr2.push(`${arr[i]}`);
        } else {
            arr2[arr2.length - 1] += arr[i];
        }
    }

    return arr2;
}

async function load_from_code() {
    let toast = document.querySelector("body > div.large-toast");
    let ccanvas = document.querySelector("body > div.clear-canvas");
    
    if (toast.classList.contains("inactive")) {
        ccanvas.classList.toggle("active");
        ccanvas.classList.toggle("inactive");
        await sleep(1000);
        toast.classList.toggle("active");
        toast.classList.toggle("inactive");
    } else {
        toast.classList.toggle("active");
        toast.classList.toggle("inactive");
        await sleep(1000);
        ccanvas.classList.toggle("active");
        ccanvas.classList.toggle("inactive");
    }
    
    let save_code = prompt("Save code: ");
    let [save, ach, achE] = save_code.split(";");
    let save_arr = split2(save).map(e => to_b10(e));
    let raw_string = LZW.decompress(save_arr);
    let elements = raw_string.split("&");

    // Add elements
    let created_elements = raw_string.split("&");
    let to_create = [];
    created = ["air", "water", "earth", "fire"];
    
    for (element of created_elements) {
        if (k_from_v(combinations, element) || created.includes(element)) {
            if (!created.includes(element)) created.push(element);
            to_create.push(element);
        }
    }
    
    created_elements = to_create.map(function (e) {
        let li = document.createElement("li");
        li.className = "displayelement";
        if (underlined.includes(e)) li.className = "displayelement final";
        li.innerText = e;
        return li;
    });

    for (el of [...sidebar.children].slice(2)) {
        el.parentElement.removeChild(el);
    }
    
    for (element of created_elements) {
        if ((hide_items && element.classList.contains("final")) || !element.innerText.includes(query)) element.style.display = "none";
        if (element.innerText.length > 36) {
            element.style.width = "90%";
        }
        sidebar.appendChild(element);
    }

    for (el of document.querySelectorAll(".canvas > .element")) el.parentElement.removeChild(el);

    raw_string = get_save_code();
    localStorage.setItem("save", raw_string); // Remove possible duplicates
    cancel = true;
    
    if (ach) {
        let ach_arr = split2(ach).map(e => to_b10(e));
        let achE_arr = split2(achE).map(e => to_b10(e));
        
        achievements.unlocked = LZW.decompress(ach_arr).split("&");
        achievements.unlockedE = LZW.decompress(achE_arr).split("&");
        
        achievements.filter(false);
        cancel = false;
    }
    
    if (cancel) queue.cancel_toast();
    order(sidebar);
}

function copy(text) {
    var input = document.createElement("input");
    document.body.appendChild(input);

    input.addEventListener("focus", function (e) {
        e.preventDefault();
    });

    input.value = text;
    input.select();

    navigator.clipboard.writeText(input.value);
    document.body.removeChild(input);
}

register_achievements();
main();

function convert_code() {
    let old_code = prompt("Current save code?");
    let arr = old_code.split(";");
    if (Number(arr[0]) && Number(arr[1])) {
        arr = arr.map(e => e ? to_b62(parseInt(e)) : ";");
        if (confirm("Copy to clipboard?")) copy(arr.join(""));
    } else if (old_code.includes("a") && !old_code.includes("A")) {
        arr = arr.map(e => e ? to_b62(parseInt(e, 36)) : ";");
        if (confirm("Copy to clipboard?")) copy(arr.join(""));
    } else {
        alert("Save code already up to date!");
    }
}