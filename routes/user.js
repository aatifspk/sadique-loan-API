const express = require("express");
let router = express.Router();
const {
    uploadProfile, uploadCombined
} = require('../utils/multer');

const multer = require('multer');
const statusCode = require('../utils/http-status-code');


const auth = require('../middleware/authorization/jwt')
// const { mailSender } = require("../common/emailSend");
// const userModel = require("../models/user");
// const Roles = require("../models/roles/roles");
// const statusCode = require('../utils/http-status-code');
// const errorMessage = require('../languages/message');
// const  generateOtp = require("../utils/randome");
// const bcrypt = require("bcrypt");

const userController = require("../controller/user")

router.post('/signUp', userController.signup);
router.post('/verifyOtp', userController.verifyOtp);
router.post('/signIn', userController.signIn);
router.post('/forgetpassword', userController.forgetpassword);
router.post('/resetpassword', userController.resetPassword);


// create and update profile.
router.post('/clientProfile', auth.checkUserAuth, (req, res, next) => {
    uploadProfile.single("profileImage")(req, res, (err) => {
        if (err) {
            if (err instanceof multer.MulterError) {
                // MulterError: File too large
                return res.status(statusCode.BadRequest).send({
                    message: 'File too large. Maximum file size allowed is 1 MB.'
                });
            } else {
                // Other errors
                console.error('Multer Error:', err.message);
                return res.status(statusCode.BadRequest).send({
                    message: err.message
                });
            }
        }
        next();
    });
}, userController.updateProfile);

// create and update identity.
router.post('/clientIdentity', auth.checkUserAuth, (req, res, next) => {
    uploadProfile.single("identityImage")(req, res, (err) => {
        if (err) {
            if (err instanceof multer.MulterError) {
                // MulterError: File too large
                return res.status(statusCode.BadRequest).send({
                    message: 'File too large. Maximum file size allowed is 1 MB.'
                });
            } else {
                // Other errors
                console.error('Multer Error:', err.message);
                return res.status(statusCode.BadRequest).send({
                    message: err.message
                });
            }
        }
        next();
    });
}, userController.identity);

// get profile
router.get('/getProfile', auth.checkUserAuth, userController.view);




// ###----------- apply for loan routes starts here-----------


// ##-----loan from details starts here

// submit loan from
router.post('/submitLoanDetailsForm', auth.checkUserAuth, userController.submitLoanDetailsForm);

// edit loan details from
router.post('/editLoanDetailsForm/:id', auth.checkUserAuth, userController.editLoanDetailsForm);

// get submitted loan from information
router.get('/getsubmitedLoanDetailsForm/:id', auth.checkUserAuth, userController.getSubmitLoanDetailsForm);

// ##-----loan from details ends here

// ##-----applicant info starts here

// submit applicant details
router.post('/submitApplicantInfo', auth.checkUserAuth, userController.submitApplicantInfo);

// edit applicant details
router.post('/editApplicantInfo/:id', auth.checkUserAuth, userController.editApplicantInfo);

// get applicant details
router.get('/getsubmitedApplicantInfo/:id', auth.checkUserAuth, userController.getSubmitedApplicantInfo);

// ##-----applicant info ends here

// ##-----applicant bank info starts here

// submit bank info
router.post('/submitApplicantBankInfo', auth.checkUserAuth, userController.submitApplicantBankInfo);

// edit bank info
router.post('/editApplicantBankInfo/:id', auth.checkUserAuth, userController.editApplicantBankInfo);

// get bank info
router.get('/getsubmitedApplicantBankInfo/:id', auth.checkUserAuth, userController.getSubmitedApplicantBankInfo);

// ##-----applicant bank info ends here


// ##-----applicant guarantor info starts here

// submit guarantor
router.post('/submitApplicantGuarantorInfo', auth.checkUserAuth, userController.submitApplicantGuarantorInfo);

// edit guarantor
router.post('/editApplicantGuarantorInfo/:id', auth.checkUserAuth, userController.editApplicantGuarantorInfo);

// get guarantor info
router.get('/getsubmitedApplicantGuarantorInfo/:id', auth.checkUserAuth, userController.getSubmitedApplicantGuarantorInfo);







// ##-----applicant guarantor info ends here



// ##-----applicant photo and signature starts here

const handleFileUploadError = (err, res, next) => {
    if (err) {
        if (err instanceof multer.MulterError) {
            // MulterError: File too large
            return res.status(statusCode.BadRequest).send({
                message: 'File too large. Maximum file size allowed is 1 MB.'
            });
        } else {
            // Other errors
            console.error('Multer Error:', err.message);
            return res.status(statusCode.BadRequest).send({
                message: err.message
            });
        }
    }
    next();
};

// upload photo and signature of client
router.post('/uploadPhotoAndSignature', auth.checkUserAuth, (req, res, next) => {

    uploadCombined.array("file")(req, res, (err) => {
        handleFileUploadError(err, res, next);
    });
}, userController.updatePhotoAndSignature);


// upload photo and signature of guarantor
router.post('/uploadPhotoAndSignatureOfGuarantor', auth.checkUserAuth, (req, res, next) => {

    uploadCombined.array("file")(req, res, (err) => {
        handleFileUploadError(err, res, next);
    });
}, userController.updatePhotoAndSignature);







// ##-----applicant phot and signature ends here















// ###----------- apply for loan routes ends here-----------






exports.router = router;


