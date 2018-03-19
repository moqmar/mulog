// Base tools
const fs = require("fs");

// Beautification
const eyes = require("eyes");
const colors = require("colors/safe");
const hexer = require("hexer");

/**
 * Constructor for a new LoggerInstance
 * @param {*} config  The configuration object for the LoggerInstance
 */
function LoggerInstance(config = {}) {
    if (!new.target) throw new Error("µlog: LoggerInstance must be called with the keyword `new`");

    this.config = {
        levels: config.levels || require("./index").styles.DEFAULT,
        console: {
          colors: true,
          utc: true,
          verbosity: 5,
          respectVerbosityArgs: true,
          wrap: true,
          hardWrap: false,
          indent: true
        },
        logfile: {
          path: null, //"logfile.json",
          verbosity: 100
        },
        eyes: {}
        //syslog: {
        //},

    }

    for (i in config.console) this.config.console[i] = config.console[i];
    for (i in config.logfile) this.config.logfile[i] = config.logfile[i];
    for (i in config.eyes) this.config.eyes[i] = config.eyes[i];

    if (this.config.console.verbosity > this.config.levels.length) this.config.console.verbosity = this.config.levels.length;
    if (this.config.console.respectVerbosityArgs) {
        for (var i = 1; i < process.argv.length; i++) {
            if (process.argv[i].match(/^-v+$/)) this.config.console.verbosity += process.argv[i].length - 1;
            if (process.argv[i].match(/^-q+$/)) this.config.console.verbosity -= process.argv[i].length - 1;
        }
    }

    this.config.levelsByName = this.config.levels.reduce((o,c) => { o[c.name] = c; return o }, {});
    this.config.defaultLevel = (this.config.levels.filter(l => l.default)[0] || this.config.levels[0]).name;

    if (this.config.logfile.path) {
        this.logfile = fs.createWriteStream(this.config.logfile.path, { mode: parseInt("600", 8) });
    }

    let eyesConfig = {
        maxLength: false
    }
    for (i in this.config.eyes) eyesConfig[i] = this.config.eyes[i];
    eyesConfig.stream = null;

    this.eyes = eyes.inspector(eyesConfig);
    this.eyesWrapper = function(what) {
        // Workaround to not break eyes, for consistent coloring (cyan!)
        const f1 = eyes.stylize;
        const f1s = f1.toString();
        const f2 = new Function("str", "style", "styles", (f1s.substring(f1s.indexOf("{") + 1, f1s.lastIndexOf("}"))).replace(/\+ endCode \+/, "+ 0 +"));
        eyes.stylize = f2;
        const result = this.eyes(what);
        eyes.stylize = f1;
        return result;
    }
}

/**
 * Get the file, line and column from which the log function was called
 */
LoggerInstance.prototype.getOccurence = function getOccurence(n) {
    return (new Error().stack.split("\n")[3+(n||0)] || "").replace(/^.*[\/\(]([^\/\(\)]+)\)?$/, "$1"); //@TODO Better RegExp
}

/**
 * Create a new derivation (log function with bound object) from a LoggerInstance.
 * @param {*} data       The object to bind to the function
 * @param {*} recursive  Include derivations for all levels (.log, .info, .error, ...) and other data needed for a full logger object.
 */
LoggerInstance.prototype.createDerivation = function createDerivation(data, recursive = false) {
    let o = {
        instance: this,
        tags: data.tags || [],
        level: data.level || undefined,
        self: undefined
    };
    let f = require("./index").bind(o);
    o.self = data.self || f;

    if (recursive) {
        f.instance = this;
        f.tags = data.tags || [];

        // Initialize logger functions (like log.info())
        for (let level in this.config.levels) {
            if (f[this.config.levels[level].name]) continue;
            f[this.config.levels[level].name] = this.createDerivation({ level: this.config.levels[level].name, tags: f.tags, self: f });
        }

        // Derive an instance with tags added
        f.tag = function tag(...tags) {
            return this.instance.createDerivation({ tags: [...this.tags, ...tags] }, true);
        }

        f.hex = function hex(b) {
            return this.debug(colors.bold(Object.prototype.toString.call(b).replace(/^\[object |\]$/g, "")) + ":\n" + hexer(b, {
                colored: true,
                group: 1,
                nullHuman: true,
                headSep: " \033[0m ",
                prefix: " \033[45m "
            }) + "\n    ");
        }
    }

    return f;
}

module.exports = LoggerInstance;
