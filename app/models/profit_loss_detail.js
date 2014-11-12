var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var RowsDataSchema = new Schema({
  date: Date,
  transaction_type: String,
  transaction_num: String,
  name: String,
  'class': String,
  memo: String,
  split: String,
  amount: Number,
  balance: Number
}, {_id: false});

var CustomRowDataSchema = new Schema({
  identifier: String,
  processing_date: Date,
  processing_amount: Number,
  notes: String
}, {_id: false});


var ProfitLossDetailSchema = new Schema({
  company_name: String,
  rows_data: [RowsDataSchema],
  meta_rows: [CustomRowDataSchema]
});

module.exports = mongoose.model('ProfitLossDetail', ProfitLossDetailSchema);