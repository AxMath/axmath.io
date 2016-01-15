var express = require('express');
var router = express.Router();
var config = require('../config');

/* GET home page. */
router.get('/', function(req, res, next) {
  console.log(config);
  res.render('home', config);
});

module.exports = router;
