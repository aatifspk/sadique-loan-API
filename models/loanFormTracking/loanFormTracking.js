const mongoose = require("mongoose");
const ObjectId = mongoose.Schema.ObjectId;

const loanFormTrackingScrema = new mongoose.Schema(


    {

        userId: { type: ObjectId, ref: "user" },
        agentId : { type: ObjectId, ref: "user", default : null },
        loanFormId: { type: ObjectId, ref: "applicantLoanDetail" },
        branchId : { type: ObjectId, ref: "branch", default : null },

        productId : { type: ObjectId, ref: "product", default : null },

        
        status : {type : Boolean, default : true},


        pending : {type : Boolean, default : true},

        // final loan Apploval by super admin
        approval : { type : Boolean, default : false},
        approvedBy : {type: String, default : null},
        approvedOn : { type: Date, default : null},
        loanApprovalPdf : {type: String, default : null},


        // loan discarded at the time of assigning agent by super admin 
        applicationDiscard : {type : Boolean, default : false},
        applicationDiscardBy : {type : String, default : null},


        // loan verified by agent
        applicationVerified : {type : Boolean, default : false},
        applicationVerifiedBy : {type : String, default : null},

        // loan rejected by agent
        applicationRjected : {type : Boolean, default : false},
        applicationRejectedBy : {type : String, default : null},



        // agent and branch assign by super admin
        agentAndBranchAssignedBy :{type : String, default : null},


        isAgentAssigned : {type : Boolean, default : false},

        // agentId : {type: String, default : null},

        isBranchAssigned : {type : Boolean, default : false},
        assignedBranchId : {type: String, default : null},

        stepAt : {type : String, default : null},

        loanFormCompleted : {type : Boolean, default : false},
        applicantInfoCompleted : {type : Boolean, default : false},
        bankInfoCompleted : {type : Boolean, default : false},
        guarantorInfoCompleted : {type : Boolean, default : false},
        guarantorIdentityUploadCompleted : {type : Boolean, default : false},
        applicantIdentityUploadCompleted : {type : Boolean, default : false},

        applicantPhotoAndSignatureUploadCompleted : {type : Boolean, default : false},

        isStepsCompleted : {type : Boolean, default : false},

        submittedByOwn : {type : Boolean, default : true},
        fromSubmittedOn : { type: Date, default : null},
        fromSubmittedBy : {type : String, default : null},


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
