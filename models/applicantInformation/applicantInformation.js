const mongoose = require("mongoose");

const ObjectId = mongoose.Schema.ObjectId;
 

const applicantInformationSchema = new mongoose.Schema({

    userId: { type: ObjectId, ref: "user" },

    loanFormId : {type :ObjectId, ref :"applicantLoanDetail"},

    // personal details

    firstName : {type :String , required : true},
    lastName : {type :String},
    fatherName : {type :String},
    motherName : {type :String},
    dateOfBirth: { type: Date, default: null },
    maritalStatus : {type :String,default : null},  // option "unmarried", "married", "widow", "divorced", "other"
    gender :  {type :String,default : null}, 
    email : {type :String , required : true},
    optionalEmail : {type :String , default : null},
    phone : {type :String , default : null},
    emergencyPhone : {type :String,default : null},
    city :  {type :String , default : null},    
    state :  {type :String , default : null},
    address : {type :String , default : null},
    country :  {type :String , default : "India"},
    ZipCode :  {type :String , default : null},
    propertyOwnerShip :  {type :String , default : null},  // option "owned" or "rent"


    // Job details 

    jobTitle :  {type :String , default : null},
    placeOfWork :  {type :String , default : null},
    yearOfExperience :  {type :Number , default : null},
    monthlyNetIncome :  {type :Number , default : null},


    // indentity details

    typeOfId1 : {type :String , default : null},
    typeOfId2 : {type :String , default : null},
    typeOfId3 : {type :String , default : null},
    typeOfId4 : {type :String , default : null},

    adharNumber :  {type :String , default : null},
    panNumber :  {type :String , default : null},
    voterNumber :  {type :String , default : null},
    drivingLicenseNumber :  {type :String , default : null},

    adharFrontImage :  {type :String , default : null},
    adharBackImage :  {type :String , default : null},

    panFrontImage :  {type :String , default : null},
    panBackImage :  {type :String , default : null},

    voterFrontImage :  {type :String , default : null},
    voterBackImage :  {type :String , default : null},

    drivingFrontImage :  {type :String , default : null},
    drivingBackImage :  {type :String , default : null},

    // phot and signature

    photo :  {type :String , default : null},
    signature :  {type :String , default : null},




    deletedAt: {
        type: Date,
        default: null,
    }

   
},{ timestamps: true })


const applicantInformationpModel = mongoose.model("applicantInfprmation", applicantInformationSchema);


module.exports = applicantInformationpModel;