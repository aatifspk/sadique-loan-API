const mongoose = require("mongoose");
const ObjectId = mongoose.Schema.ObjectId;

const loanRecoveryRecordScrema = new mongoose.Schema(


    {

        userId: { type: ObjectId, ref: "user" },  // applicant user id

        agentId : { type: ObjectId, ref: "user", default : null },   // agent id
        loanFormId: { type: ObjectId, ref: "applicantLoanDetail" },  // loan from id
        branchId : { type: ObjectId, ref: "branch", default : null }, // branch id


        approvedBy : {type: String, default : null},

        disbursedAmount : {type: Number, default : null},
        repaymentAmpount : {type: Number, default : null},
        
        emiDataObject :{type: String, default : null},

        iseEmiCompleted : {type : Boolean, default : false},

        originalRateOfInterest : {type: Number, default : null},

        paneltyRateOfInterest: {type: Number, default : null},

        sanctionedDate :  { type: Date, default : null},


        isLoanClosed :  {type : Boolean, default : false},
        loanClosedOn: { type: Date, default : null},
        loanClosedBy : {type: String, default : null},    // who closed the loan?

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

const loanRecoveryRecordModel = mongoose.model("loanRecoveryRecord", loanRecoveryRecordScrema);

module.exports = loanRecoveryRecordModel;
