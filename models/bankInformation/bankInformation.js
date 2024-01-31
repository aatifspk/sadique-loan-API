const mongoose = require("mongoose");

const ObjectId = mongoose.Schema.ObjectId;


const bankInformationSchema = new mongoose.Schema({


    // bank details

    userId: { type: ObjectId, ref: "user" },
    loanFormId : {type :ObjectId, ref :"applicantLoanDetail"},

    bankName: { type: String, required: true },
    branchName: { type: String, required: true },
    accountType: { type: String, required: true },
    accountNumber: { type: String, required: true },
    ifscCode: { type: String, required: true },

    passBookFrontImage: { type: String, default: null },
    passBookBackImage: { type: String, default: null },

    deletedAt: {
        type: Date,
        default: null,
    }


}, { timestamps: true })


const bankInformationpModel = mongoose.model("bankInformation", bankInformationSchema);


module.exports = bankInformationpModel;