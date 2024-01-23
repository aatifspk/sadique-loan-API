const mongoose = require("mongoose");
const ObjectId = mongoose.Schema.ObjectId;

const employeeProfileSchema = new mongoose.Schema(
  {
    
    userId: { type: ObjectId, ref: "user" },
    staffId : { type : String, default : null},
    qualification : { type : String, default : null},
    designation : { type : String, default : null},
    department : { type : String, default : null},
    designation : { type : String, default : null},

    //upload document section
    resumePdf : { type : String, default : null},
    joiningLetterPdf : { type : String, default : null},
    otherPdf : { type : String, default : null},

    // bank detail section
    epfNumber : { type : String, default : null},
    basicSalary : { type : String, default : null},
    contractType : { type : String, default : null},
    location : { type : String, default : null},
    bankName : { type : String, default : null},
    bankIfsc : { type : String, default : null},
    bankBranch : { type : String, default : null},
    bankAccountType : { type : String, default : null},
    bankAccountNumber : { type : Number, default : null},

   
    createdAt: {
      type: Date,
      default: new Date(),
    },
  },
  { timeStamps: true }
);

const employeeProfileModal = mongoose.model("employeeProfile", employeeProfileSchema);

module.exports = employeeProfileModal;
