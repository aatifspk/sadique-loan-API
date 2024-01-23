
const { mailSender } = require("../common/emailSend");
const jwt = require("jsonwebtoken");
const dotnev = require("dotenv");
dotnev.config();
const PRIVATEKEY = process.env.PRIVATEKEY;

const userModel = require("../models/user");
const Roles = require("../models/roles/roles");
const statusCode = require('../utils/http-status-code');
const errorMessage = require('../languages/message');
const generateOtp = require("../utils/randome");
const bcrypt = require("bcrypt");
// const message = require("../languages/message");

// signUp
exports.signup = async (req, res) => {
    try {

        const { firstName, email, password, roleId, tc } = req.body;
        if (!firstName) {
            return res.status(statusCode.BadRequest).send({
                message: "First Name is required."
            })
        }

        if (!tc) {
            return res.status(statusCode.BadRequest).send({
                message: "please accept terms and condition."
            })
        }

        const userExist = await userModel.findOne({ email: email });

        if (userExist) {
            if (userExist?.isVerified) {
                return res.status(statusCode.Conflict)
                    .send({
                        message: errorMessage.lblEmailAlreadyExists,
                    });
            } else {
                const otp = generateOtp.generateOTP()

                await userModel.updateOne({ email: email }, {
                    verificationOtp: otp,
                    otpGeneratedAt: new Date()
                })

                // console.log("otp", otp);
                const mailOptions = {
                    from: "aatif13698@gmail.com",
                    to: email,
                    subject: "Email Verification for DYNO",
                    template: "email",
                    context: {
                        otp: otp,
                        name: firstName,
                    },
                };

                // await mailSender(req, res, otp, firstName, email)
                await mailSender(mailOptions);

                return res.status(statusCode.OK).send({
                    message: "An Email Verification OTP Has Been Sent To Your Mail Id.."
                })
            }

        } else {
            const roleObjId = await Roles.findOne({ id: roleId });
            // console.log("roleObjId", roleObjId);
            const otp = generateOtp.generateOTP();
            const hash = bcrypt.hashSync(password, 10);
            // console.log("hash",hash);

            const user = await userModel.create({
                firstName: firstName,
                email: email,
                password: hash,
                tc: tc,
                roleId: roleId,
                Role: roleObjId._id,
                verificationOtp: otp,
                otpGeneratedAt: new Date()
            });
            // console.log("otp",otp);

            const mailOptions = {
                from: "aatif13698@gmail.com",
                to: email,
                subject: "Email Verification for DYNO",
                template: "email",
                context: {
                    otp: otp,
                    name: firstName,
                },
            };

            // await mailSender(req, res, otp, firstName, email);
            await mailSender(mailOptions);

            return res.status(statusCode.OK).send({
                message: "An Email Verification OTP Has Been Sent To Your Mail Id.."
            })
        }

    } catch (error) {
        return res.send({
            message: error
        })
    }
}

// verify otp
exports.verifyOtp = async (req, res) => {
    try {
        const { email, otp } = req.body;

        const userExist = await userModel.findOne({ email: email });

        if (userExist) {
            const currentTimestamp = new Date();

            // Check if the OTP has expired
            if (userExist.otpGeneratedAt && currentTimestamp - userExist.otpGeneratedAt <= 5 * 60 * 1000) {
                if (userExist.verificationOtp == otp) {
                    // Update user as verified
                    await userModel.updateOne({ email: email }, { isVerified: true });

                    return res.status(statusCode.OK).send({
                        message: "Verification Success"
                    });
                } else {
                    return res.status(statusCode.Conflict).send({
                        message: "OTP not matched"
                    });
                }
            } else {
                // OTP has expired
                return res.status(statusCode.BadRequest).send({
                    message: "OTP has expired. Please request a new one."
                });
            }
        } else {
            return res.status(statusCode.BadRequest).send({
                message: "User not found"
            });
        }
    } catch (error) {
        return res.status(statusCode.InternalServerError).send({
            message: errorMessage.lblInternalServerError
        });
    }
};

// signIn for clients
exports.signIn = async (req, res) => {

    try {
        const { email, password, remenberme } = req.body;
        const userExist = await userModel.findOne({ email: email }).populate('Role');
        if (userExist) {
            if (!userExist?.isActive) {
                return res.status(statusCode.Unauthorized).send({
                    message: "Your Account has been deactivated, please raise a ticket for it."
                })
            }
            if (userExist?.isVerified) {
                if (userExist?.roleId < 3) {
                    return res.status(statusCode.Unauthorized).send({
                        message: "Unauthorized to access this."
                    })
                }

                const isAuth = bcrypt.compareSync(password, userExist.password);
                if (isAuth) {
                    const token = jwt.sign({ email: req.body.email }, PRIVATEKEY);
                    return res.status(statusCode.OK).send({
                        user: {
                            info: userExist,
                            token: token
                        },
                        message: "Login Success."
                    })
                } else {
                    return res.status(statusCode.BadRequest).send({
                        message: "Password Not Matched."
                    })
                }
            } else {
                return res.status(statusCode.Unauthorized).send({
                    message: "Unverified User, please verify you email"
                })
            }
        } else {
            return res.status(statusCode.BadRequest).send({
                message: "User not find"
            })
        }
    } catch (error) {
        console.log("error", error);
        return res.status(statusCode.InternalServerError).send({
            message: errorMessage.lblInternalServerError
        })
    }
}

// forget passwoed 
exports.forgetpassword = async (req, res) => {
    try {
        const { email } = req.body;
        const userExist = await userModel.findOne({ email: email })
        if (userExist) {
            if (!userExist?.isActive) {
                return res.status(statusCode.Unauthorized).send({
                    message: "Your Account has been deactivated, please raise a ticket for it."
                })
            }
            if (userExist?.isVerified) {
                const otp = generateOtp.generateOTP();
                await userModel.updateOne({ email: email }, {
                    OTP: otp
                })
                const mailOptions = {
                    from: "aatif13698@gmail.com",
                    to: email,
                    subject: "Email Verification for DYNO",
                    template: "forgetPassword",
                    context: {
                        otp: otp,
                        name: userExist?.firstName,
                    },
                };
                await mailSender(mailOptions)
                return res.status(statusCode.OK).send({
                    message: "OTP sent to your mail id."
                })
            } else {
                return res.status(statusCode.Unauthorized).send({
                    message: "Unverified User, please verify you email"
                })
            }
        } else {
            return res.status(statusCode.BadRequest).send({
                message: "User not find"
            })
        }
    } catch (error) {
        console.log("error", error);
        return res.status(statusCode.InternalServerError).send({
            message: errorMessage.lblInternalServerError
        })
    }
}

// reset password 
exports.resetPassword = async (req, res) => {
    try {
        const { email, password, otp } = req.body;
        const userExist = await userModel.findOne({ email: email })
        if (userExist) {
            if (!userExist?.isActive) {
                return res.status(statusCode.Unauthorized).send({
                    message: "Your Account has been deactivated, please raise a ticket for it."
                })
            }
            if (userExist?.isVerified) {

                console.log("userExist?.OTP", userExist?.OTP);

                if (otp == userExist?.OTP) {

                    const hash = bcrypt.hashSync(password, 10);
                    await userModel.updateOne({ email: email }, {
                        password: hash,
                    })

                    return res.status(statusCode.OK).send({
                        message: "Password reset successfull."
                    })

                } else {
                    return res.status(statusCode.Conflict).send({
                        message: "OTP not matched."
                    })
                }

            } else {
                return res.status(statusCode.Unauthorized).send({
                    message: "Unverified User, please verify you email"
                })
            }
        } else {
            return res.status(statusCode.BadRequest).send({
                message: "User not find"
            })
        }
    } catch (error) {
        console.log("error", error);
        return res.status(statusCode.InternalServerError).send({
            message: errorMessage.lblInternalServerError
        })
    }
}

// update profile
exports.updateProfile = async (req, res) => {

    try {

        const user = req.user;
        const { firstName, lastName, fatherName, motherName, gender, dateOfBirth, maritalStatus, optionalEmail, emergencyPhone, phone, city, state, ZipCode, email } = req.body;
        let profileImageName = null;
        if (req.file && req.file.filename) {
            profileImageName = req.file.filename
        } else {
            return res.status(statusCode.BadRequest).send({
                message: "image Not Provided"
            })
        }

        const userExist = await userModel.findOne({ email: user.email });
        if (userExist) {
            const update = await userModel.updateOne({ email: user.email }, {
                firstName: firstName,
                lastName: lastName,
                fatherName: fatherName,
                motherName: motherName,
                gender: gender,
                dateOfBirth: dateOfBirth,
                maritalStatus: maritalStatus,
                optionalEmail: optionalEmail,
                emergencyPhone: emergencyPhone,
                phone : phone,
                city: city,
                state: state,
                ZipCode: ZipCode,
                profileImage: profileImageName
            })
            if (update) {
                return res.status(statusCode.OK).send({
                    message: "Profile updated successfully."
                })
            } else {
                return res.status(statusCode.ExpectationFailed).send({
                    message: "Error Occured while updating the profile"
                })
            }

        } else {
            return res.status(statusCode.NotFound).send({
                message: "User Not Found"
            })
        }
    } catch (error) {
        console.log("error", error);
        return res.status(statusCode.InternalServerError).send({
            message: errorMessage.lblInternalServerError
        })
    }
}

// get profile

exports.getProfile = async (req,res) => {
    try {

        const id = req.params?.id;

        const user = await userModel.findById(id);

        if(user){
            console.log("user",user);

            const {profileImage,firstName, lastName, fatherName, motherName, gender, dateOfBirth, maritalStatus, optionalEmail, emergencyPhone, phone, city, state, ZipCode, email  } = user

            if(profileImage && dateOfBirth && gender && maritalStatus){

                const data = {profileImage,firstName, lastName, fatherName, motherName, gender, dateOfBirth, maritalStatus, optionalEmail, emergencyPhone, phone, city, state, ZipCode,email}

                return res.status(statusCode.OK).send({
                    data : data,
                    message : "data"
                })

            }else{

                return res.status(statusCode.NotFound).send({
                    message: "Profile Not Found."
                })
            }

        }else{
            return res.status(statusCode.NotFound).send({
                message: "User Not Found."
            })
        }




    } catch (error) {
        console.log("error", error);
        return res.status(statusCode.InternalServerError).send({
            message: errorMessage.lblInternalServerError
        })
    }
}

// update identity
exports.identity = async (req, res) => {

    try {

        const user = req.user;
        const { adharNumber, panNumber, voterNumber, drivingLicenseNumber} = req.body;
        let profileImageName = null;
        if (req.file && req.file.filename) {
            profileImageName = req.file.filename
        } else {
            return res.status(statusCode.BadRequest).send({
                message: "image Not Provided"
            })
        }

        const userExist = await userModel.findOne({ email: user.email });
        if (userExist) {
            const update = await userModel.updateOne({ email: user.email }, {
                adharNumber: adharNumber,
                panNumber: panNumber,
                voterNumber: voterNumber,
                drivingLicenseNumber: drivingLicenseNumber,
             })
            if (update) {
                return res.status(statusCode.OK).send({
                    message: "Profile updated successfully."
                })
            } else {
                return res.status(statusCode.ExpectationFailed).send({
                    message: "Error Occured while updating the profile"
                })
            }

        } else {
            return res.status(statusCode.NotFound).send({
                message: "User Not Found"
            })
        }
    } catch (error) {
        console.log("error", error);
        return res.status(statusCode.InternalServerError).send({
            message: errorMessage.lblInternalServerError
        })
    }
}

// view profile
exports.view = async (req, res) => {

    try {

        const user = req.user;
        const userExist = await userModel.findOne({ email: user.email });
        if (userExist) {
            return res.status(statusCode.OK).send({
                message: "Profile Found Suucessfully.",
                profile: user
            })
        } else {
            return res.status(statusCode.NotFound).send({
                message: "User Not Found"
            })
        }

    } catch (error) {

        console.log("error", error);
        return res.status(statusCode.InternalServerError).send({
            message: errorMessage.lblInternalServerError
        })

    }

}

