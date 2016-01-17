var express = require('express');
var router = express.Router();
var env = process.env.NODE_ENV || "development";
var config = require(__dirname + '/../config/config.json')[env];
var stripe_sk = config.stripe_sk;
var axmath_price = config.axmath_price;
var stripe = require('stripe')(stripe_sk);

router.get('/status', function(req, res, next) {
  res.render('lic_status');
});

router.post('/pay', function(req, res, next) {
  var tokenid = req.body.tokenid;
  var email = req.body.email;
  var lickey = req.body.lickey;
  // res.json(req.body);
  // console.log(tokenid, email, lickey);
  stripe.charges.create({
      amount: axmath_price,
      currency: 'usd',
      source: tokenid,
      metadata: {'lickey': lickey}
    }, function(error, charge) {
      var licurl = "None";
      if (charge.status == "succeeded") {
        licurl = "Generating";
      }
      var record = {
        email: email,
        lickey: lickey,
        pid: charge.id,
        status: charge.status,
        created: charge.created,
        licurl: licurl
      }
      // console.log(record);
    }
  );
});

module.exports = router;
