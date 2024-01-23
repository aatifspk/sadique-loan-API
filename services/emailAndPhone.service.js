
const userModel = require("../models/user");
const Branch = require("../models/branch");

const statusCode = require('../utils/http-status-code');
const message = require("../languages/message");


// check email and phone already exist or not

// ### working code

// const checkEmailAnsPassword = async (phone, contactEmail, id) => {
//     const errors = [];

//     const mobExits = await userModel.findOne({ phone: phone });
//     if (mobExits) {
//         errors.push(message.lblPhoneAlreadyExists);
//     }


//     const emailExist1 = await userModel.findOne({ email: contactEmail });
//     if (emailExist1) {
//         errors.push(message.lblEmailAlreadyExists);
//     }



//     if (id) {

//         const mob = await Branch.findOne({ phone: phone });

//         if (mob) {
//             const batchId = mob._id;
//             const stringId = JSON.stringify(batchId)
//             if (JSON.parse(stringId) !== id) {
//                 errors.push(message.lblPhoneAlreadyExists);
//             }
//         }
//     }else{

//         const mob = await Branch.findOne({ phone: phone });

//         if(mob){
//             errors.push(message.lblPhoneAlreadyExists);
//         }
//     }

   


//     if(id){
//         const emailExist2 = await Branch.findOne({ contactEmail: contactEmail });

//         if(emailExist2){
//             const batchId = mob._id;
//             const stringId = JSON.stringify(batchId)
//             if (JSON.parse(stringId) !== id) {
//                 errors.push(message.lblEmailAlreadyExists);
//             }
//         }

//     }else{

//         const emailExist2 = await Branch.findOne({ contactEmail: contactEmail });

//         if(emailExist2){
//             errors.push(message.lblEmailAlreadyExists);
//         }
//     }

//     return errors;

// };





// ### optimize code to check email and phone already exist or not 

const checkEmailAnsPassword = async (phone, contactEmail, id) => {
    const errors = [];

    const checkIfExists = async (model, query, errorMessage) => {
        const result = await model.findOne(query);
        if (result && (!id || result._id.toString() !== id)) {
            errors.push(errorMessage);
        }
    };

    await Promise.all([
        checkIfExists(userModel, { phone }, message.lblPhoneAlreadyExists),
        checkIfExists(Branch, { phone }, message.lblPhoneAlreadyExists),
        checkIfExists(userModel, { email: contactEmail }, message.lblEmailAlreadyExists),
        checkIfExists(Branch, { contactEmail }, message.lblEmailAlreadyExists),
    ]);

    return errors;
};





// const mob = await Branch.findOne({ phone: phone });

    // if (mob) {

    //     errors.push(message.lblPhoneAlreadyExists);

    // if(id){
    //     const batchId = mob._id;
    //     const stringId = JSON.stringify(batchId)
    //     if (JSON.parse(stringId) !== id) {
    //         errors.push(message.lblPhoneAlreadyExists);
    //     }

    // }

    // }




     // const emailExist2 = await Branch.findOne({ contactEmail: contactEmail });

    // console.log("emailExist2", emailExist2);

    // if (emailExist2) {
    //     console.log("111");
        // const batchId = mob._id;
        // const stringId = JSON.stringify(batchId)
        // if (JSON.parse(stringId) !== id) {
        //     errors.push(message.lblEmailAlreadyExists);
        // }
    // }







module.exports = checkEmailAnsPassword;
