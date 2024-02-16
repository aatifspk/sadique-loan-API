const mongoose = require("mongoose");
const ObjectId = mongoose.Schema.ObjectId;

const producthScrema = new mongoose.Schema(


    {

        productName: { type: String, default: null },
        intoducedDate: { type: Date, default: null },
        AmountRangeStart: { type: Number, default: null },
        AmountRangeEnd: { type: Number, default: null },
        rateOfInterest: { type: Number, required: true },
        rateTyep: {type : String, default : "day"}, // day, week, month, year
        processChargeInclude: {  type: Boolean, default: false  },
        processFeePercent: { type: Number, required: true },
        recoveryType: { type: String, default: null }, // day, week, month, year
        productStatus: { type: Boolean, default: true },  // not for frontend
        holidayExclude: { type: Boolean, default: false },  // yes , no
        emiAmount: { type: Number, default: null },
        NoOfEmi: { type: Number, default: null },
        gstchargeInclude: { type: Boolean, default: false },  // yes , no
        gstChargePercent: { type: Number, default: null },



        // documents required
        aharRequired: { type: Boolean, default: false },    // yes , no
        panRequired: { type: Boolean, default: false },  // yes , no
        voterRequired: { type: Boolean, default: false },  // yes , no
        drivingLicenseRequired: { type: Boolean, default: false },  // yes , no
        propertyPaperRequired: { type: Boolean, default: false },  // yes , no

        // document mendetory
        aharMandatory: { type: Boolean, default: false },    // yes , no
        panMandatory: { type: Boolean, default: false },  // yes , no
        voterMandatory: { type: Boolean, default: false },  // yes , no
        drivingLicenseMandatory: { type: Boolean, default: false },  // yes , no
        propertyPaperMandatory: { type: Boolean, default: false },  // yes , no



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

const productModel = mongoose.model("product", producthScrema);

module.exports = productModel;
