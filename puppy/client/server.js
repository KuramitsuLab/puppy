var express = require("express");
var bodyParser = require('body-parser');
var path = require("path");
var app = express();

app.use(bodyParser.text({type: 'application/text'}));

var server = app.listen(8080, function () {
  console.log("Node.js is listening to PORT:" + server.address().port);
});

app.get("/sample/:path/:path", function (req, res, next) {
  res.sendFile(path.join(__dirname, './static/sample/js/PuppyVMCode.js'));
});

app.use(express.static(path.join(__dirname, 'static')));


app.post("/compile", function (req, res, next) {
  res.setHeader('Content-Type', 'application/javascript');
  res.send(req.body);
});