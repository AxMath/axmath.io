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
var AV_ID = config.leancloud_id;
var AV_KEY = config.leancloud_key;
AV.initialize(AV_ID, AV_KEY);
AV.useAVCloudUS();

router.get('/status', function(req, res, next) {
  res.render('lic_status');
});

router.post('/status', function(req, res, next) {
  var RecordsQuery = new AV.Query('Records');
  var email = req.body.email.toString();
  var lickey = req.body.lickey.toString();
  // console.log(lickey);
  RecordsQuery.equalTo('email', email);
  RecordsQuery.equalTo('lickey', lickey);
  RecordsQuery.first({
    success: function(record) {
      // Respond status and licurl
      var status = "Record Not Found";
      var licurl = "Record Not Found";
      // console.log(record);
      if (record) {
        status = record.get('status');
        licurl = record.get('licurl');
      }
      res.status(200).json({status, licurl});
    },
    error: function(error) {
      console.log('Error: ' + error.code + ' ' + error.message);
    }
  });
});

router.post('/pay', function(req, res, next) {
  var tokenid = req.body.tokenid.toString();
  var email = req.body.email.toString();
  var lickey = req.body.lickey.toString();

  var RecordsObj = AV.Object.extend('Records');
  var RecordsRef = new RecordsObj();

  stripe.charges.create({
      amount: axmath_price,
      currency: 'usd',
      source: tokenid,
      metadata: {'lickey': lickey}
    }, function(error, charge) {

      var licurl = "None";
      var status = "None";
      var pid = "None";

      if (error) {
        status = error.type;
        pid = error.type;
        console.log("Error: " + error.message);
      }
      
      if (charge) {
        status = charge.status;
        pid = charge.id;
        console.log("Charge: " + status);
      }

      if (status === "succeeded") {
        licurl = "Generating";
      }

      var record = {
        email: email,
        lickey: lickey,
        pid: pid,
        status: status,
        licurl: licurl
      }
      // Create record in LeanCloud
      RecordsRef.save(record, {
        success: function(record) {
          console.log('New record created with ID: ' + record.id);
        },
        error: function(record, error) {
          console.log('Failed to create record, error message: ' + error.message);
        }
      });
    });

    // Redirect
    // res.redirect('/lic/status');

});

router.get('/list', function(req, res, next) {
  var RecordsQuery = new AV.Query('Records');
  // list all lic records of licurl generating
  RecordsQuery.equalTo('licurl', 'Generating');
  RecordsQuery.find({
    success: function(records) {
      res.status(200).json(records);
    },
    error: function(error) {
      console.log('Error: ' + error.code + ' ' + error.message);
      res.json(error);
    }
  });
});

router.get('/all', function(req, res) {
  res.send({'lic': 'all'});
});

router.post('/update', function(req, res, next) {
  var RecordsQuery = new AV.Query('Records');
  // var pid = req.params.pid;
  var pid = req.body.pid.toString();
  var licurl = req.body.licurl.toString();

  RecordsQuery.equalTo('pid', pid);
  RecordsQuery.first({
    success: function(record) {
      record.set('licurl', licurl);
      record.save();
      res.send('Update licurl success!');
    },
    error: function(error) {
      console.log('Error: ' + error.code + ' ' + error.message);
      res.send('Error: ' + error.code + ' ' + error.message);
    }
  })
});

module.exports = router;
