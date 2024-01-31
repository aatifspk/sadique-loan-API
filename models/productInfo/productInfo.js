const mongoose = require("mongoose");

const ObjectId = mongoose.Schema.ObjectId;
 

const productInfoSchema = new mongoose.Schema({

    productId: { type: ObjectId, ref: "product" },

    title: { type: String, default: null },
    description: { type: String, default: null },
    termsAndCondition: { type: String, default: null },


    deletedAt: {
        type: Date,
        default: null,
    },

},{ timestamps: true })


const productInfoMapModel = mongoose.model("productInfo", productInfoSchema);


module.exports = productInfoMapModel;