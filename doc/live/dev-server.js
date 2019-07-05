var express = require("express");
var path = require("path");
var app = express();

var server = app.listen(3000, function () {
  console.log("Node.js is listening to PORT:" + server.address().port);
});

app.use(express.static(path.join(__dirname, 'static')));
