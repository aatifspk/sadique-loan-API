const mongoose = require("mongoose");

const ObjectId = mongoose.Schema.ObjectId;


const guarantorSchema = new mongoose.Schema({


    // bank details

    userId: { type: ObjectId, ref: "user" },
    loanFormId: { type: ObjectId, ref: "applicantLoanDetail" },


    firstName: { type: String, required: true },
    lastName: { type: String, default: null },
    email: { type: String, required: true },
    phone: { type: Number, required: true },
    relation: { type: String },

    // jobTitle: { type: String, default: null },
    // placeOfWork: { type: String, default: null },
    // workAddress: { type: String, default: null },
    // yearOfExperience: { type: Number, default: null },
    // monthlyNetIncome: { type: Number, default: null },

    // identity

    // typeOfId1: { type: String, default: null },
    // typeOfId2: { type: String, default: null },
    // typeOfId3: { type: String, default: null },
    // typeOfId4: { type: String, default: null },

    adharNumber: { type: String, default: null },
    // panNumber: { type: String, default: null },
    // voterNumber: { type: String, default: null },
    // drivingLicenseNumber: { type: String, default: null },


    // photo: { type: String, default: null },
    // signature :  {type :String , default : null},


    adharFrontImage: { type: String, default: null },
    adharBackImage: { type: String, default: null },

    // panFrontImage: { type: String, default: null },
    // panBackImage: { type: String, default: null },

    // voterFrontImage: { type: String, default: null },
    // voterBackImage: { type: String, default: null },

    // drivingFrontImage: { type: String, default: null },
    // drivingBackImage: { type: String, default: null },

    deletedAt: {
        type: Date,
        default: null,
    }


}, { timestamps: true })


const guarantorModel = mongoose.model("guarantor", guarantorSchema);


module.exports = guarantorModel;