var mongoose = require('mongoose');

        // date: Date,
        // transaction_type: String,
        // transaction_num: String,
        // due_date: Date,
        // amount: Number,
        // open_balance: Number,
        // balance: Number,

module.exports = mongoose.model('vbDetail', {

    company_name: String,
    rowsdata:[{
        value: mongoose.Schema.Types.Mixed
    }],

    meta_rows: [{
        identifier: String,
        processing_date: Date,
        processing_amount :Date,
        notes: String
    }]

})
