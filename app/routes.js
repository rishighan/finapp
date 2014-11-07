// ROUTES

var creds = require('../config/app.js'),
    mongoose = require('mongoose'),
    vbDetail = require('../app/models/vendorbalancedetail.js'),
    ProfitLossDetail = require('../app/models/profit_loss_detail.js'),
    BalanceSheet = require('../app/models/balance_sheet.js'),
    CustomerBalanceDetail = require('../app/models/customer_balance_detail.js'),
    db = require('../config/database.js'),
    async = require('async');

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
                callback: 'http://104.131.31.135:' + port + '/callback/',
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

    function getDataFromQuickBooksAPI (qbo, qbMethod, titleReport, res, customColumns) {
      qbMethod.call(qbo, {
        date_macro: 'Last Month',
      }, function (err, report) {
        if (err) {
          res.status(400).send({error: err.message});
          return;
        }

        var dataSource = getDataSourceForJadeFile(titleReport, report, customColumns);
        res.status(200).send({data: dataSource});
      });
    }

    // NEW CODE

    // PROFIT LOSS DETAIL
    app.post('/data/profit-loss-detail', function (req, res) {
      var customColumns = ['Unique Identifier', 'Notes', 'Processing Amount', 'Processing Date'];
      getDataFromQuickBooksAPI(qbo, qbo.reportProfitAndLossDetail, 'Profit Loss Detail', res, customColumns);
    });

    app.post('/profit-loss-detail', function (req, res) {
      var formatters = [
        profitLossDetailFormatterData,
        profitLossDetailFormatterCustomData
      ];

      saveAllData(req.body.tables, req.body.customColumns, formatters, ProfitLossDetail, function (err) {
        if (err) {
          return res.status(err.status).send({
            error: err.message
          });
        }

        res.status(200).send({success: 'Data was saved successfully.'});
      });
    });

    app.get('/profit-loss-detail', function (req, res) {
      res.render('report_template_secondary.jade', {angularController: 'ProfitLossDetailController'});
    });


    // CUSTOMER BALANCE DETAIL
    app.post('/data/customer-balance-detail', function (req, res) {
      var customColumns = ['Unique Identifier', 'Notes', 'Processing Amount', 'Processing Date'];
      getDataFromQuickBooksAPI(qbo, qbo.reportCustomerBalanceDetail, 'Customer Balance Detail', res, customColumns);
    });

    app.post('/customer-balance-detail', function (req, res) { 
      var formatters = [
        customerBalanceDetailFormatterData,
        customerBalanceDetailFormatterCustomData
      ];

      saveAllData(req.body.tables, req.body.customColumns, formatters, CustomerBalanceDetail, function (err) {
        if (err) {
          return res.status(err.status).send({
            error: err.message
          });
        }

        res.status(200).send({success: 'Data was saved successfully.'});
      });
    });

    app.get('/customer-balance-detail', function (req, res) { 
      res.render('report_template_secondary.jade', {angularController: 'CustomerBalanceDetailController'});
    });


    // BALANCE SHEET
    app.post('/data/balance-sheet', function (req, res) { 
      var customColumns = ['Unique Identifier', 'Notes', 'Processing Amount', 'Processing Date'];
      getDataFromQuickBooksAPI(qbo, qbo.reportBalanceSheet, 'Balance Sheet', res, customColumns);
    });

    app.post('/balance-sheet', function (req, res) { 
      var formatters = [
        balanceSheetFormatterData,
        balanceSheetFormatterCustomData
      ];

      saveAllData(req.body.tables, req.body.customColumns, formatters, BalanceSheet, function (err) {
        if (err) {
          return res.status(err.status).send({
            error: err.message
          });
        }

        res.status(200).send({success: 'Data was saved successfully.'});
      });
    });

    app.get('/balance-sheet', function (req, res) { 
      res.render('report_template_secondary.jade', {angularController: 'BalanceSheetController'});
    });


    })

}


function getTable2(r, l) {
  var _tables = [];
  return (function getTableHelper (rows, lengthCustomColumns) {
    var i, z, x, xLen, currentRow;
    var row = rows.Row;
    var iLen = row && row.length ? row.length : 0;
    var table = null;

    for (i=0; i<iLen; i++) {
      table = {
        title: '',
        rows: [],
        summary: []
      };

      currentRow = row[i];

      if (currentRow.Header) {
        table.title = currentRow.Header.ColData[0];
      } 

      if (currentRow.Rows && currentRow.Rows.Row && currentRow.Rows.Row.length > 0 && currentRow.Rows.Row[0].ColData) {
        zLen = currentRow.Rows.Row.length;
        for (z=0; z<zLen; z++) {
          var rowData = currentRow.Rows.Row[z].ColData;

          for (x=0, xLen=lengthCustomColumns; x<xLen; x++) {
            rowData.push({value: x});
          }

          table.rows.push(rowData);
        }
      }

      if (currentRow.Summary && currentRow.Summary.ColData) {
        table.summary = currentRow.Summary.ColData;
      }

      if (table.rows.length > 0 && table.summary.length > 0) {
        _tables.push(table);
      }

      if (currentRow.Header && currentRow.Rows) {
        getTableHelper(currentRow.Rows, lengthCustomColumns);
      }
    }

    return _tables;
  }(r, l));
}

function getDataSourceForJadeFile (reportTitle, report, customColumns) {
  var tables = [];
  var _reportTitle = '';
  var reportName = '';
  var dateRange = '';
  var allData = null;
  var columns = [];
  var _customColumns = [];
  var i, iLen;

  if (report) {
    tables = getTable2(report.Rows, customColumns.length);
    _reportTitle = reportTitle;
    dateRange = report['Header']['StartPeriod'] + 'to: ' + report['Header']['EndPeriod'];
    allData = report;
    columns = report['Columns'];
    reportName = report["Header"]["ReportName"];
    _customColumns = customColumns;

    for(i=0,iLen=_customColumns.length; i<iLen; i++) {
      columns.Column.push({
        ColTitle: _customColumns[i]
      });
    }
  }

  return {
    title: _reportTitle,
    reportName: reportName,
    dateRange: dateRange,
    columns: columns,
    tables: tables,
    customColumns: _customColumns
  };
}

function removeAllData (Model, callback) {
  Model.remove({}, callback);
}

function saveAllData (tables, columns, formatters, model, callback) {
  async.series([
    function (c) {
      removeAllData(model, function (err) {
        console.log('all data was removed');
        c();
      });
    },
    function (c) {
      async.each(tables, 
        function (table, cb) {
          saveData(table, columns, formatters, model, function (err) {
            cb();
          });
        },
        function (err) {
          c(err);
        }
      );
    }],
    function (err, res) {
      callback();
    }
  );
}

function saveData (table, columns, formatters, Model, callback) {
  var i, len;
  var profitLossDetail = new Model({company_name: table.title.value});

  for (i=0,len=table.rows.length; i<len; i++) {
    var currentRow = table.rows[i];
    var row = getProfitLossDetailRow(currentRow, columns);
    var customRow = getProfitLossDetailCustomRow(currentRow, columns);

    console.log('row: ');
    console.log(row);
    console.log('customRow: ');
    console.log(customRow);

    console.log('formatters[0](row): ');
    console.log(formatters[0](row));
    console.log('formatters[1](customRow): ');
    console.log(formatters[1](customRow));

    profitLossDetail.rows_data.push(formatters[0](row));
    profitLossDetail.meta_rows.push(formatters[1](customRow));
  }

  profitLossDetail.save(function (err) {
    callback(err);
  });
}

function getValue (row, index) {
  return row ? row[index] : '';
}

function customerBalanceDetailFormatterData (row) {
  return {
    date: getValue(row, 0),
    transaction_type: getValue(row, 1),
    transaction_num: getValue(row, 2),
    due_date: getValue(row, 3),
    amount: getValue(row, 4),
    open_balance: getValue(row, 5),
    balance: getValue(row, 6)
  };
}

function customerBalanceDetailFormatterCustomData (row) {
  return {
    identifier: getValue(row, 0),
    processing_date: getValue(row, 1),
    processing_amount: getValue(row, 2),
    notes: getValue(row, 3)
  };
}

function balanceSheetFormatterData (row) {
  return {
    title: getValue(row, 0),
    total: getValue(row, 1)
  };
}

function balanceSheetFormatterCustomData (row) {
  return {
    identifier: getValue(row, 0),
    processing_date: getValue(row, 1),
    processing_amount: getValue(row, 2),
    notes: getValue(row, 3)
  };
}

function profitLossDetailFormatterCustomData (row) {
  return {
    identifier: getValue(row, 0),
    processing_date: getValue(row, 1),
    processing_amount: getValue(row, 2),
    notes: getValue(row, 3)
  };
}

function profitLossDetailFormatterData (row) {
  return {
    date: getValue(row, 0),
    transaction_type: getValue(row, 1),
    transaction_num: getValue(row, 2),
    name: getValue(row, 3),
    'class': getValue(row, 4),
    memo: getValue(row, 5),
    split: getValue(row, 6),
    amount: getValue(row, 7),
    balance: getValue(row, 8)
  };
}

function getProfitLossDetailRow (row, columns) {
  var indexInit = 0;
  var length = row.length - columns.length;

  return getData(row, indexInit, length);
}




function getProfitLossDetailCustomRow (row, columns) {
  var indexInit = (row.length - columns.length);
  var length = row.length;

  return getData(row, indexInit, length);
}

function getData (row, index, len) {
  var i;
  var data = [];

  for(i=index,len=len-1; i<=len; i++) {
    data.push(row[i].value);
  }

  return data;
}

