var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var RowsDataSchema = new Schema({
  date: Date,
  transaction_type: String,
  transaction_num: String,
  location: String,
  due_date: Date,
  amount: Number,
  open_balance: Number,
  balance: Number
}, {_id: false});

var CustomRowDataSchema = new Schema({
  identifier: String,
  processing_date: Date,
  processing_amount: Date,
  notes: String
}, {_id: false});

var CustomerBalanceDetailSchema = new Schema({
  company_name: String,
  rows_data: [RowsDataSchema],
  meta_rows: [CustomRowDataSchema]
});

module.exports = mongoose.model('CustomerBalanceDetail', CustomerBalanceDetailSchema);