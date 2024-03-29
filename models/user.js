const mongoose = require("mongoose");

const ObjectId = mongoose.Schema.ObjectId;
 

const userSchema = new mongoose.Schema({

    Role : {type:ObjectId, ref : "role"},
    branchId : {type:ObjectId, ref : "branch"},
    createdBy : {type:ObjectId, ref : "user"},
    firstName : {type :String , required : true},
    lastName : {type :String},
    middleName : {type :String},
    fatherName : {type :String,default : null},
    motherName : {type :String,default : null},
    gender : {type :String,default : null},
    dateOfBirth: { type: Date, default: null },
    maritalStatus : {type :String,default : null},
    email : {type :String , required : true},
    optionalEmail : {type :String , default : null},
    phone : {type :String , default : null},
    officePhone : {type :String , default : null},
    emergencyPhone : {type :String,default : null},
    city :  {type :String , default : null},    
    state :  {type :String , default : null},
    country :  {type :String , default : "India"},
    ZipCode :  {type :String , default : null},
    address : {type :String , default : null},
    password : {type :String , required : true},
    adharNumber :  {type :String , default : null},
    panNumber :  {type :String , default : null},
    voterNumber :  {type :String , default : null},
    drivingLicenseNumber :  {type :String , default : null},
    tc : {type :Boolean , required : true},
    isVerified : {type : Boolean, default:false},
    isActive : {type : Boolean, default:true},

    // designation
    designation : {type :String , default : null},

    // upload section
    profileImage : { type : String, default : null},
    voterCardImage : { type : String, default : null},
    panCardImage : { type : String, default : null},
    adharCardImage : { type : String, default : null},
    drivingLicenseImage : { type : String, default : null}, 

    profileCreated : {type : Boolean, default:false},

    // created by
    // createdBy : {type : String, default : null},

    deletedAt: {
        type: Date,
        default: null,
    },

    contactOwner : {type : String, default : null},


    //  id and otp section
    roleId : { type : Number},
    verificationOtp : {type : String},
    otpGeneratedAt : {type : Date},
    OTP : {type:String},
    deletedAt: {
        type: Date,
        default: null,
    },

},{ timestamps: true })


const userModel = mongoose.model("user", userSchema);


module.exports = userModel;