# A tiny CLI logging library.

A lightweight, worry-free and colourful logging module for console applications which supports logging to STDOUT/STDERR and a JSON file.

Built for intuitive usage and a neat and helpful look in the terminal.

![](https://static.mo-mar.de/mulog.png)

```javascript
const mulog = require("mulog");
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
})

// Tags
{
    // Tags (recommended syntax for tagging full files/modules)
    const µ = mulog.get().tag("hello world");
    µ.info("Now listening on localhost:8000");

    // Nested tags and chained tag syntax
    µ.tag("requests").verbose("[404] /hello-world.txt");
}

// Wrapping
µ("This is a very long piece of text which will probably wrap because your console can't possibly be as long as this text. Or can it? We don't know, maybe you have a 4K screen and work with the smallest font size possible. In that case I'd recommend resizing the console window. " + require("colors/safe").yellow.bold("Anyways, µlog even makes sure that even colored text is wrapped correctly and keeps its color when wrapped."));
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
    logfile: {
        path: null, //"logfile.json",
        verbosity: 100
    },
    eyes: { /* Configuration for https://npmjs.com/package/eyes */ }
});
```

### Available styles

![](https://static.mo-mar.de/mulog-styles.png)

## Roadmap

- textfile logging
- ~syslog integration~ (this needs to be done by the process manager, e.g. Docker or SystemD)
- CLI to view JSON log files, with filtering
- proxy to different logging framework if used in a module (e.g. `global.µ = mulog.proxy("winston", winston)`, maybe even with autodetection if possible (?))
