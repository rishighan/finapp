// ROUTES

var creds = require('../config/app.js'),
    mongoose = require('mongoose'),
    vbDetail = require('../app/models/vendorbalancedetail.js'),
    db = require('../config/database.js'),
    async = require('async')

//expose these routes to our app
module.exports = function(app, port, QuickBooks, request, qs, express, db) {

    // Connect to QB online API
    // 1. Define the route for initiating the connection
    // 2. Upon successful authorization, get the token and the token secret, close the Auth window
    // 3. Callback route. Supply consumer key, consumer secret, token, token secret and initiate the QB object
    // 4. Now you have access to the QB object, so call the endpoints and profit.

    app.get('/start', function(req, res) {
        res.render('intuit.ejs', {
            locals: {
                port: port
            }
        })
    })

    app.get('/requestToken', function(req, res) {
        var postBody = {
            url: QuickBooks.REQUEST_TOKEN_URL,
            oauth: {
                callback: 'http://localhost:' + port + '/callback/',
                consumer_key: creds.consumerKey,
                consumer_secret: creds.consumerSecret
            }
        }
        request.post(postBody, function(e, r, data) {
            var requestToken = qs.parse(data)
            req.session.oauth_token_secret = requestToken.oauth_token_secret
            console.log(requestToken)
            res.redirect(QuickBooks.APP_CENTER_URL + requestToken.oauth_token)
        })
    })

    // based on successful or unsucessful auth, take appropriate action
    app.get('/callback', function(req, res) {
        var postBody = {
            url: QuickBooks.ACCESS_TOKEN_URL,
            oauth: {
                consumer_key: creds.consumerKey,
                consumer_secret: creds.consumerSecret,
                token: req.query.oauth_token,
                token_secret: req.session.oauth_token_secret,
                verifier: req.query.oauth_verifier,
                realmId: req.query.realmId
            }
        }
        request.post(postBody, function(e, r, data) {
            var accessToken = qs.parse(data)
            console.log(accessToken)
            console.log(postBody.oauth.realmId)

            // save the access token somewhere on behalf of the logged in user
            qbo = new QuickBooks(creds.consumerKey,
                creds.consumerSecret,
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


        // to save the api response to mongo
        app.get('/vbdetail/write', express.bodyParser(), function(req, res) {

            //make the api call
            qbo.reportVendorBalanceDetail({
                date_macro: 'This Month-to-date',
                appaid: 'Unpaid'
            }, function(_, report) {

               // Save the response selectively.
               var companies = report.Rows.Row.length-1,
                   count     = 0;

                res.render('result.jade', {
                    importStatus: "Companies:"+ companies,
                    importError: "Error message"+ err
                })

                //test
                for(var row in report["Rows"]["Row"]){
                    while(count < companies){

                         // save the rows corresponding to each client
                         for(var rowdata in report.Rows.Row[count].Rows.Row){
                            for(var coldata in report.Rows.Row[count].Rows.Row[rowdata].ColData){

                               // save company name
                               var vbd = new vbDetail({
                                    company_name: report.Rows.Row[count].Header.ColData[0].value
                               });
                            }

                                // save the row data per company
                                vbd.rowsdata = ({vals:{
                                                        date: report.Rows.Row[count].Rows.Row[rowdata].ColData[0].value,
                                                        transaction_type: report.Rows.Row[count].Rows.Row[rowdata].ColData[1].value,
                                                        transaction_num: report.Rows.Row[count].Rows.Row[rowdata].ColData[2].value,
                                                        due_date: report.Rows.Row[count].Rows.Row[rowdata].ColData[3].value,
                                                        amount: report.Rows.Row[count].Rows.Row[rowdata].ColData[4].value,
                                                        open_balance: report.Rows.Row[count].Rows.Row[rowdata].ColData[5].value,
                                                        balance: report.Rows.Row[count].Rows.Row[rowdata].ColData[6].value

                                                     }
                                                 })
                                console.log(vbd);
                                // Save the record to DB
                                vbd.save(function(err){
                                    if(err) console.log(err);
                                })
                            }
                       count++;
                    }
                }

        })

        })



        app.get('/vendorbalancedetail', express.bodyParser(), function(req, res) {
            qbo.reportVendorBalanceDetail({
                date_macro: 'This Month-to-date',
                appaid: 'Unpaid'
            }, function(_, report) {
                // getDataObject('Report Detail', report, 'vbd');
                //console.log(report)
                res.render('vendorbalancedetail.jade', {
                    title: "Report Detail",
                    reportname: report["Header"]['ReportName'],
                    daterange: "From:" + report["Header"]["StartPeriod"] + " to: " + report["Header"]["EndPeriod"],
                    alldata: report,
                    columns: report["Columns"],
                    rowsperclient: report["Rows"]
                });
            })

        })

        app.get('/profitandlossdetail', express.bodyParser(), function(req, res) {
            qbo.reportProfitAndLossDetail({
                date_macro: 'This Month-to-date',
                sort_order: 'descend',
                account_type: 'Bank'
            }, function(_, report) {
                // console.log(report);
                res.render('profitandlossdetail.jade', {
                    title: "Profit and Loss Detail",
                    reportname: report["Header"]["ReportName"],
                    daterange: "From: " + report["Header"]["StartPeriod"] + " to: " + report["Header"]["EndPeriod"],
                    columns: report["Columns"],
                    rows: report["Rows"]
                })

            })

        })

        app.get('/customer-balance-detail', function (req, res) {
            qbo.reportCustomerBalanceDetail({

            }, function (err, report) {
                if (err) {
                  res.status(400).send({error: err.message});
                  return;
                }

                var customColumns = ['Unique Identifier', 'Notes', 'Processing Amount', 'Processing Date'];
                var dataSource = getDataSourceForJadeFile('Customer Balance Detail', report, customColumns, 'CustomerBalanceDetailController');
                res.render('report_template.jade', dataSource);
            });
        });

        app.get('/balance-sheet', function (req, res) {
          qbo.reportBalanceSheet({

          }, function (err, report) {
            if (err) {
              res.status(400).send({error: err.message});
              return;
            }

            var customColumns = ['Unique Identifier', 'Notes', 'Processing Amount', 'Processing Date'];
            var dataSource = getDataSourceForJadeFile('Balance Sheet', report, customColumns, 'BalanceSheetController');
            res.render('report_template.jade', dataSource);
          });
        });

    })

}

function getTable (rows, table) {
  var i, z, currentRow;
  var row = rows.Row;
  var iLen = row.length;
  var table = table || {
    title: '',
    rows: [],
    summary: [],
    table: null
  };

  var tables = [];

  for (i=0; i<iLen; i++) {
    currentRow = row[i];
    if (currentRow.Header && currentRow.Rows) {
      table.title = currentRow.Header.ColData[0];
      table.table = getTable(currentRow.Rows, table.table);

      if (currentRow.Rows.Row && currentRow.Rows.Row.length > 0 && currentRow.Rows.Row[0].ColData) {
        zLen = currentRow.Rows.Row.length;
        for (z=0; z<zLen; z++) {
          var rowData = currentRow.Rows.Row[z].ColData;
          table.rows.push(rowData);
        }
      }

      if (currentRow.Summary && currentRow.Summary.ColData) {
        table.summary = currentRow.Summary.ColData;
      }
    }

    tables.push(JSON.parse(JSON.stringify(table)));
    table = {
       title: '',
      rows: [],
      summary: [],
      table: null
    };
  }

  return tables;
}

function getDataSourceForJadeFile (reportTitle, report, customColumns, angularController) {
  var tables = [];
  var _reportTitle = '';
  var reportName = '';
  var dateRange = '';
  var allData = null;
  var columns = [];
  var _customColumns = [];

  if (report) {
    tables = getTable(report.Rows);
    _reportTitle = reportTitle;
    dateRange = report['Header']['StartPeriod'] + 'to: ' + report['Header']['EndPeriod'];
    allData = report;
    columns = report['Columns'];
    reportName = report["Header"]["ReportName"];
    _customColumns = customColumns;
  }

  return {
    title: _reportTitle,
    reportName: reportName,
    dateRange: dateRange,
    columns: columns,
    tables: tables,
    customColumns: _customColumns,
    angularController: angularController
  };
}


// function getDataObject(title, report, fileName) {
//   var i;
//   var rows = report['Rows'];
//   var leng = rows.length;

//   var jsonRows = JSON.stringify(report);
//   var fs = require('fs');
//   fs.writeFile('./' + fileName + '.json', jsonRows, function (err) {
//     if (err) {
//       console.log(err);
//     } else {
//       console.log('saved json file!');
//     }
//   });
// }
