const express = require("express");
let router = express.Router();
const {
    uploadProfile
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

const userController  = require("../controller/user")

router.post('/signUp', userController.signup );
router.post('/verifyOtp', userController.verifyOtp );
router.post('/signIn', userController.signIn );
router.post('/forgetpassword', userController.forgetpassword );
router.post('/resetpassword', userController.resetPassword );


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


router.get('/getProfile', auth.checkUserAuth , userController.view );




exports.router = router;


