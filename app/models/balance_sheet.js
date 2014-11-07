var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var RowsDataSchema = new Schema({
  title: String,
  total: Number
}, {_id: false});

var CustomRowDataSchema = new Schema({
  identifier: String,
  processing_date: Date,
  processing_amount: Date,
  notes: String
}, {_id: false});

var BalanceSheetSchema = new Schema({
  company_name: String,
  rows_data: [RowsDataSchema],
  meta_rows: [CustomRowDataSchema]
});

module.exports = mongoose.model('BalanceSheet', BalanceSheetSchema);