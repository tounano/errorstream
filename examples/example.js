var through = require("through");
var errorstream = require("../errorstream");

// Create a stream that will throw Errors randomly
var createRandomErrorStream =  function () {
  return through( function (data) {
    var rand = Math.round(Math.random() * 3);
    if (rand == 0) return this.emit("error", new Error("Random " + data));
    this.queue(data);
  });
}

// Create a simple through stream
var bad = through();
var badStream;

// Pipe bad->error->console.log
bad.pipe(badStream = createRandomErrorStream()).pipe(through(console.log));
badStream.on("error", console.log);

// Write some data
for (var i = 1; i <= 30; ++i) {
  bad.write(i);
}

// Wait 3 seconds, just to let the buffers clean
setTimeout( function () {
  console.log("\n\nStarting the example with error handling\n\n")

  // Create a domain. (Node's domain handling)
  var d = require("domain").createDomain();

  var good = through();

  // Same example as before, just with errorstream as a wrapper
  good.pipe(errorstream(d,createRandomErrorStream())).pipe(through(console.log));

  // Log the domain errors
  d.on("error", function (err) {
    console.log(err.stack);
  })

  // Write some data
  for (var i = 1; i <= 30; ++i) {
    good.write(i);
  }
}, 3000);