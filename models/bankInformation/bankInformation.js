const mongoose = require("mongoose");

const ObjectId = mongoose.Schema.ObjectId;
 

const bankInformationSchema = new mongoose.Schema({


    // bank details

    userId: { type: ObjectId, ref: "user" },
    bankName : {type :String , required : true},
    branchName : {type :String,required : true},
    accountType : {type :String,required : true},
    accountNumber :  {type :String , required : true},  
    ifscCode : {type :String , required : true}, 





    deletedAt: {
        type: Date,
        default: null,
    }

   
},{ timestamps: true })


const bankInformationpModel = mongoose.model("bankInfprmation", bankInformationSchema);


module.exports = bankInformationpModel;