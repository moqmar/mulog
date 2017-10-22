const mulog = require(".");
const µ = new mulog();

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
µ("Use " + require("colors/safe").red("colored text") + " from any library you like, and display beautifully formatted", {
    "Objects": "like this one!",
    "Some stuff": 5,
    Whatever: true,
    fancy: function() { console.log("Hello World"); }
})

// Tags
const log = µ.tag("server");
log.info("Now listening on localhost:8000");

// Nested tags
log.tag("requests").verbose("[404] /hello-world.txt");

// Alternative tagging syntax
const log2 = new µ("tag");
log2.log("Good morning alternative world!");

// Wrapping
µ("This is a very long piece of text which will probably wrap because your console can't possibly be as long as this text. Or can it? We don't know, maybe you have a 4K screen and work with the smallest font size possible. In that case I'd recommend resizing the console window. " + require("colors/safe").yellow.bold("Anyways, µlog even makes sure that even colored text is wrapped correctly and keeps its color when wrapped."));
