var through = require("through");

module.exports = function (domain, stream) {
  domain.add(stream);

  var tr = through( function (data) {
    stream.write(data);
  }, function () {
    stream.end();
  });

  stream.on("data", function (data) {
    tr.queue(data);
  });

  stream.on("end", function () {
    tr.queue(null);
    domain.remove(stream);
  });

  stream.on("close", function () {
    tr.destroy();
    domain.remove(stream);
  });

  return tr;
}
