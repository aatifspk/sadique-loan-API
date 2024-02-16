const mongoose = require("mongoose");
const ObjectId = mongoose.Schema.ObjectId;

const clientNotificationScrema = new mongoose.Schema(


    {

        userId: { type: ObjectId, ref: "user" },

        head: { type: String, default: null },
        body: {type : String, default : null },
        importantId : {type : String, default : null},

        isRead : {type : Boolean, default:false},

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

const clientNotificationModel = mongoose.model("clientNotification", clientNotificationScrema);

module.exports = clientNotificationModel;
