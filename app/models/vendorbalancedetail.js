var mongoose = require('mongoose');


module.exports = mongoose.model('vbDetail', {
    date: Date,
    company_name: String,
    transaction_type: String,
    transaction_num: String,
    due_date: Date,
    amount: Number,
    open_balance: Number,
    balance: Number,
    identifier: String,
    forecasted_date: Date,
    notes: String
})
