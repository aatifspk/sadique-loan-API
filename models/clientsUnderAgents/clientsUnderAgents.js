const mongoose = require("mongoose");
const ObjectId = mongoose.Schema.ObjectId;

const clientsUnderAgentScrema = new mongoose.Schema(


    {

        userId: { type: ObjectId, ref: "user" },

        clinetsIdList : {type: String, default : null},

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

const clientUnderAgentModel = mongoose.model("clientsUnderAgent", clientsUnderAgentScrema);

module.exports = clientUnderAgentModel;
