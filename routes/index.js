var express = require('express');
var router = express.Router();
var env = process.env.NODE_ENV || "development";
var config = require(__dirname + '/../config/config.json')[env];

router.get('/', function(req, res, next) {
  res.render('home', config);
});

module.exports = router;
