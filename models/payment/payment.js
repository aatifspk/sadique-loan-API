const mongoose = require("mongoose");

// const ObjectId = mongoose.Schema.ObjectId


const paymentSchema = new mongoose.Schema({

  userId: {
    type: String,
    required: true,
  },

  loanFormId: {
    type: String,
    required: true,
  },

  razorpay_order_id: {
    type: String,
    required: true,
  },
  razorpay_payment_id: {
    type: String,
    required: true,
  },
  razorpay_signature: {
    type: String,
    required: true,
  },

}, { timestamps: true });



const paymentModel = mongoose.model("payment", paymentSchema);


module.exports = paymentModel;