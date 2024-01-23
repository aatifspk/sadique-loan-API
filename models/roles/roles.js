const mongoose = require("mongoose");

// const ObjectId = mongoose.Schema.ObjectId


const roleSchema = new mongoose.Schema({

    id : {type : Number},
    name : {type : String},
    capability : {type : String},
    isActive :{type : Number, default : 1}

},{timestamps:true});



const roleModel = mongoose.model("role", roleSchema);


module.exports = roleModel;