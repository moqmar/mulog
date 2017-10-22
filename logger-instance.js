// Base tools
const fs = require("fs");

// Beautification
const eyes = require("eyes");

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
          verbosity: 4,
          wrap: true,
          hardWrap: false,
          indent: true,
          ...config.console
        },
        logfile: {
          path: null, //"logfile.json",
          verbosity: 6,
          ...config.logfile
        },
        eyes: {
          ...config.eyes
        }
        //syslog: {
        //},
        
    }
    
    this.config.levelsByName = this.config.levels.reduce((o,c) => { o[c.name] = c; return o }, {});
    this.config.defaultLevel = (this.config.levels.filter(l => l.default)[0] || this.config.levels[0]).name;

    if (this.config.logfile.path) {
        this.logfile = fs.createWriteStream(this.config.logfile.path, { mode: parseInt("600", 8) });
    }

    this.eyes = eyes.inspector({
        maxLength: false,
        ...this.config.eyes,
        stream: null
    });
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
LoggerInstance.prototype.getOccurence = function getOccurence() {
    return (new Error().stack.split("\n")[3] || "").replace(/^.*[\/\(]([^\/\(\)]+)\)?$/, "$1"); //@TODO Better RegExp
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

    }

    return f;
}

module.exports = LoggerInstance;
