# A tiny CLI logging library.

A lightweight, worry-free and colourful logging module for console applications which supports logging to STDOUT/STDERR, a JSON-like log file or a plain text file.

Built for intuitive usage and a neat and helpful look in the terminal.

## Features
- Beautify objects and errors
- Print buffers as hex dump
- Tagging
- Show timestamps and the related source file
- Easily debug promises
- Simple timing support for messages, functions and promises
- Full color support
- Log to console (with support for `-v`/`-q` arguments) or to a file

![](https://static.mo-mar.de/mulog.png)
![](https://static.mo-mar.de/mulog-buffer.png)
![](https://static.mo-mar.de/mulog-timer.png)

```javascript
const mulog = require("mulog");
mulog.get({file:"log.txt"}) // How to set a file/change other configuration options.
const µ = mulog.get(); // Use mulog as a singleton; recommended.
// const µ = new mulog(); // Use mulog as an object.

// Basic usage
µ("Hello World");
µ.info("This is mulog, a really simple but beautiful logging library.");
µ.error("Something went wrong");
µ.warn("This is your first warning");
µ.success("The action has been completed successfully.");
µ.log("µ.log('...') is the same as µ('...')") // µlog is also chainable
 .verbose("Something less important")
 .debug("Some debug message nobody wants to read");

// Advanced stuff to log
µ("The current year is", new Date().getFullYear());
µ("Use " + require("colors/safe").red("colored text") + " from any library you like, and display beautifully formatted...", {
    "Objects": "like this one!",
    "Some stuff": 5,
    Whatever: true,
    fancy: function() { console.log("Hello World"); }
});
µ.hex("Hell\000\001World"); // hex dump, always printed on debug level

{
    // Tags (recommended syntax for tagging full files/modules)
    const µ = mulog.get().tag("hello world");
    µ.info("Now listening on localhost:8000");

    // Nested tags and chained tag syntax
    µ.tag("requests").verbose("[404] /hello-world.txt");
}

const doSomething = () => {a = 1; for (let i = 0; i < 1000000000000 * Math.random(); i++) { a = a * i; }; return a};
const doPromise = () => new Promise((resolve, reject) => setTimeout(() => Math.random() > 0.5 ? resolve("Success!") : reject(new Error("Alea iacta est")), 600));

// Promises
µ(doPromise());

// Timing (short)
µ.timer().debug(doSomething());

// Timing (as instance)
const t = µ.timer();
t.debug("Something...");
doSomething();
t.debug("...happened!");
```

## Default configuration
```javascript
const mulog = require("mulog");
const µ = mulog.get({ // Config is only applied on first initialization.
    levels: mulog.styles.DEFAULT,
    console: {
        colors: true,
        utc: true, // local timezone if false
        
        //   1   ->   2  ->    3    ->   4  ->  5  ->    6    ->   7
        // error -> warn -> success -> info -> log -> verbose -> debug
        verbosity: 5,
        respectVerbosityArgs: true, // Respect command line arguments in the format -v/-q/-vvv/-qqq/...
        
        wrap: true,
        hardWrap: false,
        indent: true
    },
    file: { // Text file output
        path: null, //"logfile.txt",
        verbosity: 100
    },
    logfile: { // JSON file output
        path: null, //"logfile.json",
        verbosity: 100
    },
    eyes: { /* Configuration for https://npmjs.com/package/eyes */ }
});
```

### Available styles

![](https://static.mo-mar.de/mulog-styles.png)

## Roadmap

- CLI to view JSON log files, with filtering
- proxy to different logging framework if used in a module (e.g. `global.µ = mulog.proxy("winston", winston)`, maybe even with autodetection if possible (?))
- ~~syslog integration~~ (this needs to be done by the process manager, e.g. Docker or SystemD)
