var mongoose = require('mongoose');


module.exports = mongoose.model('vbDetail', {

    company_name: String,
    rows:{
        date: Date,
        transaction_type: String,
        transaction_num: String,
        due_date: Date,
        amount: Number,
        open_balance: Number,
        balance: Number,
        identifier: String,
        processing_date: Date,
        processing_amount :Date,
        notes: String
    }
})
