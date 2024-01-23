const mongoose = require("mongoose");
const ObjectId = mongoose.Schema.ObjectId;

const branchScrema = new mongoose.Schema(


    {

        branchName: { type: String, default: null },
        branchVisibleName: { type: String, default: null },
        branchCode: { type: String, required: true },
        pinCode: { type: String, default: null },
        openingDate: { type: Date, default: null },
        contactEmail: { type: String, default: null },
        landlineNumber: { type: String, default: null },
        phone: { type: Number, default: null },
        address: { type: String, default: null },
        locality: { type: String, default: null },
        city: { type: String, default: null },
        state: { type: String, default: null },
        country: { type: String, default: null },
        GSTIN: { type: String, default: null },
        country: { type: String, default: null },
        status: { type: Boolean, default: true },   // true for active and false for inActive
        deletedAt: {
            type: Date,
            default: null,
        },


        createdAt: {
            type: Date,
            default: new Date(),
        },

    },

    { timeStamps: true }
);

const branchModel = mongoose.model("branch", branchScrema);

module.exports = branchModel;
