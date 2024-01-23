const mongoose = require("mongoose");
const ObjectId = mongoose.Schema.ObjectId;

const producthScrema = new mongoose.Schema(


    {

        productName: { type: String, default: null },
        intoducedDate: { type: Date, default: null },
        AmountRangeStart: { type: Number, default: null },
        AmountRangeEnd: { type: Number, default: null },
        rateOfInterest: { type: Number, required: true },
        rateTyep: {type : String, default : "day"},
        processChargeInclude: {  type: Boolean, default: false  },
        processFeePercent: { type: Number, required: true },
        recoveryType: { type: String, default: null },
        productStatus: { type: Boolean, default: true },
        holidayExclude: { type: Boolean, default: false },
        emiAmount: { type: Number, default: null },
        NoOfEmi: { type: Number, default: null },
        gstchargeInclude: { type: Boolean, default: false },
        gstChargePercent: { type: Number, default: null },



        // documents required
        aharRequired: { type: Boolean, default: false },
        panRequired: { type: Boolean, default: false },
        voterRequired: { type: Boolean, default: false },
        drivingLicenseRequired: { type: Boolean, default: false },
        propertyPaperRequired: { type: Boolean, default: false },



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
