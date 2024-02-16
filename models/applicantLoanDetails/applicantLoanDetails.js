const mongoose = require("mongoose");
const ObjectId = mongoose.Schema.ObjectId;

const applicantLoanDetailScrema = new mongoose.Schema(


    {

        userId: { type: ObjectId, ref: "user" }, // applicant user id


        loanName: { type: String, default: null },
        loanId: { type: String, default: null },
        rateOfInterest: { type: Number, required: true },
        rateTyep: {type : String, default : null },
        recoveryType :  {type : String, default : null },
        processingFeePercent: { type: Number, required: true },
        processingFeeAmount: { type: Number, required: true },

        amountDisburse : { type: Number, default: null },
        amountSanctioned : { type: Number, default: null },
        emiAmount: { type: Number, default: null },
        NoOfEmi: { type: Number, default: null },


        createdAt: {
            type: Date,
            default: new Date(),
        },

        deletedAt: {
            type: Date,
            default: null,
        },

    },

    { timeStamps: true }
);

const applicantLoanDetailModel = mongoose.model("applicantLoanDetail", applicantLoanDetailScrema);

module.exports = applicantLoanDetailModel;
