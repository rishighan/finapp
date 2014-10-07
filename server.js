// server.js

    // set up ========================
    var express  = require('express'),
    app          = express(),                      // create our app w/ express
    mongoose     = require('mongoose'),           // mongoose for mongodb
    morgan       = require('morgan'),             // log requests to the console (express4)
    bodyParser   = require('body-parser'),        // pull information from HTML POST (express4)
    methodOverride = require('method-override'),  // simulate DELETE and PUT (express4)
    port         = process.env.PORT || 8080,
    request      = require('request'),
    qs           = require('querystring'),
    util         = require('util'),
    QuickBooks   = require('node-quickbooks'),
    jade         = require('jade')

    // configuration =================
    mongoose.connect('mongodb://node:node@mongo.onmodulus.net:27017/uwO3mypu');     // connect to mongoDB database on modulus.io
    app.use(express.static(__dirname + '/public'));                 // set the static files location /public/img will be /img for users
    app.use(morgan('dev'));                                         // log every request to the console
    app.use(bodyParser.urlencoded({'extended':'true'}));            // parse application/x-www-form-urlencoded
    app.use(bodyParser.json());                                     // parse application/json
    app.use(bodyParser.json({ type: 'application/vnd.api+json' })); // parse application/vnd.api+json as json
    app.use(methodOverride());
    // from the old app
    app.use(express.cookieParser('brad'))
    app.use(express.session({secret: 'smith'}));
    app.use(app.router)
    app.set('views', 'views')

    // startup =================
    // listen (start app with node server.js)
    app.listen(8080);
    console.log("App listening on port 8080");

// INSERT YOUR CONSUMER_KEY AND CONSUMER_SECRET HERE
// S&M WEST Swisher Co.
var consumerKey    = 'qyprdVORomgh9I6rKyiAazpuUfKy4N',
    consumerSecret = 'zAMZTJ8btRjexPh9dzo8LMFzCsJJa8CFcBFPhj6x'

app.get('/start', function(req, res) {
  res.render('intuit.ejs', {locals: {port:port}})
})

app.get('/requestToken', function(req, res) {
  var postBody = {
    url: QuickBooks.REQUEST_TOKEN_URL,
    oauth: {
      callback:        'http://localhost:' + port + '/callback/',
      consumer_key:    consumerKey,
      consumer_secret: consumerSecret
    }
  }
  request.post(postBody, function (e, r, data) {
    var requestToken = qs.parse(data)
    req.session.oauth_token_secret = requestToken.oauth_token_secret
    console.log(requestToken)
    res.redirect(QuickBooks.APP_CENTER_URL + requestToken.oauth_token)
  })
})

app.get('/callback', function(req, res) {
  var postBody = {
    url: QuickBooks.ACCESS_TOKEN_URL,
    oauth: {
      consumer_key:    consumerKey,
      consumer_secret: consumerSecret,
      token:           req.query.oauth_token,
      token_secret:    req.session.oauth_token_secret,
      verifier:        req.query.oauth_verifier,
      realmId:         req.query.realmId
    }
  }
  request.post(postBody,  function (e, r, data) {
    var accessToken = qs.parse(data)
    console.log(accessToken)
    console.log(postBody.oauth.realmId)

    // save the access token somewhere on behalf of the logged in user
    qbo = new QuickBooks(consumerKey,
                         consumerSecret,
                         accessToken.oauth_token,
                         accessToken.oauth_token_secret,
                         postBody.oauth.realmId,
                         true); // turn debugging on

    // test out account access
    /*qbo.findAccounts(function(_, accounts) {
      accounts.QueryResponse.Account.forEach(function(account) {
        console.log(account.Name)
      })
    })*/

    res.send('<html><body><script>window.close()</script>')

})

   app.get('/vendorbalancedetail', express.bodyParser(), function(req, res){
      qbo.reportVendorBalanceDetail({date_macro:'This Month-to-date', appaid: 'Unpaid'},function(_,report){

      //console.log(report)
      res.render('vendorbalancedetail.jade', {title: "Report Detail",
                              reportname: report["Header"]['ReportName'],
                              daterange: "From:"+report["Header"]["StartPeriod"]+" to: "+report["Header"]["EndPeriod"],
                              alldata: report,
                              columns: report["Columns"],
                              rowsperclient: report["Rows"]
                            });
      })

    })

   app.get('/profitandlossdetail', express.bodyParser(), function(req,res){
    qbo.reportProfitAndLossDetail({date_macro:'This Month-to-date',
                                   sort_order: 'descend',
                                   account_type: 'FixedAsset'}, function(_, report){
    console.log(report);
    res.render('profitandlossdetail.jade', {
        title: "Profit and Loss Detail",
        reportname: report["Header"]["ReportName"],
        daterange: "From: "+ report["Header"]["StartPeriod"]+ " to: "+ report["Header"]["EndPeriod"],
        columns: report["Columns"],
        rows: report["Rows"]
    })

    })

   })

})



