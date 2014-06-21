# errorstream

Error handling for streams...

## The Problem

When you pipe streams, errors won't be passed over. But that's not the only problem.

The bigger problem is that when an error occures at some stream, it would be unpiped. Unpiped, but not terminated.

So if you have:

```
a.pipe(b).pipe(c);
```

and `b` throws an error, everything would break.

Here's an example:

``` js
var through = require("through");

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
```

And the result is:

```
1
2
3
4
5
6
7
8
9
10
11
12
13
14
15
16
[Error: Random 17]
```

As you can see, it broke the whole chain...

I spent lots of hours on debugging it.

Sometimes, it would be a good idea to cut the pipe chain off.

However, what if you're processing a chain of independant events. Each event can succeed or fail. If a single event
fails, it shouldn't influence the other events?

Besides, error handling is super important and underrated to some degree.

This is my take on how we should handle errors and exceptions in node.

## The solution

Meet `errorstream`. A simple stream that would wrap any stream that might throw errors. This stream would redirect
the thrown errors to a [domain of your choice](http://nodejs.org/api/domain.html).

### Usage

First, create a domain.

```js
var errorstream = require("errorstream");

var domain = require("domain").createDomain();
```

Now, you can wrap any `domain` and `stream`:

```js
a.pipe(errorstream(domain, b)).pipe(c);
```

## Example

```js
var through = require("through");
var errorstream = require("errorstream");

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
```

And here is the result:

```
1
2
3
4
5
6
7
[Error: Random 8]


Starting the example with error handling


1
2
Error: Random 3
    at Stream.<anonymous> (C:\Users\tounano\WebstormProjects\modules\errorstream\examples\example.js:8:46)
    at Stream.stream.write (C:\Users\tounano\WebstormProjects\modules\errorstream\node_modules\through\index.js:26:11)
    at Stream.<anonymous> (C:\Users\tounano\WebstormProjects\modules\errorstream\errorstream.js:7:12)
    at Stream.stream.write (C:\Users\tounano\WebstormProjects\modules\errorstream\node_modules\through\index.js:26:11)
    at Stream.ondata (stream.js:51:26)
    at Stream.EventEmitter.emit (events.js:95:17)
    at drain (C:\Users\tounano\WebstormProjects\modules\errorstream\node_modules\through\index.js:36:16)
    at Stream.stream.queue.stream.push (C:\Users\tounano\WebstormProjects\modules\errorstream\node_modules\through\index.js:45:5)
    at Stream.write (C:\Users\tounano\WebstormProjects\modules\errorstream\node_modules\through\index.js:14:43)
    at Stream.stream.write (C:\Users\tounano\WebstormProjects\modules\errorstream\node_modules\through\index.js:26:11)
4
5
6
7
Error: Random 8
    at Stream.<anonymous> (C:\Users\tounano\WebstormProjects\modules\errorstream\examples\example.js:8:46)
    at Stream.stream.write (C:\Users\tounano\WebstormProjects\modules\errorstream\node_modules\through\index.js:26:11)
    at Stream.<anonymous> (C:\Users\tounano\WebstormProjects\modules\errorstream\errorstream.js:7:12)
    at Stream.stream.write (C:\Users\tounano\WebstormProjects\modules\errorstream\node_modules\through\index.js:26:11)
    at Stream.ondata (stream.js:51:26)
    at Stream.EventEmitter.emit (events.js:95:17)
    at drain (C:\Users\tounano\WebstormProjects\modules\errorstream\node_modules\through\index.js:36:16)
    at Stream.stream.queue.stream.push (C:\Users\tounano\WebstormProjects\modules\errorstream\node_modules\through\index.js:45:5)
    at Stream.write (C:\Users\tounano\WebstormProjects\modules\errorstream\node_modules\through\index.js:14:43)
    at Stream.stream.write (C:\Users\tounano\WebstormProjects\modules\errorstream\node_modules\through\index.js:26:11)
9
10
11
12
13
14
Error: Random 15
    at Stream.<anonymous> (C:\Users\tounano\WebstormProjects\modules\errorstream\examples\example.js:8:46)
    at Stream.stream.write (C:\Users\tounano\WebstormProjects\modules\errorstream\node_modules\through\index.js:26:11)
    at Stream.<anonymous> (C:\Users\tounano\WebstormProjects\modules\errorstream\errorstream.js:7:12)
    at Stream.stream.write (C:\Users\tounano\WebstormProjects\modules\errorstream\node_modules\through\index.js:26:11)
    at Stream.ondata (stream.js:51:26)
    at Stream.EventEmitter.emit (events.js:95:17)
    at drain (C:\Users\tounano\WebstormProjects\modules\errorstream\node_modules\through\index.js:36:16)
    at Stream.stream.queue.stream.push (C:\Users\tounano\WebstormProjects\modules\errorstream\node_modules\through\index.js:45:5)
    at Stream.write (C:\Users\tounano\WebstormProjects\modules\errorstream\node_modules\through\index.js:14:43)
    at Stream.stream.write (C:\Users\tounano\WebstormProjects\modules\errorstream\node_modules\through\index.js:26:11)
16
17
18
19
20
Error: Random 21
    at Stream.<anonymous> (C:\Users\tounano\WebstormProjects\modules\errorstream\examples\example.js:8:46)
    at Stream.stream.write (C:\Users\tounano\WebstormProjects\modules\errorstream\node_modules\through\index.js:26:11)
    at Stream.<anonymous> (C:\Users\tounano\WebstormProjects\modules\errorstream\errorstream.js:7:12)
    at Stream.stream.write (C:\Users\tounano\WebstormProjects\modules\errorstream\node_modules\through\index.js:26:11)
    at Stream.ondata (stream.js:51:26)
    at Stream.EventEmitter.emit (events.js:95:17)
    at drain (C:\Users\tounano\WebstormProjects\modules\errorstream\node_modules\through\index.js:36:16)
    at Stream.stream.queue.stream.push (C:\Users\tounano\WebstormProjects\modules\errorstream\node_modules\through\index.js:45:5)
    at Stream.write (C:\Users\tounano\WebstormProjects\modules\errorstream\node_modules\through\index.js:14:43)
    at Stream.stream.write (C:\Users\tounano\WebstormProjects\modules\errorstream\node_modules\through\index.js:26:11)
22
23
24
25
26
27
28
29
30
```

## install

With [npm](https://npmjs.org) do:

```
npm install errorstream
```

## license

MIT
