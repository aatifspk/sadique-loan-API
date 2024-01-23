const mongoose = require("mongoose");

const ObjectId = mongoose.Schema.ObjectId;
 

const applicantInformationSchema = new mongoose.Schema({

    userId: { type: ObjectId, ref: "user" },

    // personal details

    firstName : {type :String , required : true},
    lastName : {type :String},
    dateOfBirth: { type: Date, default: null },
    maritalStatus : {type :String,default : null},  // option "unmarried", "married", "widow", "divorced", "other"
    email : {type :String , required : true},
    optionalEmail : {type :String , default : null},
    phone : {type :String , default : null},
    emergencyPhone : {type :String,default : null},
    city :  {type :String , default : null},    
    state :  {type :String , default : null},
    country :  {type :String , default : "India"},
    ZipCode :  {type :String , default : null},
    propertyOwnerShip :  {type :String , default : null},  // option "owned" or "rent"


    // Job details

    jobTitle :  {type :String , default : null},
    placeOfWork :  {type :String , default : null},
    workAddress :  {type :String , default : null},
    yearOfExperience :  {type :Number , default : null},
    monthlyNetIncome :  {type :Number , required : true},


    // indentity details

    
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


const applicantInformationpModel = mongoose.model("applicantInfprmation", applicantInformationSchema);


module.exports = applicantInformationpModel;