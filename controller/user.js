
const { mailSender } = require("../common/emailSend");
const jwt = require("jsonwebtoken");
const dotnev = require("dotenv");
dotnev.config();
const PRIVATEKEY = process.env.PRIVATEKEY;

const userModel = require("../models/user");
const Roles = require("../models/roles/roles");
const ApplicantForm = require("../models/applicantLoanDetails/applicantLoanDetails");
const ApplicantInfo = require("../models/applicantInformation/applicantInformation");
const BankInfo = require("../models/bankInformation/bankInformation");
const GuarantorInfo = require("../models/guaranter/guaranter");
const LoanFormTracking = require("../models/loanFormTracking/loanFormTracking")




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
        // let profileImageName = null;

        let profileObject = {
            firstName: firstName,
            lastName: lastName,
            fatherName: fatherName,
            motherName: motherName,
            gender: gender,
            dateOfBirth: dateOfBirth,
            maritalStatus: maritalStatus,
            optionalEmail: optionalEmail,
            emergencyPhone: emergencyPhone,
            phone: phone,
            city: city,
            state: state,
            ZipCode: ZipCode,
            profileCreated: true
        }

        if (req.file && req.file.filename ) {
            // profileImageName = req.file.filename
            profileObject = {
                ...profileObject,
                profileImage : req.file.filename

            }
        } 
        // else {
        //     return res.status(statusCode.BadRequest).send({
        //         message: "image Not Provided"
        //     })
        // }

        // remove profile image 

        if (req.body.removeProfileImage == "true") {
            profileObject = {
                profileImage: null,
                ...profileObject
            };
        }


        const userExist = await userModel.findOne({ email: user.email });
        if (userExist) {
            const update = await userModel.updateOne({ email: user.email }, {...profileObject})
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

exports.getProfile = async (req, res) => {
    try {

        const id = req.params?.id;

        const user = await userModel.findById(id);

        if (user) {
            console.log("user", user);

            const { profileImage, firstName, lastName, fatherName, motherName, gender, dateOfBirth, maritalStatus, optionalEmail, emergencyPhone, phone, city, state, ZipCode, email } = user

            if (profileImage && dateOfBirth && gender && maritalStatus) {

                const data = { profileImage, firstName, lastName, fatherName, motherName, gender, dateOfBirth, maritalStatus, optionalEmail, emergencyPhone, phone, city, state, ZipCode, email }

                return res.status(statusCode.OK).send({
                    data: data,
                    message: "data"
                })

            } else {

                return res.status(statusCode.NotFound).send({
                    message: "Profile Not Found."
                })
            }

        } else {
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
        const { adharNumber, panNumber, voterNumber, drivingLicenseNumber } = req.body;
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




// ###----------- apply for loan controller starts here-----------


// ##-----loan from details starts here

// submit Loan Details Form
exports.submitLoanDetailsForm = async (req, res) => {

    try {

        const dataObject = req.body


        const user = req.user;
        const userExist = await userModel.findOne({ email: user.email });

        if (userExist) {


            const formSubmit = await ApplicantForm.create(dataObject);

            const trackingDetails = {

                userId: userExist._id,
                loanFormId: formSubmit._id,
                stepAt: "1"
            }

            const tracking = await LoanFormTracking.create(trackingDetails)

            return res.status(statusCode.OK).send({
                message: "Sucessfully submitted...",
                loanForm: formSubmit
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

// edit loan details from
exports.editLoanDetailsForm = async (req, res) => {

    try {

        const dataObject = req.body;
        const { id } = req.params;


        const user = req.user;
        const userExist = await userModel.findOne({ email: user.email });

        if (userExist) {

            const formSubmit = await ApplicantForm.findById(id);

            if (formSubmit) {

                const update = await ApplicantForm.updateOne({ _id: id }, { ...dataObject });

                if (update.acknowledged) {
                    return res.status(statusCode.OK).send({
                        message: "Form Updated Successsfully...",
                    })
                } else {
                    return res.status(statusCode.ExpectationFailed).send({
                        message: "Error occured in editting the loan from.."
                    })
                }


            } else {
                return res.status(statusCode.NotFound).send({
                    message: "Form Not Found"
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

// get submitted loan from information
exports.getSubmitLoanDetailsForm = async (req, res) => {

    try {

        const { id } = req.params;

        const user = req.user;
        const userExist = await userModel.findOne({ email: user.email });

        if (userExist) {

            const formSubmit = await ApplicantForm.findById(id).populate("userId");

            if (formSubmit) {
                return res.status(statusCode.OK).send({
                    message: "Sucessfully Found...",
                    fromDetails: formSubmit
                })
            } else {
                return res.status(statusCode.NotFound).send({
                    message: "Form Details Not Found..."
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

// ##-----loan from details ends here


// ##-----applicant info starts here

// submit applicant info
exports.submitApplicantInfo = async (req, res) => {

    try {

        const { loanFormId, firstName, lastName, dateOfBirth, maritalStatus, email, optionalEmail, phone, emergencyPhone, city, state, ZipCode, propertyOwnerShip, jobTitle, placeOfWork, workAddress, yearOfExperience, monthlyNetIncome, adharNumber, panNumber, voterNumber, drivingLicenseNumber } = req.body
        const user = req.user;
        const userExist = await userModel.findOne({ email: user.email });
        if (userExist) {


            const fromExist = await ApplicantForm.findById(loanFormId);

            if (fromExist) {

                const appliacntInfoSubmit = await ApplicantInfo.create(req.body);

                const trackingDetails = {
                    stepAt: "2"
                }

                const update = await LoanFormTracking.updateOne({ loanFormId: loanFormId }, trackingDetails)

                if (appliacntInfoSubmit) {
                    return res.status(statusCode.OK).send({
                        message: "Applicant Info Sucessfully submitted...",
                    })
                } else {
                    return res.status(statusCode.ExpectationFailed).send({
                        message: "Error Occured In Submitting The Details.."
                    })
                }

            } else {

                return res.status(statusCode.NotFound).send({
                    message: "Loan Form Not Found...",
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

// edit applicant info
exports.editApplicantInfo = async (req, res) => {

    try {

        const dataObject = req.body;
        const { id } = req.params;


        const user = req.user;
        const userExist = await userModel.findOne({ email: user.email });

        if (userExist) {

            const applicantFormSubmit = await ApplicantInfo.findById(id);

            if (applicantFormSubmit) {

                const update = await ApplicantInfo.updateOne({ _id: id }, { ...dataObject });

                if (update.acknowledged) {
                    return res.status(statusCode.OK).send({
                        message: "Applicant Details Updated Successsfully...",
                    })
                } else {
                    return res.status(statusCode.ExpectationFailed).send({
                        message: "Error occured in editting Applicant Details .."
                    })
                }

            } else {
                return res.status(statusCode.NotFound).send({
                    message: "Applicant Details Form Not Found"
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

// get Applicant Info
exports.getSubmitedApplicantInfo = async (req, res) => {

    try {

        const { id } = req.params;

        const user = req.user;
        const userExist = await userModel.findOne({ email: user.email });

        if (userExist) {

            const formSubmit = await ApplicantInfo.findById(id).populate("userId");

            if (formSubmit) {
                return res.status(statusCode.OK).send({
                    message: "Sucessfully Found...",
                    fromDetails: formSubmit
                })
            } else {
                return res.status(statusCode.NotFound).send({
                    message: "Applicant Details Not Found..."
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

// ##-----applicant info ends here


// ##-----applicant bank info starts here

// submit bank info
exports.submitApplicantBankInfo = async (req, res) => {

    try {

        //     bankName: { type: String, required: true },
        // branchName: { type: String, required: true },
        // accountType: { type: String, required: true },
        // accountNumber: { type: String, required: true },
        // ifscCode: { type: String, required: true },

        const { loanFormId, userId, bankName, branchName, accountType, accountNumber, ifscCode } = req.body
        const user = req.user;
        const userExist = await userModel.findOne({ email: user.email });
        if (userExist) {

            if (userExist._id == userId) {
                console.log("yes");
            }


            const fromExist = await ApplicantForm.findById(loanFormId);


            if (fromExist) {

                const appliacntBankInfoSubmit = await BankInfo.create({

                    loanFormId: fromExist._id,
                    userId: userId,

                    bankName: bankName,
                    branchName: branchName,
                    accountType: accountType,
                    accountNumber: accountNumber,
                    ifscCode: ifscCode

                });

                const trackingDetails = {
                    stepAt: "3"
                }

                const update = await LoanFormTracking.updateOne({ loanFormId: loanFormId }, trackingDetails)


                if (appliacntBankInfoSubmit) {
                    return res.status(statusCode.OK).send({
                        message: "Bank Info Sucessfully submitted...",
                    })
                } else {
                    return res.status(statusCode.ExpectationFailed).send({
                        message: "Error Occured In Submitting The Bank Details.."
                    })
                }

            } else {

                return res.status(statusCode.NotFound).send({
                    message: "Loan Form Not Found...",
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

// edit bank info
exports.editApplicantBankInfo = async (req, res) => {

    try {

        const dataObject = req.body;
        const { id } = req.params;

        const user = req.user;
        const userExist = await userModel.findOne({ email: user.email });

        if (userExist) {

            const bankInfo = await BankInfo.findById(id);

            if (bankInfo) {

                const update = await BankInfo.updateOne({ _id: id }, { ...dataObject });

                if (update.acknowledged) {
                    return res.status(statusCode.OK).send({
                        message: "Applicant Bank Details Updated Successsfully...",
                    })
                } else {
                    return res.status(statusCode.ExpectationFailed).send({
                        message: "Error occured in editting Applicant Bank Details .."
                    })
                }

            } else {
                return res.status(statusCode.NotFound).send({
                    message: "Applicant Bank Details Form Not Found"
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

// get bank info
exports.getSubmitedApplicantBankInfo = async (req, res) => {

    try {

        const { id } = req.params;

        const user = req.user;
        const userExist = await userModel.findOne({ email: user.email });

        if (userExist) {

            const formSubmit = await BankInfo.findById(id).populate("userId").populate("loanFormId");

            if (formSubmit) {
                return res.status(statusCode.OK).send({
                    message: "Sucessfully Found...",
                    data: formSubmit
                })
            } else {
                return res.status(statusCode.NotFound).send({
                    message: "Applicant Bank Details Not Found..."
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

// ##-----applicant bank info ends here


// ##-----applicant guarantor info starts here

// submit guarantor info
exports.submitApplicantGuarantorInfo = async (req, res) => {

    try {

        //     bankName: { type: String, required: true },
        // branchName: { type: String, required: true },
        // accountType: { type: String, required: true },
        // accountNumber: { type: String, required: true },
        // ifscCode: { type: String, required: true },

        const { loanFormId, userId } = req.body
        const user = req.user;
        const userExist = await userModel.findOne({ email: user.email });
        if (userExist) {

            if (userExist._id == userId) {
                console.log("yes");
            }


            const fromExist = await ApplicantForm.findById(loanFormId);


            if (fromExist) {

                const { loanFormId, } = req.body

                const appliacntGuarantorInfoSubmit = await GuarantorInfo.create({
                    ...req.body

                    // loanFormId : fromExist._id,
                    // userId : userId,

                    // bankName : bankName,
                    // branchName : branchName,
                    // accountType : accountType,
                    // accountNumber : accountNumber,
                    // ifscCode : ifscCode

                });

                const trackingDetails = {
                    stepAt: "4"
                }

                const update = await LoanFormTracking.updateOne({ loanFormId: loanFormId }, trackingDetails)


                if (appliacntGuarantorInfoSubmit) {
                    return res.status(statusCode.OK).send({
                        message: "Guarantor Info Sucessfully submitted...",
                    })
                } else {
                    return res.status(statusCode.ExpectationFailed).send({
                        message: "Error Occured In Submitting The Guarantor Details.."
                    })
                }




            } else {

                return res.status(statusCode.NotFound).send({
                    message: "Loan Form Not Found...",
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

// edit guarantor info
exports.editApplicantGuarantorInfo = async (req, res) => {

    try {

        const dataObject = req.body;
        const { id } = req.params;

        const user = req.user;
        const userExist = await userModel.findOne({ email: user.email });

        if (userExist) {

            const guarantorInfo = await GuarantorInfo.findById(id);

            if (guarantorInfo) {

                const update = await GuarantorInfo.updateOne({ _id: id }, { ...dataObject });

                if (update.acknowledged) {
                    return res.status(statusCode.OK).send({
                        message: "Applicant Guarantor Details Updated Successsfully...",
                    })
                } else {
                    return res.status(statusCode.ExpectationFailed).send({
                        message: "Error occured in editting Applicant Guarantor Details .."
                    })
                }

            } else {
                return res.status(statusCode.NotFound).send({
                    message: "Applicant Guarantor Details Form Not Found"
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

// get guarantor info
exports.getSubmitedApplicantGuarantorInfo = async (req, res) => {

    try {

        const { id } = req.params;

        const user = req.user;
        const userExist = await userModel.findOne({ email: user.email });

        if (userExist) {

            const guarantor = await GuarantorInfo.findById(id).populate("userId").populate("loanFormId");

            if (guarantor) {
                return res.status(statusCode.OK).send({
                    message: "Guarantor Sucessfully Found...",
                    data: guarantor
                })
            } else {
                return res.status(statusCode.NotFound).send({
                    message: "Applicant Guarantor Details Not Found..."
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



// ##-----applicant guarantor info ends here


// ##----applicant photo and signature starts here

exports.updatePhotoAndSignature = async (req, res) => {

    try {

        const user = req.user;

        const { loanFormId, userId } = req.body


        let profileImageName = [];


        if (req.files && req.files.length > 1) {

            for (let index = 0; index < req.files.length; index++) {
                const element = req.files[index];
                profileImageName.push(element.filename)
            }

        } else {
            return res.status(statusCode.BadRequest).send({
                message: "image Not Provided"
            })
        }

        const userExist = await userModel.findOne({ email: user.email });
        if (userExist) {

            const update = await ApplicantInfo.updateOne({ loanFormId: loanFormId }, {
                photo: profileImageName[0],
                signature: profileImageName[1]
            });

            if (update.acknowledged) {

                const trackingDetails = {
                    stepAt: "5"
                }

                const update = await LoanFormTracking.updateOne({ loanFormId: loanFormId }, trackingDetails)

                return res.status(statusCode.OK).send({
                    message: "Photo and Signature uploaded successfully..."
                })

            } else {
                return res.status(statusCode.ExpectationFailed).send({
                    message: "Error Occured while uploading photo and signature"
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

// ##-----applicant phot and signature ends here



// ##----guarantor phot and signature starts here

exports.updatePhotoAndSignatureOfGuarantor = async (req, res) => {

    try {

        const user = req.user;

        const { loanFormId, userId } = req.body


        let profileImageName = [];


        if (req.files && req.files.length > 1) {

            for (let index = 0; index < req.files.length; index++) {
                const element = req.files[index];
                profileImageName.push(element.filename)
            }

        } else {
            return res.status(statusCode.BadRequest).send({
                message: "image Not Provided"
            })
        }

        const userExist = await userModel.findOne({ email: user.email });

        if (userExist) {

            const update = await GuarantorInfo.updateOne({ loanFormId: loanFormId }, {
                photo: profileImageName[0],
                signature: profileImageName[1]
            });

            if (update.acknowledged) {

                const trackingDetails = {
                    stepAt: "6"
                }

                const update = await LoanFormTracking.updateOne({ loanFormId: loanFormId }, trackingDetails)

                return res.status(statusCode.OK).send({
                    message: "Guarantor Photo and Signature uploaded successfully..."
                })

            } else {
                return res.status(statusCode.ExpectationFailed).send({
                    message: "Error Occured while uploading Guarantor photo and signature"
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


// ##----guarantor phot and signature ends here













// ###----------- apply for loan controller ends here-----------



