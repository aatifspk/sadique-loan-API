const mongoose = require("mongoose");

const ObjectId = mongoose.Schema.ObjectId;
 

const agentLoanMapSchema = new mongoose.Schema({

    deletedAt: {
        type: Date,
        default: null,
    },

},{ timestamps: true })


const agentLoanMapModel = mongoose.model("agentLoan", agentLoanMapSchema);


module.exports = agentLoanMapModel;