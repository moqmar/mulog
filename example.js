const mulog = require(".");
global.µ = mulog.get(); // Only reinitialized if global.µ is unset.

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

// Buffers
var buffer = new Buffer(0x60);
buffer.writeUInt16BE(0xaaaa, 0);
buffer.writeUInt32BE(0x12345678, 0x40);
buffer.writeUInt32BE(0xffffbbbb, 0x50);
buffer.write('The quick brown fox jumps over the lazy dog!', 0x10);
µ.hex(buffer);
µ.debug(buffer);

// Promises
µ(new Promise(function (resolve, reject) { setTimeout(() => resolve("Hello World"), 600); }));
µ(new Promise(function (resolve, reject) { setTimeout(() => reject("Goodbye World"), 500); }));

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

// Styles
/*["DEFAULT", "SIMPLE", "TRAFFICLIGHTS"].forEach(function(style) {
    const µ = new mulog({levels:mulog.styles[style],console:{verbosity:100}});
    µ.error("mulog.styles." + style);
    µ.warn("mulog.styles." + style);
    µ.success("mulog.styles." + style);
    µ.info("mulog.styles." + style);
    µ.log("mulog.styles." + style);
    µ.verbose("mulog.styles." + style);
    µ.debug("mulog.styles." + style);
    console.log();
});*/
