/**
 * A module.
 */

// Base tools
const eol = require("os").EOL;

// Beautification
const colors = require("colors/safe");

// For unicode and word wrapping
const stringWidth = require("string-width");
const wrapAnsi = require("wrap-ansi");
const stripAnsi = require("strip-ansi");

// Internal modules
const LoggerInstance = require("./logger-instance");

// Leftpad - P(value, length, character, rightpad) - https://gist.github.com/moqmar/9ef4f0755d0a17b61458f35b91447bc1
function P(v,l,c,r) { v = v.toString(); while (v.length < l) v = r ? v + (c||0) : (c||0) + v; return v; }


/**
 * Format a message object for display on a TTY
 * @param {*} message  The message object to display
 * @param {*} config   The configuration object of the µlog instance
 * @returns            The message as formatted text
 */
function formatMessage(message, config, raw) {
    const level = config.levelsByName[message.level];

    // Formatted UTC date
    const date = new Date(message.timestamp);
    let output = colors.gray.bold(
        P(date.getUTCFullYear(), 4) + "-" + P(date.getUTCMonth(), 2) + "-" + P(date.getUTCDate(), 2) + " " +
        P(date.getUTCHours(), 2) + ":" + P(date.getUTCMinutes(), 2) + ":" + P(date.getUTCSeconds(), 2) + " ");

    // Add symbol
    let notice = level.symbol;
    if (level.bold) notice = colors.bold(notice); // Make it bold if wanted
    if (level.color && colors[level.color]) notice = colors[level.color](notice);
    else if (!colors[level.color]) throw new Error("µlog: color for level " + level.name + " doesn't exist. See https://www.npmjs.com/package/colors for possible values")
    output += notice + " ";

    // Calculate width of metadata for wrapping and indentation
    const metaWidth = stringWidth(output);

    // Add tags, content and occurence
    let content = "";
    if (message.tags.length) content += colors.cyan.bold(message.tags.join(".")) + " ";
    content += message.message.split("\n").join("\n" + colors.reset(""));
    if (message.occurence) content += "  " + colors.gray("[" + message.occurence.replace(/:(?=\d+:\d+$)/, " ") + "]");

    // Wrap long lines
    const wrapWidth = (process.stdout.columns || 80) - metaWidth - 1;
    if (!raw && process.stdout.isTTY && config.console.wrap > 0) {
        // If everything's still readable (i.e. not 1 letter per line), wrap the text
        if (wrapWidth > metaWidth) content = wrapAnsi(content, wrapWidth, {
            hard: true,
            wordWrap: !config.console.hardWrap,
            trim: false
        });
    }

    // Indent line breaks
    if (process.stdout.isTTY && config.console.indent && wrapWidth > metaWidth) content = content.replace(/\n/g, "\n" + P("", metaWidth, " "));

    output += content;
    output = output.replace(/\r\n|\r|\n/g, eol) + eol; // Use system line breaks for everything

    if (raw) return stripAnsi(output);
    return output;
}


function simplifyError(error) {
    first = colors.dim(" (launch with ") + colors.dim(colors.bold("PRINT_STACK=full")) + colors.dim(" for more detail)");
    return colors.bold(colors.bgRed(error.message)) + error.stack
        .replace(/^[^\n]+(?:\n|$)/, "\n")
        .replace(/(\n\s*-+\n)/g, process.env.PRINT_STACK == "full" ? "$1" : "\n")
        .replace(/(?:\n[^\n]* \(((?:internal\/)?[^\/\n]+|[^\n]*\/node_modules\/[^\n]*)\))+/g, (...e) => {
            if (process.env.PRINT_STACK == "full") return e[0];
            e = e[0].split("\n").slice(1).map(x => x.match(/ \((.*)\)$/)[1]);
            let descriptions = {};
            for (let i = 0; i < e.length; i++) {
                let description = e[i].replace(/^.*\/node_modules\/([^\/]*).*$/, "$1");
                if (description == e[i]) {
                    description = e[i].match(/^(?:.*\/)?([^\/]*):\d+:\d+$/);
                    if (!description) description = e[i].match(/^.*\/([^\/]*):\d+$/);
                    if (!description) description = e[i].match(/^.*\/([^\/]*)$/);
                    if (!description) description = e[i];
                    else description = "node/" + description[1];
                }
                descriptions[description] = (descriptions[description] || 0) + 1;
            }
            e = [];
            for (var i in descriptions) {
                e.push(i + (descriptions[i] > 1 ? "[x" + descriptions[i] + "]" : ""));
            }

            const hint = first;
            if (first != "") first = "";
            return "\n" + colors.gray("     at " + e.join(", ")) + hint;
        })
        .replace(/^(\s*at )(\S+)( (?:\[.*\] )?\((?:[^\/\n]*\/)*)([^\n]*)(\))$/gm, colors.dim(" $1") + colors.bold("$2") + colors.dim("$3") + colors.bold("$4") + colors.dim("$5"));
}


function ResolvedPromise(result, occurence, rejected, now) { this.result = result; this.occurence = occurence; this.rejected = rejected; this.time = Date.now() - now; }
function resolvePromise(log, promise, occurence, error) {
    const now = Date.now();
    promise.then(result => log.self(new ResolvedPromise(result, occurence, false, now)), error => log.self(new ResolvedPromise(error, occurence, true, now)));
}


/**
 * The logging function. Must have a bound object (if it has one, the function object is called "derivation") with the following structure to work:
 *
 * ```javascript
 * {
 *     instance: LoggerInstance,
 *   [ level: "...", ]
 *   [ tags: [...], ]
 *     self: log.bind(this) // Currently called log function object for chaining
 * }
 * ```
 *
 * If called without such an object or with the keyword `new`, this creates a new µ logger object by acting as a constructor for a new `LoggerInstance` and returning a derivation of it.
 * @param {*} what  The logging data, one or more parameters
 */
function log(...what) {
    // [new] log(config)
    if (new.target || !this.instance) return new LoggerInstance(...what).createDerivation({}, true);

    // Get the level bound to the function object from the instance.
    const level = this.instance.config.levelsByName[this.level || this.instance.config.defaultLevel];
    if (!level) throw new Error("µlog: logging level doesn't exist");

    const promise = (what.length == 1 && what[0] instanceof ResolvedPromise) ? what[0] : null;

    if (this.timerStart) {
        const t = Date.now() - this.timerStart;
        if (t < 1000) what.unshift(colors.bold(colors.blue("[" + t + "ms]")));
        else if (t < 60*1000) what.unshift(colors.bold(colors.blue("[" + t/1000 + "s]")));
    else what.unshift(colors.bold(colors.blue("[" + Math.floor(t / 60000) + ":" + ((t / 1000) % 60).toString().replace(/(\.\d\d\d).*/, "$1") + "]")));
    }
    if (promise) what.unshift(colors.bold(colors.yellow("[Promise ") + colors[promise.rejected ? "red" : "green"](promise.rejected ? "× " : "✔ ") + colors.blue(promise.time + "ms") + colors.yellow("]")));

    // Build the message
    let message = {
        timestamp: Date.now(),
        level: level.name,
        verbosity: this.instance.config.levels.length - this.instance.config.levels.map(l => l.name).indexOf(level.name),
        message: [...what].map(x => {
            if (x instanceof ResolvedPromise) x = x.result;
            
            if (typeof x === "string") return x;
            if (x instanceof Error) return simplifyError(x);
            else if (x instanceof Buffer) return x.toString();
            else if (x instanceof Promise) { resolvePromise(this, x, this.instance.getOccurence(3), level.error); return colors.yellow(colors.bold("[Promise ?]")); }
            else return this.instance.eyesWrapper(x);
        }).join(" "),
        tags: this.tags || [],
        occurence: promise ? promise.occurence : this.instance.getOccurence()
    }

    // Write to logfile
    let line = JSON.parse(JSON.stringify(message));
    line.message = stripAnsi(message.message)
    if (this.instance.logfile && this.instance.config.logfile.verbosity >= message.verbosity) this.instance.logfile.write(JSON.stringify(line) + "\n");

    // Write to logdump
    if (this.instance.file && this.instance.config.file.verbosity >= message.verbosity) this.instance.file.write(formatMessage(message, this.instance.config, true));
    
    // Print to console
    if (this.instance.config.console.verbosity >= message.verbosity) (level.error ? process.stderr : process.stdout).write(formatMessage(message, this.instance.config));

    return this.self;
}

log.styles = {
    SIMPLE: [
        { name: "debug",   symbol: "[d]", color: "magenta", bold: true },
        { name: "verbose", symbol: "[…]", color: "gray",    bold: false },
        { name: "log",     symbol: "   ", color: "white",   bold: false, default: true },
        { name: "info",    symbol: "[i]", color: "blue",    bold: true },
        { name: "success", symbol: "[s]", color: "green",   bold: true },
        { name: "warn",    symbol: "[?]", color: "yellow",  bold: true, error: true },
        { name: "error",   symbol: "[!]", color: "red",     bold: true, error: true }
    ],
    DEFAULT: [
        { name: "debug",   symbol: "   debug:", color: "magenta", bold: true },
        { name: "verbose", symbol: " verbose:", color: "gray",    bold: false },
        { name: "log",     symbol: "     log:", color: "white",   bold: true, default: true },
        { name: "info",    symbol: "    info:", color: "blue",    bold: true },
        { name: "success", symbol: " success:", color: "green",   bold: true },
        { name: "warn",    symbol: " warning:", color: "yellow",  bold: true, error: true },
        { name: "error",   symbol: "   error:", color: "red",     bold: true, error: true }
    ],
    TRAFFICLIGHTS: [
        { name: "debug",   symbol: "  ", color: "bgMagenta", bold: true },
        { name: "verbose", symbol: "……", color: "gray",      bold: false },
        { name: "log",     symbol: "  ", color: "white",     bold: false, default: true },
        { name: "info",    symbol: "  ", color: "bgBlue",    bold: true },
        { name: "success", symbol: "  ", color: "bgGreen",   bold: true },
        { name: "warn",    symbol: "  ", color: "bgYellow",  bold: true, error: true },
        { name: "error",   symbol: "  ", color: "bgRed",     bold: true, error: true }
    ],
}

log.get = function get() {
    if (log.singleton === undefined) log.singleton = new log(...arguments);
    return log.singleton;
}

module.exports = log;
