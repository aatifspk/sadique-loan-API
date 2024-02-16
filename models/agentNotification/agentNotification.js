const mongoose = require("mongoose");
const ObjectId = mongoose.Schema.ObjectId;

const agentNotificationScrema = new mongoose.Schema(


    {

        userId: { type: ObjectId, ref: "user" },


        head: { type: String, default: null },
        body: {type : String, default : null },
        importantId : {type : String, default : null},
        notificationType : {type : Number, required : true},   // 1 for loan form, 2 for verified by agent, 3 for query by user.


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

const agentNotificationModel = mongoose.model("agentNotification", agentNotificationScrema);

module.exports = agentNotificationModel;