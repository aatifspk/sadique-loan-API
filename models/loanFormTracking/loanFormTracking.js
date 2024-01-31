const mongoose = require("mongoose");
const ObjectId = mongoose.Schema.ObjectId;

const loanFormTrackingScrema = new mongoose.Schema(


    {

        userId: { type: ObjectId, ref: "user" },
        agentId : { type: ObjectId, ref: "user", default : null },
        loanFormId: { type: ObjectId, ref: "applicantLoanDetail" },
        branchId : { type: ObjectId, ref: "branch", default : null },
        

        status : {type : Boolean, default : true},
        approval : { type : Boolean, default : false},
        pending : {type : Boolean, default : true},
        agentAssigned : {type : Boolean, default : false},
        branchAssigned : {type : Boolean, default : false},

        stepAt : {type : String, default : null},
        isStepsCompleted : {type : Boolean, default : false},

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

const loanFormTrackingModel = mongoose.model("loanFormTracking", loanFormTrackingScrema);

module.exports = loanFormTrackingModel;
