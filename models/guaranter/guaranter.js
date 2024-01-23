const mongoose = require("mongoose");

const ObjectId = mongoose.Schema.ObjectId;
 

const bankInformationSchema = new mongoose.Schema({


    // bank details

    userId: { type: ObjectId, ref: "user" },

    firstName : {type :String , required : true},
    lastName : {type :String},
    email : {type :String , required : true},
    phone : {type :Number , required : true},
    relation : {type : String},

    jobTitle :  {type :String , default : null},
    placeOfWork :  {type :String , default : null},
    workAddress :  {type :String , default : null},
    yearOfExperience :  {type :Number , default : null},
    monthlyNetIncome :  {type :Number , default : null},


    // identity


    typeOfId1 : {type :String , default : null},
    typeOfId2 : {type :String , default : null},
    typeOfId3 : {type :String , default : null},
    typeOfId4 : {type :String , default : null},
    
    adharNumber :  {type :String , default : null},
    panNumber :  {type :String , default : null},
    voterNumber :  {type :String , default : null},
    drivingLicenseNumber :  {type :String , default : null},


    deletedAt: {
        type: Date,
        default: null,
    }

   
},{ timestamps: true })


const bankInformationpModel = mongoose.model("bankInfprmation", bankInformationSchema);


module.exports = bankInformationpModel;