var express = require('express');
var router = express.Router();
var env = process.env.NODE_ENV || "development";
var config = require(__dirname + '/../config/config.json')[env];
// Stripe
var stripe_sk = config.stripe_sk;
var axmath_price = config.axmath_price;
var stripe = require('stripe')(stripe_sk);
// LeanCloud init
var AV = require('avoscloud-sdk');
var AVID = config.leancloud_id;
var AVKEY = config.leancloud_key;
AV.initialize(AVID, AVKEY);
AV.useAVCloudUS();
// Record query and object init
var RecordObj = AV.Object.extend('RecordObj');
var RecordRef = new RecordObj();
var RecordQuery = new AV.Query('RecordObj');

router.get('/status', function(req, res, next) {
  // var email = req.cookies.email;
  // var lickey = req.cookies.lickey;
  // res.render('lic_status', {email, lickey});
  res.render('lic_status');
});

router.post('/status', function(req, res, next) {
  var email = req.body.email;
  var lickey = req.body.lickey;
  // TODO: find record by email and lickey pair
  // TODO: res the status and licurl
});

router.post('/pay', function(req, res, next) {
  var tokenid = req.body.tokenid;
  var email = req.body.email;
  var lickey = req.body.lickey;
  // res.cookie('email', email);
  // res.cookie('lickey', lickey);
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
      // Create record in LeanCloud
      // RecordRef.save(record, {
      //   success: function(RecordRef) {
      //     console.log('New object created with objectId: ' + RecordRef.id);
      //   },
      //   error: function(RecordRef, error) {
      //     console.log('Failed to create new object, with error message: ' + error.message);
      //   }
      // });

      RecordRef.save(record);

    }
  );
  
});

router.get('/list', function(req, res, next) {
  // list all lic records of licurl generating
  RecordQuery.equalTo('licurl', 'Generating');
  RecordQuery.select('email', 'lickey', 'status', 'licurl');
  RecordQuery.find({
    success: function(results) {
      res.json(results);
    },
    error: function(error) {
      console.log('Error: ' + error.code + ' ' + error.message);
    }
  });
});

router.post('/upload', function(req, res, next) {
  var pid = req.body.pid;
  var lickey = req.body.lickey;
  var name = lickey + ".lic";
  var file = req.body.file;
  var license = new AV.File(name, file);
  license.save();

});

module.exports = router;
