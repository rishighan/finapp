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
    jade         = require('jade'),
    database     = require('./config/database.js')

    // configuration =================

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

// DATABASE connection
  mongoose.connect(database.url);
  var db = mongoose.connection;
  db.on('error', console.error.bind(console, 'Connection error:'));
  db.once('open', function callback(){
    console.log("Connected to database")
  })


require('./app/routes')(app,port, QuickBooks, request,qs, express, db);
