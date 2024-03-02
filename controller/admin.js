

const { mailSender, formatCustomDate } = require("../common/emailSend");
const jwt = require("jsonwebtoken");
const dotnev = require("dotenv");
dotnev.config();
const PRIVATEKEY = process.env.PRIVATEKEY;

const userModel = require("../models/user");
const Roles = require("../models/roles/roles");
const Branch = require("../models/branch");
const Product = require("../models/Product/product");
const ProductInfo = require("../models/productInfo/productInfo");
const ApplicantForm = require("../models/applicantLoanDetails/applicantLoanDetails");
const ApplicantInfo = require("../models/applicantInformation/applicantInformation");
const BankInfo = require("../models/bankInformation/bankInformation");
const GuarantorInfo = require("../models/guaranter/guaranter");
const LoanFormTracking = require("../models/loanFormTracking/loanFormTracking");
const SuperAdminNotification = require("../models/superAdminNotification/superAdminNotification");
const AgentNotification = require("../models/agentNotification/agentNotification");
const ClinetsUnderAgent = require("../models/clientsUnderAgents/clientsUnderAgents");
const EmiSheet = require("../models/loanRecoveryRecord/loanRecoveryRecord")



const fs = require('fs');
const ejs = require('ejs');
const path = require('path');
const puppeteer = require('puppeteer');
// const instance = require('../app');
const Razorpay = require('razorpay') ;
const crypto =  require('crypto')





const statusCode = require('../utils/http-status-code');
const errorMessage = require('../languages/message');
const bcrypt = require("bcrypt");
const message = require("../languages/message");
const generateOtp = require("../utils/randome");
const branchModel = require("../models/branch");
const checkEmailAnsPassword = require("../services/emailAndPhone.service");


// signIn for Admin
exports.signIn = async (req, res) => {

    try {

        console.log("hitting");

        const { email, password, remenberme } = req.body;
        const userExist = await userModel.findOne({ email: email }).populate('Role');

        if (userExist) {

            if (!userExist?.isActive) {
                return res.status(statusCode.Unauthorized).send({
                    message: "Your Account has been deactivated, please raise a ticket for it."
                })
            }

            if (userExist?.isVerified) {

                if (userExist?.roleId > 2) {
                    return res.status(statusCode.Unauthorized).send({
                        message: "Unauthorized to access this."
                    })


                }


                const isAuth = bcrypt.compareSync(password, userExist.password);
                if (isAuth) {

                    const otp = generateOtp.generateOTP()

                    await userModel.updateOne({ email: email }, {
                        verificationOtp: otp,
                        otpGeneratedAt: new Date()
                    })

                    const mailOptions = {
                        from: "aatif13698@gmail.com",
                        to: email,
                        subject: "Email Verification for DYNO",
                        template: "signInOtp",
                        context: {
                            otp: otp,
                            name: userExist?.firstName,
                        },
                    };

                    await mailSender(mailOptions);
                    // const token = jwt.sign({ email: req.body.email }, PRIVATEKEY);
                    return res.status(statusCode.OK).send({
                        message: "A SignIn Verification OTP Has Been sent To Your Mail Id"
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
            message: "Network Error"
        })

    }

}

// sign in by Otp
exports.signInByOtp = async (req, res) => {

    try {

        const { email, otp, rememberMe } = req.body;
        const userExist = await userModel.findOne({ email: email }).populate('Role');

        console.log("userExist", userExist);

        if (userExist) {

            if (!userExist?.isActive) {
                return res.status(statusCode.Unauthorized).send({
                    message: "Your Account has been deactivated, please raise a ticket for it."
                })
            }

            if (userExist?.isVerified) {
                if (userExist?.roleId > 2) {
                    return res.status(statusCode.Unauthorized).send({
                        message: "Unauthorized to access this."
                    })
                }
                if (otp == userExist?.verificationOtp) {

                    let expiresIn = '1d';

                    if (rememberMe) {
                        expiresIn = '7d'; // If remember me is checked, expiry will be 7 days
                    }

                    const token = jwt.sign({ email: req.body.email }, PRIVATEKEY, { expiresIn });
                    // const token = jwt.sign({ email: req.body.email }, PRIVATEKEY);

                    let expiryTime = new Date().getTime() + 24 * 60 * 60 * 1000; // 1 day in milliseconds

                    if(rememberMe){

                        expiryTime = new Date().getTime() + 7 * 24 * 60 * 60 * 1000; // 7 days in milliseconds

                    }


                    return res.status(statusCode.OK).send({
                        token: token,
                        expiryTime : expiryTime, 
                        adminInfo: userExist,
                        message: "login Success."
                    })
                } else {
                    return res.status(statusCode.Unauthorized).send({
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




// ###-------- client controller starts here----------.


// Create and update clinet by Super admin
exports.createClient = async (req, res) => {

    try {

        const { branchId, email, phone, firstName, middleName, lastName, city, state, password, ownerId, roleId, create } = req.body;

        const clientExist = await userModel.findOne({ email: email });


        if (clientExist && create) {
            return res.status(statusCode.NotAcceptable).send({
                message: "Clinet already exists with this email."
            })

        }

        if (clientExist) {

            let profileObject = {
                firstName: firstName,
                lastName: lastName,
                middleName: middleName,
                city: city,
                state: state,
                phone: phone,
                // branchId: branchId,
            };


            if (password) {

                const hash = bcrypt.hashSync(password, 10);
                profileObject = {
                    ...profileObject,
                    password: hash
                }

            }



            const updateClient = await userModel.updateOne({ email: email }, { ...profileObject });

            if (updateClient) {
                return res.status(statusCode.OK).send({
                    message: "Client updated successfully."
                })
            } else {
                return res.status(statusCode.ExpectationFailed).send({
                    message: "Error occured while updating the client."
                })
            }

        } else {

            const roleObjId = await Roles.findOne({ id: 4 });
            const hash = bcrypt.hashSync(password, 10);
            const createClient = await userModel.create({
                email: email,
                firstName: firstName,
                lastName: lastName,
                middleName: middleName,
                city: city,
                state: state,
                phone: phone,
                // branchId: branchId,
                roleId: 4,
                isVerified: true,
                tc: true,
                password: hash,
                Role: roleObjId?._id,
                createdBy: req.user?._id
            });

            if (createClient) {
                return res.status(statusCode.OK).send({
                    message: "Client created successfully."
                })
            } else {
                return res.status(statusCode.ExpectationFailed).send({
                    message: "Error occured while creating the client."
                })
            }
        }

    } catch (error) {
        console.log("error", error);
        return res.status(statusCode.InternalServerError).send({
            message: errorMessage.lblInternalServerError
        })
    }
}

// get particular client
exports.getParticularClinet = async (req, res) => {

    try {

        const id = req.params.id;



        const clientExist = await userModel.find({ _id: id }).populate("branchId").populate("Role");

        if (clientExist) {

            return res.status(statusCode.OK).send({
                message: "Clients found successfully.",
                data: clientExist,
            })

        } else {
            return res.status(statusCode.NotFound).send({
                data: null,
                message: "Client data not found."
            })
        }

    } catch (error) {
        console.log("error", error);
        return res.status(statusCode.InternalServerError).send({
            message: errorMessage.lblInternalServerError
        })
    }
}

// get list of clients
// exports.listClients = async (req, res, next, listAll = "false", isActive = "true") => {
//     try {
//         // const { roleId } = req.user;
//         const searchText = req.query.keyword ? req.query.keyword.trim() : '';
//         const branchId = req.query.branchId ? req.query.branchId : null;
//         const all = req.query.all ? req.query.all : listAll;
//         const active = req.query.active ? req.query.active : isActive;
//         const page = req.query.page ? req.query.page : 1;
//         const limit = req.query.perPage ? req.query.perPage : 10;
//         const skip = (page - 1) * limit;
//         const roleId = req.query.roleId ? req.query.roleId : 4


//         let whereCondition = {
//             isActive: active === "true",
//             deletedAt: null,
//             roleId: roleId
//         };

//         if (branchId) {

//             whereCondition = {
//                 ...whereCondition,
//                 branchId: branchId
//             }

//         }

//         if (searchText) {
//             whereCondition.$or = [
//                 { firstName: { $regex: searchText, $options: 'i' } },
//                 { lastName: { $regex: searchText, $options: 'i' } },
//                 { email: { $regex: searchText, $options: 'i' } },
//                 { phone: { $regex: searchText, $options: 'i' } },
//                 { locality: { $regex: searchText, $options: 'i' } },
//                 // { openingDate: new Date(searchText) },
//                 { city: { $regex: searchText, $options: 'i' } },
//                 { state: { $regex: searchText, $options: 'i' } },
//                 {
//                     $or: [
//                         {
//                             $expr: {
//                                 $regexMatch: {
//                                     input: { $concat: ['$firstName', ' ', '$lastName'] },
//                                     regex: searchText,
//                                     options: 'i',
//                                 },
//                             },
//                         },
//                     ],
//                 },
//             ];
//         }


//         if (!searchText) {
//             delete whereCondition.$or; // Remove $or condition if searchText is not provided
//         }

//         console.log("whereCondition", whereCondition);

//         const clients = await userModel.find(whereCondition)
//             .skip(parseInt(skip))
//             .limit(parseInt(limit))
//             .sort({ _id: 'desc' });

//         return res.json({
//             message: 'List Clients!',
//             count: clients.length,
//             listClients: clients,
//         });
//     } catch (error) {
//         res.status(statusCode.InternalServerError).send({
//             message: error.message || errorMessage.lblInternalServerError,
//         });
//     }
// };

// new code for filter list
exports.listClients = async (req, res, next, listAll = "false", isActive = "true") => {
    try {
        const searchText = req.query.keyword ? req.query.keyword.trim() : '';
        const branchId = req.query.branchId || null;
        const all = req.query.all || listAll;
        const active = req.query.active || isActive;
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.perPage) || 10;
        const skip = (page - 1) * limit;
        const roleId = parseInt(req.query.roleId) || 4;

        console.log("roleId", roleId);

        let whereCondition = {
            // isActive: active === "true",
            deletedAt: null,
            roleId: roleId
        };

        if (branchId) {
            whereCondition.branchId = branchId;
        }

        console.log(" req.user.roleId", req.user.roleId);

        if (req.user.roleId !== 1) {
            whereCondition.createdBy = req.user._id
            console.log("thisssss");
        }

        if (searchText) {
            whereCondition.$or = [
                { firstName: { $regex: searchText, $options: 'i' } },
                { lastName: { $regex: searchText, $options: 'i' } },
                { email: { $regex: searchText, $options: 'i' } },
                { phone: { $regex: searchText, $options: 'i' } },
                { locality: { $regex: searchText, $options: 'i' } },
                { city: { $regex: searchText, $options: 'i' } },
                { state: { $regex: searchText, $options: 'i' } },
                {
                    $expr: {
                        $regexMatch: {
                            input: { $concat: ['$firstName', ' ', '$lastName'] },
                            regex: searchText,
                            options: 'i',
                        },
                    },
                },
            ];
        }

        if (!searchText) {
            delete whereCondition.$or; // Remove $or condition if searchText is not provided
        }

        console.log("whereCondition", whereCondition);

        const [clients, count] = await Promise.all([
            userModel.find(whereCondition).skip(skip).limit(limit).sort({ _id: 'desc' }),
            userModel.countDocuments(whereCondition),
        ]);

        return res.json({
            message: 'List Clients!',
            count: count,
            listClients: clients,
        });
    } catch (error) {
        res.status(statusCode.InternalServerError).send({
            message: error.message || errorMessage.lblInternalServerError,
        });
    }
};


// get all active undeleted Clinet
exports.getAllActiveUndeletedClients = async (req, res) => {

    try {

        let whereCondition = {
            isActive: true,
            deletedAt: null,
            // createdBy : req.user?._id,
            roleId: 4
        };

        const clients = await userModel.find(whereCondition);

        if (clients) {

            return res.status(statusCode.OK).send({
                message: "All Clinets Found Successfully...",
                data: clients
            });

        } else {

            return res.status(statusCode.Conflict).send({
                message: " Clinets Data Not Found...",
                data: null
            });
        }





    } catch (error) {
        res.status(statusCode.InternalServerError).send({
            message: error.message || errorMessage.lblInternalServerError,
        });
    }

}





// deactivate client
exports.clientInActive = async (req, res) => {

    try {

        const admin = req.user;
        const id = req.params?.id;

        const { status } = req.body

        if (admin.roleId !== 1) {
            return res.status(statusCode.Unauthorized).send({
                message: "Unauthorize to access this."
            })
        }

        const clinet = await userModel.findById(id);

        console.log("clinet", clinet);

        if (clinet) {

            if (status) {
                const update = await userModel.updateOne({ _id: id }, { isActive: status });
                console.log("update", update);

                if (update) {
                    return res.status(statusCode.OK).send({
                        message: "Client Has Been Activated..."
                    })

                } else {
                    return res.status(statusCode.ExpectationFailed).send({
                        message: "Error Occured In Activating Client"
                    })
                }

            } else {
                const update = await userModel.updateOne({ _id: id }, { isActive: status })
                console.log("update", update);

                if (update) {
                    return res.status(statusCode.OK).send({
                        message: "Client Has Been InActivated..."
                    })

                } else {
                    return res.status(statusCode.ExpectationFailed).send({
                        message: "Error Occured In InActivating Client"
                    })
                }
            }



        } else {

            return res.status(statusCode.ExpectationFailed).send({
                message: "Client Not Found..."
            })

        }



    } catch (error) {
        console.log("error", error);
        return res.status(statusCode.InternalServerError).send({
            message: errorMessage.lblInternalServerError
        })
    }
}

// soft delete client
exports.softDeleteClient = async (req, res) => {
    try {
        const { id } = req.params;

        const admin = req.user;

        if (admin.roleId !== 1) {

            return res.status(statusCode.Unauthorized).send({
                message: "Unauthorize to access this."
            })

        }

        const deletedClient = await userModel.findByIdAndUpdate(
            id,
            { deletedAt: new Date() },
            { new: true }
        );

        if (!deletedClient) {
            return res.status(statusCode.NotFound).json({
                message: "Client not found.",
            });
        }

        return res.status(statusCode.OK).json({
            message: "Client soft deleted successfully.",
            deletedClient,
        });
    } catch (error) {
        console.error("Error:", error);
        return res.status(statusCode.InternalServerError).json({
            message: errorMessage.lblInternalServerError,
        });
    }
};

// restore client
exports.restoreClient = async (req, res) => {
    try {
        const { id } = req.params;

        const admin = req.user;

        if (admin.roleId !== 1) {

            return res.status(statusCode.Unauthorized).send({
                message: "Unauthorize to access this."
            })

        }

        const restoredClient = await userModel.findByIdAndUpdate(
            id,
            { deletedAt: null },
            { new: true }
        );

        if (!restoredClient) {

            return res.status(statusCode.NotFound).json({
                message: "Client not found.",
            });

        }

        return res.status(statusCode.OK).json({
            message: "Client restored successfully.",
            restoredClient,
        });
    } catch (error) {
        console.error("Error:", error);
        return res.status(statusCode.InternalServerError).json({
            message: errorMessage.lblInternalServerError,
        });
    }
};

// permanent delete client
exports.deleteClient = async (req, res) => {
    try {
        const { id } = req.params;

        const admin = req.user;

        if (admin.roleId !== 1) {
            return res.status(statusCode.Unauthorized).send({
                message: "Unauthorize to access this."
            });
        }

        const deletedClient = await userModel.deleteOne({ _id: id });

        if (deletedClient.deletedCount === 0) {
            return res.status(statusCode.NotFound).json({
                message: "Client not found.",
            });
        }

        return res.status(statusCode.OK).json({
            message: "Client permanently deleted successfully.",
        });
    } catch (error) {
        console.error("Error:", error);
        return res.status(statusCode.InternalServerError).json({
            message: errorMessage.lblInternalServerError,
        });
    }
};

// get soft deleted clinet with filter
// exports.listSoftDeletedClients = async (req, res, next, listAll = "false", isActive = "true") => {
//     try {
//         // const { roleId } = req.user;
//         const searchText = req.query.keyword ? req.query.keyword.trim() : '';
//         const branchId = req.query.branchId ? req.query.branchId : null;
//         const all = req.query.all ? req.query.all : listAll;
//         const active = req.query.active ? req.query.active : isActive;
//         const page = req.query.page ? req.query.page : 1;
//         const limit = req.query.perPage ? req.query.perPage : 10;
//         const skip = (page - 1) * limit;
//         const roleId = req.query.roleId ? req.query.roleId : 4


//         let whereCondition = {
//             isActive: active === "true",
//             deletedAt: { $ne: null },
//             roleId: roleId
//         };

//         if (branchId) {

//             whereCondition = {
//                 ...whereCondition,
//                 branchId: branchId
//             }

//         }

//         if (searchText) {
//             whereCondition.$or = [
//                 { firstName: { $regex: searchText, $options: 'i' } },
//                 { lastName: { $regex: searchText, $options: 'i' } },
//                 { email: { $regex: searchText, $options: 'i' } },
//                 { phone: { $regex: searchText, $options: 'i' } },
//                 { locality: { $regex: searchText, $options: 'i' } },
//                 // { openingDate: new Date(searchText) },
//                 { city: { $regex: searchText, $options: 'i' } },
//                 { state: { $regex: searchText, $options: 'i' } },
//                 {
//                     $or: [
//                         {
//                             $expr: {
//                                 $regexMatch: {
//                                     input: { $concat: ['$firstName', ' ', '$lastName'] },
//                                     regex: searchText,
//                                     options: 'i',
//                                 },
//                             },
//                         },
//                     ],
//                 },
//             ];
//         }


//         if (!searchText) {
//             delete whereCondition.$or; // Remove $or condition if searchText is not provided
//         }

//         console.log("whereCondition", whereCondition);

//         const clients = await userModel.find(whereCondition)
//             .skip(parseInt(skip))
//             .limit(parseInt(limit))
//             .sort({ _id: 'desc' });

//         return res.json({
//             message: 'List Clients!',
//             count: clients.length,
//             listClients: clients,
//         });
//     } catch (error) {
//         res.status(statusCode.InternalServerError).send({
//             message: error.message || errorMessage.lblInternalServerError,
//         });
//     }
// };

// new code for filtered soft deleted client list
exports.listSoftDeletedClients = async (req, res, next, listAll = "false", isActive = "true") => {
    try {
        const searchText = req.query.keyword ? req.query.keyword.trim() : '';
        const branchId = req.query.branchId || null;
        const all = req.query.all || listAll;
        const active = req.query.active || isActive;
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.perPage) || 10;
        const skip = (page - 1) * limit;
        const roleId = parseInt(req.query.roleId) || 4;

        let whereCondition = {
            // isActive: active === "true",
            deletedAt: { $ne: null },
            roleId: roleId
        };

        if (branchId) {
            whereCondition.branchId = branchId;
        }

        if (searchText) {
            whereCondition.$or = [
                { firstName: { $regex: searchText, $options: 'i' } },
                { lastName: { $regex: searchText, $options: 'i' } },
                { email: { $regex: searchText, $options: 'i' } },
                { phone: { $regex: searchText, $options: 'i' } },
                { locality: { $regex: searchText, $options: 'i' } },
                { city: { $regex: searchText, $options: 'i' } },
                { state: { $regex: searchText, $options: 'i' } },
                {
                    $or: [
                        {
                            $expr: {
                                $regexMatch: {
                                    input: { $concat: ['$firstName', ' ', '$lastName'] },
                                    regex: searchText,
                                    options: 'i',
                                },
                            },
                        },
                    ],
                },
            ];
        }

        if (!searchText) {
            delete whereCondition.$or; // Remove $or condition if searchText is not provided
        }

        console.log("whereCondition", whereCondition);

        const [clients, count] = await Promise.all([
            userModel.find(whereCondition).skip(skip).limit(limit).sort({ _id: 'desc' }),
            userModel.countDocuments(whereCondition),
        ]);

        return res.json({
            message: 'List Soft-Deleted Clients!',
            count: count,
            listClients: clients,
        });
    } catch (error) {
        res.status(statusCode.InternalServerError).send({
            message: error.message || errorMessage.lblInternalServerError,
        });
    }
};

// get clients with branch value
exports.getClinets = async (req, res) => {

    try {

        const branchId = req.params.brnachID;

        const roleId = req.query.roleId;

        const findBranch = await branchModel.findOne({ _id: branchId });

        if (!findBranch) {
            return res.status(statusCode.NotFound).send({
                message: "Branch not exists"
            })

        }
        const clientsList = await userModel.find({ branchId: branchId, roleId: roleId }).populate("branchId").populate("Role");

        if (clientsList && clientsList.length > 0) {

            return res.status(statusCode.OK).send({
                message: "Clients found successfully.",
                data: clientsList,
            })

        } else {
            return res.status(statusCode.NotFound).send({
                data: null,
                message: "No clients data found."
            })
        }

    } catch (error) {
        console.log("error", error);
        return res.status(statusCode.InternalServerError).send({
            message: errorMessage.lblInternalServerError
        })
    }
}


// ###-------- clinet controller ends here---------.






//### --------employee controller starts here----------

// create employee
exports.createEmployee = async (req, res) => {

    try {

        const { branchId, email, phone, firstName, lastName, city, state, password, roleId, create } = req.body;

        const employeeExists = await userModel.findOne({ email: email });

        if (employeeExists && create) {

            return res.status(statusCode.NotAcceptable).send({

                message: "Employee already exists with this email."
            })

        }

        if (employeeExists) {

            const updateEmployee = await userModel.updateOne({ email: email }, {
                firstName: firstName,
                lastName: lastName,
                city: city,
                state: state,
                phone: phone,
                branchId: branchId,
            });

            if (updateEmployee) {

                return res.status(statusCode.OK).send({
                    message: "Employee updated successfully."
                })
            } else {
                return res.status(statusCode.ExpectationFailed).send({
                    message: "Error occured while updating the Employee."
                })
            }
        } else {

            const roleObjId = await Roles.findOne({ id: roleId });
            const hash = bcrypt.hashSync(password, 10);
            const createEmployee = await userModel.create({
                email: email,
                firstName: firstName,
                lastName: lastName,
                city: city,
                state: state,
                phone: phone,
                branchId: branchId,
                roleId: roleId,
                isVerified: true,
                tc: true,
                password: hash,
                Role: roleObjId?._id,
                createdBy: req.user?._id,

            });

            if (createEmployee) {

                return res.status(statusCode.OK).send({
                    message: "Employee created successfully."
                })
            } else {
                return res.status(statusCode.ExpectationFailed).send({
                    message: "Error occured while creating the Employee."
                })
            }

        }

    } catch (error) {
        console.log("error", error);
        return res.status(statusCode.InternalServerError).send({
            message: errorMessage.lblInternalServerError
        })
    }
}

// get particular employee
exports.getParticularEmployee = async (req, res) => {

    try {

        const id = req.params.id;

        const employeeExist = await userModel.find({ _id: id }).populate("branchId").populate("Role");

        if (employeeExist) {

            return res.status(statusCode.OK).send({
                message: "Employee found successfully.",
                data: employeeExist,
            })

        } else {
            return res.status(statusCode.NotFound).send({
                data: null,
                message: "Employee data not found."
            })
        }

    } catch (error) {
        console.log("error", error);
        return res.status(statusCode.InternalServerError).send({
            message: errorMessage.lblInternalServerError
        })
    }
}

// get employee list with filter
// exports.listEmployees = async (req, res, next, listAll = "false", isActive = "true") => {
//     try {
//         // const { roleId } = req.user;
//         const searchText = req.query.keyword ? req.query.keyword.trim() : '';
//         const branchId = req.query.branchId ? req.query.branchId : null;
//         const all = req.query.all ? req.query.all : listAll;
//         const active = req.query.active ? req.query.active : isActive;
//         const page = req.query.page ? req.query.page : 1;
//         const limit = req.query.perPage ? req.query.perPage : 10;
//         const skip = (page - 1) * limit;
//         const roleId = req.query.roleId ? req.query.roleId : 3

//         let whereCondition = {
//             isActive: active === "true",
//             deletedAt: null,
//             roleId: roleId
//         };

//         if (branchId) {

//             whereCondition = {
//                 ...whereCondition,
//                 branchId: branchId
//             }

//         }

//         if (searchText) {
//             whereCondition.$or = [
//                 { firstName: { $regex: searchText, $options: 'i' } },
//                 { lastName: { $regex: searchText, $options: 'i' } },
//                 { email: { $regex: searchText, $options: 'i' } },
//                 { phone: { $regex: searchText, $options: 'i' } },
//                 { locality: { $regex: searchText, $options: 'i' } },
//                 // { openingDate: new Date(searchText) },
//                 { city: { $regex: searchText, $options: 'i' } },
//                 { state: { $regex: searchText, $options: 'i' } },
//                 {
//                     $or: [
//                         {
//                             $expr: {
//                                 $regexMatch: {
//                                     input: { $concat: ['$firstName', ' ', '$lastName'] },
//                                     regex: searchText,
//                                     options: 'i',
//                                 },
//                             },
//                         },
//                     ],
//                 },
//             ];
//         }


//         if (!searchText) {
//             delete whereCondition.$or; // Remove $or condition if searchText is not provided
//         }

//         console.log("whereCondition", whereCondition);

//         const employees = await userModel.find(whereCondition)
//             .skip(parseInt(skip))
//             .limit(parseInt(limit))
//             .sort({ _id: 'desc' });

//         return res.json({
//             message: 'List Clients!',
//             count: employees.length,
//             listEmployees: employees,
//         });
//     } catch (error) {
//         res.status(statusCode.InternalServerError).send({
//             message: error.message || errorMessage.lblInternalServerError,
//         });
//     }
// };

// new get employee list with filter
exports.listEmployees = async (req, res, next, listAll = "false", isActive = "true") => {
    try {
        const searchText = req.query.keyword ? req.query.keyword.trim() : '';
        const branchId = req.query.branchId || null;
        const all = req.query.all || listAll;
        const active = req.query.active || isActive;
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.perPage) || 10;
        const skip = (page - 1) * limit;
        const roleId = parseInt(req.query.roleId) || 3;

        let whereCondition = {
            // isActive: active === "true",
            deletedAt: null,
            roleId: roleId
        };

        if (branchId) {
            whereCondition.branchId = branchId;
        }

        if (searchText) {
            whereCondition.$or = [
                { firstName: { $regex: searchText, $options: 'i' } },
                { lastName: { $regex: searchText, $options: 'i' } },
                { email: { $regex: searchText, $options: 'i' } },
                { phone: { $regex: searchText, $options: 'i' } },
                { locality: { $regex: searchText, $options: 'i' } },
                { city: { $regex: searchText, $options: 'i' } },
                { state: { $regex: searchText, $options: 'i' } },
                {
                    $or: [
                        {
                            $expr: {
                                $regexMatch: {
                                    input: { $concat: ['$firstName', ' ', '$lastName'] },
                                    regex: searchText,
                                    options: 'i',
                                },
                            },
                        },
                    ],
                },
            ];
        }

        if (!searchText) {
            delete whereCondition.$or; // Remove $or condition if searchText is not provided
        }

        console.log("whereCondition", whereCondition);

        const [employees, count] = await Promise.all([
            userModel.find(whereCondition).skip(skip).limit(limit).sort({ _id: 'desc' }),
            userModel.countDocuments(whereCondition),
        ]);

        return res.json({
            message: 'List Employees!',
            count: count,
            listEmployees: employees,
        });
    } catch (error) {
        res.status(statusCode.InternalServerError).send({
            message: error.message || errorMessage.lblInternalServerError,
        });
    }
};

// get employee list
exports.getEmployee = async (req, res) => {

    try {

        const branchId = req.params.brnachID;

        const roleId = req.query.roleId;

        const findBranch = await branchModel.findOne({ _id: branchId });

        if (!findBranch) {
            return res.status(statusCode.NotFound).send({
                message: "Branch not exists"
            })

        }
        const employeesList = await userModel.find({ branchId: branchId, roleId: roleId }).populate("branchId").populate("Role");

        if (employeesList && employeesList.length > 0) {

            return res.status(statusCode.OK).send({
                message: "Employees found successfully.",
                data: employeesList,
            })

        } else {
            return res.status(statusCode.NotFound).send({
                data: null,
                message: "No Employees data found."
            })
        }

    } catch (error) {
        console.log("error", error);
        return res.status(statusCode.InternalServerError).send({
            message: errorMessage.lblInternalServerError
        })
    }
}

// employee inactive
exports.employeeInActive = async (req, res) => {

    try {

        const admin = req.user;
        const id = req.params?.id;

        const { status } = req.body

        if (admin.roleId !== 1) {
            return res.status(statusCode.Unauthorized).send({
                message: "Unauthorize to access this."
            })
        }

        const employee = await userModel.findById(id);

        console.log("employee", employee);

        if (employee) {

            if (status) {
                const update = await userModel.updateOne({ _id: id }, { isActive: status });
                console.log("update", update);

                if (update) {
                    return res.status(statusCode.OK).send({
                        message: "Employee Has Been Activated..."
                    })

                } else {
                    return res.status(statusCode.ExpectationFailed).send({
                        message: "Error Occured In Activating Employee"
                    })
                }

            } else {
                const update = await userModel.updateOne({ _id: id }, { isActive: status })
                console.log("update", update);

                if (update) {
                    return res.status(statusCode.OK).send({
                        message: "Employee Has Been InActivated..."
                    })

                } else {
                    return res.status(statusCode.ExpectationFailed).send({
                        message: "Error Occured In InActivating Employee"
                    })
                }
            }



        } else {

            return res.status(statusCode.ExpectationFailed).send({
                message: "Employee Not Found..."
            })

        }



    } catch (error) {
        console.log("error", error);
        return res.status(statusCode.InternalServerError).send({
            message: errorMessage.lblInternalServerError
        })
    }
}

// soft delete employee
exports.softDeleteEmployee = async (req, res) => {
    try {
        const { id } = req.params;

        const admin = req.user;

        if (admin.roleId !== 1) {

            return res.status(statusCode.Unauthorized).send({
                message: "Unauthorize to access this."
            })

        }

        const deletedEmployee = await userModel.findByIdAndUpdate(
            id,
            { deletedAt: new Date() },
            { new: true }
        );

        if (!deletedEmployee) {
            return res.status(statusCode.NotFound).json({
                message: "Employee not found.",
            });
        }

        return res.status(statusCode.OK).json({
            message: "Employee soft deleted successfully.",
            deletedEmployee,
        });
    } catch (error) {
        console.error("Error:", error);
        return res.status(statusCode.InternalServerError).json({
            message: errorMessage.lblInternalServerError,
        });
    }
};

// restore employee
exports.restoreEmployee = async (req, res) => {
    try {
        const { id } = req.params;

        const admin = req.user;

        if (admin.roleId !== 1) {

            return res.status(statusCode.Unauthorized).send({
                message: "Unauthorize to access this."
            })

        }

        const restoredEmployee = await userModel.findByIdAndUpdate(
            id,
            { deletedAt: null },
            { new: true }
        );

        if (!restoredEmployee) {

            return res.status(statusCode.NotFound).json({
                message: "Employee not found.",
            });

        }

        return res.status(statusCode.OK).json({
            message: "Employee restored successfully.",
            restoredEmployee,
        });
    } catch (error) {
        console.error("Error:", error);
        return res.status(statusCode.InternalServerError).json({
            message: errorMessage.lblInternalServerError,
        });
    }
};

// get soft deleted employee with filter
// exports.listSoftDeletedEmployee = async (req, res, next, listAll = "false", isActive = "true") => {
//     try {
//         // const { roleId } = req.user;
//         const searchText = req.query.keyword ? req.query.keyword.trim() : '';
//         const branchId = req.query.branchId ? req.query.branchId : null;
//         const all = req.query.all ? req.query.all : listAll;
//         const active = req.query.active ? req.query.active : isActive;
//         const page = req.query.page ? req.query.page : 1;
//         const limit = req.query.perPage ? req.query.perPage : 10;
//         const skip = (page - 1) * limit;
//         const roleId = req.query.roleId ? req.query.roleId : 3


//         let whereCondition = {
//             isActive: active === "true",
//             deletedAt: { $ne: null },
//             roleId: roleId
//         };

//         if (branchId) {

//             whereCondition = {
//                 ...whereCondition,
//                 branchId: branchId
//             }

//         }

//         if (searchText) {
//             whereCondition.$or = [
//                 { firstName: { $regex: searchText, $options: 'i' } },
//                 { lastName: { $regex: searchText, $options: 'i' } },
//                 { email: { $regex: searchText, $options: 'i' } },
//                 { phone: { $regex: searchText, $options: 'i' } },
//                 { locality: { $regex: searchText, $options: 'i' } },
//                 // { openingDate: new Date(searchText) },
//                 { city: { $regex: searchText, $options: 'i' } },
//                 { state: { $regex: searchText, $options: 'i' } },
//                 {
//                     $or: [
//                         {
//                             $expr: {
//                                 $regexMatch: {
//                                     input: { $concat: ['$firstName', ' ', '$lastName'] },
//                                     regex: searchText,
//                                     options: 'i',
//                                 },
//                             },
//                         },
//                     ],
//                 },
//             ];
//         }


//         if (!searchText) {
//             delete whereCondition.$or; // Remove $or condition if searchText is not provided
//         }

//         console.log("whereCondition", whereCondition);

//         const employees = await userModel.find(whereCondition)
//             .skip(parseInt(skip))
//             .limit(parseInt(limit))
//             .sort({ _id: 'desc' });

//         return res.json({
//             message: 'List Clients!',
//             count: employees.length,
//             listEmployees: employees,
//         });
//     } catch (error) {
//         res.status(statusCode.InternalServerError).send({
//             message: error.message || errorMessage.lblInternalServerError,
//         });
//     }
// };


// new get soft deleted employee with filter
exports.listSoftDeletedEmployee = async (req, res, next, listAll = "false", isActive = "true") => {
    try {
        const searchText = req.query.keyword ? req.query.keyword.trim() : '';
        const branchId = req.query.branchId || null;
        const all = req.query.all || listAll;
        const active = req.query.active || isActive;
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.perPage) || 10;
        const skip = (page - 1) * limit;
        const roleId = parseInt(req.query.roleId) || 3;

        let whereCondition = {
            // isActive: active === "true",
            deletedAt: { $ne: null },
            roleId: roleId
        };

        if (branchId) {
            whereCondition.branchId = branchId;
        }

        if (searchText) {
            whereCondition.$or = [
                { firstName: { $regex: searchText, $options: 'i' } },
                { lastName: { $regex: searchText, $options: 'i' } },
                { email: { $regex: searchText, $options: 'i' } },
                { phone: { $regex: searchText, $options: 'i' } },
                { locality: { $regex: searchText, $options: 'i' } },
                { city: { $regex: searchText, $options: 'i' } },
                { state: { $regex: searchText, $options: 'i' } },
                {
                    $or: [
                        {
                            $expr: {
                                $regexMatch: {
                                    input: { $concat: ['$firstName', ' ', '$lastName'] },
                                    regex: searchText,
                                    options: 'i',
                                },
                            },
                        },
                    ],
                },
            ];
        }

        if (!searchText) {
            delete whereCondition.$or; // Remove $or condition if searchText is not provided
        }

        console.log("whereCondition", whereCondition);

        const [employees, count] = await Promise.all([
            userModel.find(whereCondition).skip(skip).limit(limit).sort({ _id: 'desc' }),
            userModel.countDocuments(whereCondition),
        ]);

        return res.json({
            message: 'List Soft-Deleted Employees!',
            count: count,
            listEmployees: employees,
        });
    } catch (error) {
        res.status(statusCode.InternalServerError).send({
            message: error.message || errorMessage.lblInternalServerError,
        });
    }
};


//### --------employee controller ends here----------



//##--------- products controller starts here--------.

// create product
exports.createProduct = async (req, res) => {

    try {

        const { id } = req.body

        console.log("req.body", req.body);

        if (id) {

            const productExists = await Product.findById(id);

            if (productExists) {

                const object = req.body;

                const { id, ...rest } = object

                const updateproduct = await Product.updateOne({
                    _id: id
                }, { ...rest });

                if (updateproduct) {

                    return res.status(statusCode.OK).send({
                        message: "Product updated successfully.."
                    })

                } else {

                    return res.status(statusCode.ExpectationFailed).send({
                        message: "Error occured in updating the product.."
                    })

                }

            } else {
                return res.status(statusCode.BadRequest).send({
                    message: "Product not found.."
                })
            }


        } else {

            const object = req.body;

            const { id, ...rest } = object

            const create = await Product.create({
                ...rest
            });

            if (create) {

                return res.status(statusCode.OK).send({
                    message: "Product created successfully.."
                })

            } else {

                return res.status(statusCode.ExpectationFailed).send({
                    message: "Error occured in creating the product.."
                })

            }
        }

    } catch (error) {
        console.log("error", error);
        return res.status(statusCode.InternalServerError).send({
            message: errorMessage.lblInternalServerError
        })
    }
}

// get products
exports.getProducts = async (req, res) => {

    try {
        let whereCondition = {
            productStatus: true,
            deletedAt: null,
        };

        const product = await Product.find(whereCondition);

        if (product.length > 0) {

            return res.status(statusCode.OK).send({
                message: "Products found successfully...",
                data: product
            })

        } else {
            return res.status(statusCode.NotFound).send({
                message: "Products not found",
            })
        }

    } catch (error) {
        console.log("error", error);
        return res.status(statusCode.InternalServerError).send({
            message: errorMessage.lblInternalServerError
        })
    }
}

// get particular product
exports.getParticularProduct = async (req, res) => {

    try {

        const id = req.params.id;
        const productExist = await Product.find({ _id: id })

        if (productExist) {

            return res.status(statusCode.OK).send({
                message: "Product found successfully.",
                data: productExist,
            })

        } else {

            return res.status(statusCode.NotFound).send({
                data: null,
                message: "Product data not found."
            })
        }

    } catch (error) {
        console.log("error", error);
        return res.status(statusCode.InternalServerError).send({
            message: errorMessage.lblInternalServerError
        })
    }
}

// get products with filter
// exports.listProducts = async (req, res, next, listAll = "false", isActive = "true") => {
//     try {
//         const { roleId } = req.user;
//         const searchText = req.query.keyword ? req.query.keyword.trim() : '';
//         const all = req.query.all ? req.query.all : listAll;
//         const active = req.query.active ? req.query.active : isActive;
//         const page = req.query.page ? req.query.page : 1;
//         const limit = req.query.perPage ? req.query.perPage : 10;
//         const skip = (page - 1) * limit;

//         let whereCondition = {
//             productStatus: active === "true",
//             deletedAt: null
//         };


//         if (searchText) {
//             whereCondition.$or = [
//                 { productName: { $regex: searchText, $options: 'i' } },
//                 { rateTyep: { $regex: searchText, $options: 'i' } },
//                 { recoveryType: { $regex: searchText, $options: 'i' } },
//             ];
//         }


//         const products = await Product.find(whereCondition)
//             .skip(parseInt(skip))
//             .limit(parseInt(limit))
//             .sort({ _id: 'desc' });

//         return res.json({
//             message: 'List Products!',
//             count: products.length,
//             listProducts: products,
//         });
//     } catch (error) {
//         res.status(statusCode.InternalServerError).send({
//             message: error.message || errorMessage.lblInternalServerError,
//         });
//     }
// };

// new get products with filter
exports.listProducts = async (req, res, next, listAll = "false", isActive = "true") => {
    try {
        const { roleId } = req.user;
        const searchText = req.query.keyword ? req.query.keyword.trim() : '';
        const all = req.query.all || listAll;
        const active = req.query.active || isActive;
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.perPage) || 10;
        const skip = (page - 1) * limit;

        let whereCondition = {
            // productStatus: active === "true",
            deletedAt: null
        };

        if (searchText) {
            whereCondition.$or = [
                { productName: { $regex: searchText, $options: 'i' } },
                { rateTyep: { $regex: searchText, $options: 'i' } },
                { recoveryType: { $regex: searchText, $options: 'i' } },
            ];
        }

        const [products, count] = await Promise.all([
            Product.find(whereCondition).skip(skip).limit(limit).sort({ _id: 'desc' }),
            Product.countDocuments(whereCondition),
        ]);

        return res.json({
            message: 'List Products!',
            count: count,
            listProducts: products,
        });
    } catch (error) {
        res.status(statusCode.InternalServerError).send({
            message: error.message || errorMessage.lblInternalServerError,
        });
    }
};

// soft delete product
exports.softDeleteProduct = async (req, res) => {
    try {
        const { id } = req.params;

        const admin = req.user;

        if (admin.roleId !== 1) {

            return res.status(statusCode.Unauthorized).send({
                message: "Unauthorize to access this."
            })

        }

        const deletedProduct = await Product.findByIdAndUpdate(
            id,
            { deletedAt: new Date() },
            { new: true }
        );

        if (!deletedProduct) {
            return res.status(statusCode.NotFound).json({
                message: "Product not found.",
            });
        }

        return res.status(statusCode.OK).json({
            message: "Product soft deleted successfully.",
            deletedProduct,
        });
    } catch (error) {
        console.error("Error:", error);
        return res.status(statusCode.InternalServerError).json({
            message: errorMessage.lblInternalServerError,
        });
    }
};

// restore product
exports.restoreProduct = async (req, res) => {
    try {
        const { id } = req.params;

        const admin = req.user;

        if (admin.roleId !== 1) {

            return res.status(statusCode.Unauthorized).send({
                message: "Unauthorize to access this."
            })

        }

        const restoredProduct = await Product.findByIdAndUpdate(
            id,
            { deletedAt: null },
            { new: true }
        );

        if (!restoredProduct) {

            return res.status(statusCode.NotFound).json({
                message: "Product not found.",
            });

        }

        return res.status(statusCode.OK).json({
            message: "Product restored successfully.",
            restoredProduct,
        });
    } catch (error) {
        console.error("Error:", error);
        return res.status(statusCode.InternalServerError).json({
            message: errorMessage.lblInternalServerError,
        });
    }
};

// get soft deleted products with filter
// exports.listSoftDeletedProducts = async (req, res, next, listAll = "false", isActive = "true") => {
//     try {
//         const { roleId } = req.user;
//         const searchText = req.query.keyword ? req.query.keyword.trim() : '';
//         const all = req.query.all ? req.query.all : listAll;
//         const active = req.query.active ? req.query.active : isActive;
//         const page = req.query.page ? req.query.page : 1;
//         const limit = req.query.perPage ? req.query.perPage : 10;
//         const skip = (page - 1) * limit;

//         let whereCondition = {
//             productStatus: active === "true",
//             deletedAt: { $ne: null }
//         };


//         if (searchText) {
//             whereCondition.$or = [
//                 { productName: { $regex: searchText, $options: 'i' } },
//                 { rateTyep: { $regex: searchText, $options: 'i' } },
//                 { recoveryType: { $regex: searchText, $options: 'i' } },
//             ];
//         }


//         const products = await Product.find(whereCondition)
//             .skip(parseInt(skip))
//             .limit(parseInt(limit))
//             .sort({ _id: 'desc' });

//         return res.json({
//             message: 'List Products!',
//             count: products.length,
//             listProducts: products,
//         });
//     } catch (error) {
//         res.status(statusCode.InternalServerError).send({
//             message: error.message || errorMessage.lblInternalServerError,
//         });
//     }
// };

// new soft deleted product with filter
exports.listSoftDeletedProducts = async (req, res, next, listAll = "false", isActive = "true") => {
    try {
        const { roleId } = req.user;
        const searchText = req.query.keyword ? req.query.keyword.trim() : '';
        const all = req.query.all || listAll;
        const active = req.query.active || isActive;
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.perPage) || 10;
        const skip = (page - 1) * limit;

        let whereCondition = {
            productStatus: active === "true",
            deletedAt: { $ne: null }
        };

        if (searchText) {
            whereCondition.$or = [
                { productName: { $regex: searchText, $options: 'i' } },
                { rateTyep: { $regex: searchText, $options: 'i' } },
                { recoveryType: { $regex: searchText, $options: 'i' } },
            ];
        }

        const [products, count] = await Promise.all([
            Product.find(whereCondition).skip(skip).limit(limit).sort({ _id: 'desc' }),
            Product.countDocuments(whereCondition),
        ]);

        return res.json({
            message: 'List Soft-Deleted Products!',
            count: count,
            listProducts: products,
        });
    } catch (error) {
        res.status(statusCode.InternalServerError).send({
            message: error.message || errorMessage.lblInternalServerError,
        });
    }
};

// permanent delte product
exports.deleteProduct = async (req, res) => {
    try {
        const { id } = req.params;

        const admin = req.user;

        if (admin.roleId !== 1) {
            return res.status(statusCode.Unauthorized).send({
                message: "Unauthorize to access this."
            });
        }

        // Perform permanent deletion
        const deletedProduct = await Product.deleteOne({ _id: id });

        if (deletedProduct.deletedCount === 0) {
            return res.status(statusCode.NotFound).json({
                message: "Product not found.",
            });
        }

        return res.status(statusCode.OK).json({
            message: "Product permanently deleted successfully.",
        });
    } catch (error) {
        console.error("Error:", error);
        return res.status(statusCode.InternalServerError).json({
            message: errorMessage.lblInternalServerError,
        });
    }
};


// product inactive and active
exports.productInActive = async (req, res) => {

    try {

        const admin = req.user;
        const id = req.params?.id;

        const { status } = req.body

        if (admin.roleId !== 1) {
            return res.status(statusCode.Unauthorized).send({
                message: "Unauthorize to access this."
            })
        }

        const product = await Product.findById(id);

        console.log("product", product);

        if (product) {

            if (status) {
                const update = await Product.updateOne({ _id: id }, { productStatus: status });
                console.log("update", update);

                if (update) {
                    return res.status(statusCode.OK).send({
                        message: "Product Has Been Activated..."
                    })

                } else {
                    return res.status(statusCode.ExpectationFailed).send({
                        message: "Error Occured In Activating Product"
                    })
                }

            } else {
                const update = await Product.updateOne({ _id: id }, { productStatus: status })
                console.log("update", update);

                if (update) {
                    return res.status(statusCode.OK).send({
                        message: "Product Has Been InActivated..."
                    })

                } else {
                    return res.status(statusCode.ExpectationFailed).send({
                        message: "Error Occured In InActivating Product"
                    })
                }
            }



        } else {

            return res.status(statusCode.ExpectationFailed).send({
                message: "Client Not Found..."
            })

        }



    } catch (error) {
        console.log("error", error);
        return res.status(statusCode.InternalServerError).send({
            message: errorMessage.lblInternalServerError
        })
    }
}


// create product information
exports.createProductInformation = async (req, res) => {

    try {

        const { id, productId } = req.body;


        if (id) {

            const productInfoExists = await ProductInfo.findById(id);

            if (productInfoExists) {


                const isInfoExist = await ProductInfo.find({ productId: productId });

                if (isInfoExist.length == 0) {
                    return res.status(statusCode.BadRequest).send({
                        message: "Please provide correct Product Id"
                    })
                }


                const object = req.body;

                const { id, ...rest } = object

                const updateproductInfo = await ProductInfo.updateOne({
                    _id: id
                }, { ...rest });

                if (updateproductInfo) {

                    return res.status(statusCode.OK).send({
                        message: "Product Info updated successfully.."
                    })

                } else {

                    return res.status(statusCode.ExpectationFailed).send({
                        message: "Error occured in updating the product Info..."
                    })

                }

            } else {
                return res.status(statusCode.BadRequest).send({
                    message: "Product Info not found.."
                })
            }


        } else {

            const object = req.body;

            const { id, title, description, termsAndCondition, productId } = object;
            const product = await Product.findById(productId);

            if (product) {

                const productID = product._id;

                const isInfoExist = await ProductInfo.find({ productId: productId });

                if (isInfoExist.length > 0) {

                    return res.status(statusCode.BadRequest).send({
                        message: "Product Info already exists with this product Id..."
                    })

                }

                const create = await ProductInfo.create({
                    productId: productID,
                    title, description, termsAndCondition,
                });

                if (create) {

                    return res.status(statusCode.OK).send({
                        message: "Product Info created successfully.."
                    })

                } else {

                    return res.status(statusCode.ExpectationFailed).send({
                        message: "Error occured in creating the product Info..."
                    })

                }

            } else {
                return res.status(statusCode.BadRequest).send({
                    message: "Product not found.."
                })
            }



        }

    } catch (error) {
        console.log("error", error);
        return res.status(statusCode.InternalServerError).send({
            message: errorMessage.lblInternalServerError
        })
    }
}

// get particular product info
exports.getParticularProductInfo = async (req, res) => {

    try {

        const id = req.params.id;
        const productExist = await ProductInfo.find({ _id: id })

        if (productExist) {

            return res.status(statusCode.OK).send({
                message: "Product Info found successfully.",
                data: productExist,
            })

        } else {

            return res.status(statusCode.NotFound).send({
                data: null,
                message: "Product Info data not found."
            })
        }

    } catch (error) {
        console.log("error", error);
        return res.status(statusCode.InternalServerError).send({
            message: errorMessage.lblInternalServerError
        })
    }
}


// get product Info list
exports.getProductInfoList = async (req, res) => {

    try {

        const productExist = await ProductInfo.find().populate("productId");

        if (productExist) {

            return res.status(statusCode.OK).send({
                message: "Product Info List found successfully.",
                data: productExist,
            })

        } else {

            return res.status(statusCode.NotFound).send({
                data: null,
                message: "Product Info data not found."
            })
        }

    } catch (error) {
        console.log("error", error);
        return res.status(statusCode.InternalServerError).send({
            message: errorMessage.lblInternalServerError
        })
    }
}


//###---------- products controller ends here---------------.





// ###---------- agent controller starts here--------------.

// create Agent / Admin
exports.createAgent = async (req, res) => {

    try {

        const { branchId, email, phone, officePhone, firstName, middleName, lastName, city, state, password, roleId, create } = req.body;

        const agentExists = await userModel.findOne({ email: email });

        if (agentExists && create) {

            return res.status(statusCode.NotAcceptable).send({

                message: "User already exists with this email."
            })
        }


        if (agentExists) {

            const hash = bcrypt.hashSync(password, 10);


            let profileObject = {
                firstName: firstName,
                middleName: middleName,
                lastName: lastName,
                city: city,
                state: state,
                phone: phone,
                officePhone: officePhone,
                branchId: branchId,
                password: hash,
                profileCreated: true,
            }

            if (req.file && req.file.filename) {
                // profileImageName = req.file.filename
                profileObject = {
                    ...profileObject,
                    profileImage: req.file.filename

                }
            }

            const updateAgent = await userModel.updateOne({ email: email }, { ...profileObject });

            if (updateAgent) {

                return res.status(statusCode.OK).send({
                    message: "Agent updated successfully."
                })
            } else {
                return res.status(statusCode.ExpectationFailed).send({
                    message: "Error occured while updating the Agent."
                })
            }

        } else {

            const hash = bcrypt.hashSync(password, 10);

            const roleObjId = await Roles.findOne({ id: roleId });


            let profileObject = {
                email: email,
                firstName: firstName,
                lastName: lastName,
                middleName: middleName,
                city: city,
                state: state,
                phone: phone,
                officePhone: officePhone,
                branchId: branchId,
                roleId: roleId,
                isVerified: true,
                tc: true,
                password: hash,
                Role: roleObjId?._id,
                createdBy: req.user?._id,
                profileCreated: true
            }


            if (req.file && req.file.filename) {
                // profileImageName = req.file.filename
                profileObject = {
                    ...profileObject,
                    profileImage: req.file.filename
                }
            }


            const createAgent = await userModel.create({ ...profileObject });

            const createClientListUnderAgnet = await ClinetsUnderAgent.create({
                userId: createAgent._id
            })

            if (createAgent) {

                const mailOptions = {
                    from: "aatif13698@gmail.com",
                    to: email,
                    subject: "Welcome Email",
                    template: "welcome",
                    context: {
                        email: email,
                        name: firstName + " " + lastName,
                        password: password
                    },
                };

                // await mailSender(req, res, otp, firstName, email)
                await mailSender(mailOptions);

                return res.status(statusCode.OK).send({
                    message: "Agent created successfully."
                })
            } else {
                return res.status(statusCode.ExpectationFailed).send({
                    message: "Error occured while creating the Agent."
                })
            }

        }

    } catch (error) {
        console.log("error", error);
        return res.status(statusCode.InternalServerError).send({
            message: errorMessage.lblInternalServerError
        })
    }
}

// get particular agent
exports.getParticularAgent = async (req, res) => {

    try {

        const admin = req.user;

        const id = req.params?.id;

        if (admin.roleId !== 1) {

            return res.status(statusCode.Unauthorized).send({
                message: "Unauthorize to access this."
            })

        }

        const agent = await userModel.findById(id).populate("branchId").populate("Role")

        if (agent) {

            return res.status(statusCode.OK).send({
                data: agent,
                message: "Agent Get Successfully..."
            })

        } else {

            return res.status(statusCode.ExpectationFailed).send({
                message: "Agent Not Found..."
            })

        }


    } catch (error) {

        console.log("error", error);

        return res.status(statusCode.InternalServerError).send({
            message: errorMessage.lblInternalServerError
        })

    }
}

// deactivate agent
exports.agentInActive = async (req, res) => {

    try {

        const admin = req.user;
        const id = req.params?.id;

        const { status } = req.body

        if (admin.roleId !== 1) {
            return res.status(statusCode.Unauthorized).send({
                message: "Unauthorize to access this."
            })
        }

        const agent = await userModel.findById(id);

        console.log("agent", agent);

        if (agent) {

            if (status) {
                const update = await userModel.updateOne({ _id: id }, { isActive: status });
                console.log("update", update);

                if (update) {
                    return res.status(statusCode.OK).send({
                        message: "Agent Has Been Activated..."
                    })

                } else {
                    return res.status(statusCode.ExpectationFailed).send({
                        message: "Error Occured In Activating Branch"
                    })
                }

            } else {
                const update = await userModel.updateOne({ _id: id }, { isActive: status })
                console.log("update", update);

                if (update) {
                    return res.status(statusCode.OK).send({
                        message: "Agent Has Been InActivated..."
                    })

                } else {
                    return res.status(statusCode.ExpectationFailed).send({
                        message: "Error Occured In InActivating Branch"
                    })
                }
            }



        } else {

            return res.status(statusCode.ExpectationFailed).send({
                message: "Agent Not Found..."
            })

        }



    } catch (error) {
        console.log("error", error);
        return res.status(statusCode.InternalServerError).send({
            message: errorMessage.lblInternalServerError
        })
    }
}

// soft delete agent
exports.softDeleteAgent = async (req, res) => {
    try {
        const { id } = req.params;

        const admin = req.user;

        if (admin.roleId !== 1) {

            return res.status(statusCode.Unauthorized).send({
                message: "Unauthorize to access this."
            })

        }

        const deletedAgent = await userModel.findByIdAndUpdate(
            id,
            { deletedAt: new Date() },
            { new: true }
        );

        if (!deletedAgent) {
            return res.status(statusCode.NotFound).json({
                message: "Agent not found.",
            });
        }

        return res.status(statusCode.OK).json({
            message: "Agent soft deleted successfully.",
            deletedAgent,
        });
    } catch (error) {
        console.error("Error:", error);
        return res.status(statusCode.InternalServerError).json({
            message: errorMessage.lblInternalServerError,
        });
    }
};

// restore agent
exports.restoreAgent = async (req, res) => {
    try {
        const { id } = req.params;

        const admin = req.user;

        if (admin.roleId !== 1) {

            return res.status(statusCode.Unauthorized).send({
                message: "Unauthorize to access this."
            })

        }

        const restoredAgent = await userModel.findByIdAndUpdate(
            id,
            { deletedAt: null },
            { new: true }
        );

        if (!restoredAgent) {

            return res.status(statusCode.NotFound).json({
                message: "Agent not found.",
            });

        }

        return res.status(statusCode.OK).json({
            message: "Agent restored successfully.",
            restoredAgent,
        });
    } catch (error) {
        console.error("Error:", error);
        return res.status(statusCode.InternalServerError).json({
            message: errorMessage.lblInternalServerError,
        });
    }
};

// get agent with filter
// exports.listAgents = async (req, res, next, listAll = "false", isActive = "true") => {
//     try {
//         // const { roleId } = req.user;
//         const searchText = req.query.keyword ? req.query.keyword.trim() : '';
//         const branchId = req.query.branchId ? req.query.branchId : null;
//         const all = req.query.all ? req.query.all : listAll;
//         const active = req.query.active ? req.query.active : isActive;
//         const page = req.query.page ? req.query.page : 1;
//         const limit = req.query.perPage ? req.query.perPage : 10;
//         const skip = (page - 1) * limit;
//         const roleId = req.query.roleId ? req.query.roleId : 2;

//         let whereCondition = {
//             isActive: active === "true",
//             deletedAt: null,
//             roleId: roleId
//         };

//         if (branchId) {

//             whereCondition = {
//                 ...whereCondition,
//                 branchId: branchId
//             }

//         }

//         if (searchText) {
//             whereCondition.$or = [
//                 { firstName: { $regex: searchText, $options: 'i' } },
//                 { lastName: { $regex: searchText, $options: 'i' } },
//                 { email: { $regex: searchText, $options: 'i' } },
//                 { phone: { $regex: searchText, $options: 'i' } },
//                 { locality: { $regex: searchText, $options: 'i' } },
//                 // { openingDate: new Date(searchText) },
//                 { city: { $regex: searchText, $options: 'i' } },
//                 { state: { $regex: searchText, $options: 'i' } },
//                 {
//                     $or: [
//                         {
//                             $expr: {
//                                 $regexMatch: {
//                                     input: { $concat: ['$firstName', ' ', '$lastName'] },
//                                     regex: searchText,
//                                     options: 'i',
//                                 },
//                             },
//                         },
//                     ],
//                 },
//             ];
//         }


//         if (!searchText) {
//             delete whereCondition.$or; // Remove $or condition if searchText is not provided
//         }

//         console.log("whereCondition", whereCondition);

//         const agents = await userModel.find(whereCondition)
//             .skip(parseInt(skip))
//             .limit(parseInt(limit))
//             .sort({ _id: 'desc' });

//         return res.json({
//             message: 'List Agents!',
//             count: agents.length,
//             listAgents: agents,
//         });
//     } catch (error) {
//         res.status(statusCode.InternalServerError).send({
//             message: error.message || errorMessage.lblInternalServerError,
//         });
//     }
// };

// new agents with filter
exports.listAgents = async (req, res, next, listAll = "false", isActive = "true") => {
    try {
        const searchText = req.query.keyword ? req.query.keyword.trim() : '';
        const branchId = req.query.branchId || null;
        const all = req.query.all || listAll;
        const active = req.query.active || isActive;
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.perPage) || 10;
        const skip = (page - 1) * limit;
        const roleId = parseInt(req.query.roleId) || 2;

        let whereCondition = {
            // isActive: active === "true",
            deletedAt: null,
            roleId: roleId
        };


        if (branchId) {
            whereCondition.branchId = branchId;
        }

        if (searchText) {
            whereCondition.$or = [
                { firstName: { $regex: searchText, $options: 'i' } },
                { lastName: { $regex: searchText, $options: 'i' } },
                { email: { $regex: searchText, $options: 'i' } },
                { phone: { $regex: searchText, $options: 'i' } },
                { locality: { $regex: searchText, $options: 'i' } },
                { city: { $regex: searchText, $options: 'i' } },
                { state: { $regex: searchText, $options: 'i' } },
                {
                    $or: [
                        {
                            $expr: {
                                $regexMatch: {
                                    input: { $concat: ['$firstName', ' ', '$lastName'] },
                                    regex: searchText,
                                    options: 'i',
                                },
                            },
                        },
                    ],
                },
            ];
        }

        if (!searchText) {
            delete whereCondition.$or; // Remove $or condition if searchText is not provided
        }

        console.log("whereCondition", whereCondition);

        const [agents, count] = await Promise.all([
            userModel.find(whereCondition).skip(skip).limit(limit).sort({ _id: 'desc' }),
            userModel.countDocuments(whereCondition),
        ]);

        return res.json({
            message: 'List Agents!',
            count: count,
            listAgents: agents,
        });
    } catch (error) {
        res.status(statusCode.InternalServerError).send({
            message: error.message || errorMessage.lblInternalServerError,
        });
    }
};

// get soft deleted agents with filter
// exports.listSoftDeletedAgents = async (req, res, next, listAll = "false", isActive = "true") => {
//     try {
//         // const { roleId } = req.user;
//         const searchText = req.query.keyword ? req.query.keyword.trim() : '';
//         const branchId = req.query.branchId ? req.query.branchId : null;
//         const all = req.query.all ? req.query.all : listAll;
//         const active = req.query.active ? req.query.active : isActive;
//         const page = req.query.page ? req.query.page : 1;
//         const limit = req.query.perPage ? req.query.perPage : 10;
//         const skip = (page - 1) * limit;
//         const roleId = req.query.roleId ? req.query.roleId : 2;


//         let whereCondition = {
//             isActive: active === "true",
//             deletedAt: { $ne: null },
//             roleId: roleId
//         };

//         if (branchId) {

//             whereCondition = {
//                 ...whereCondition,
//                 branchId: branchId
//             }

//         }

//         if (searchText) {
//             whereCondition.$or = [
//                 { firstName: { $regex: searchText, $options: 'i' } },
//                 { lastName: { $regex: searchText, $options: 'i' } },
//                 { email: { $regex: searchText, $options: 'i' } },
//                 { phone: { $regex: searchText, $options: 'i' } },
//                 { locality: { $regex: searchText, $options: 'i' } },
//                 // { openingDate: new Date(searchText) },
//                 { city: { $regex: searchText, $options: 'i' } },
//                 { state: { $regex: searchText, $options: 'i' } },
//                 {
//                     $or: [
//                         {
//                             $expr: {
//                                 $regexMatch: {
//                                     input: { $concat: ['$firstName', ' ', '$lastName'] },
//                                     regex: searchText,
//                                     options: 'i',
//                                 },
//                             },
//                         },
//                     ],
//                 },
//             ];
//         }


//         if (!searchText) {
//             delete whereCondition.$or; // Remove $or condition if searchText is not provided
//         }

//         console.log("whereCondition", whereCondition);

//         const agents = await userModel.find(whereCondition)
//             .skip(parseInt(skip))
//             .limit(parseInt(limit))
//             .sort({ _id: 'desc' });

//         return res.json({
//             message: 'List Clients!',
//             count: agents.length,
//             listAgents: agents,
//         });
//     } catch (error) {
//         res.status(statusCode.InternalServerError).send({
//             message: error.message || errorMessage.lblInternalServerError,
//         });
//     }
// };

// new get soft deleted agents with filter
exports.listSoftDeletedAgents = async (req, res, next, listAll = "false", isActive = "true") => {
    try {
        const searchText = req.query.keyword ? req.query.keyword.trim() : '';
        const branchId = req.query.branchId || null;
        const all = req.query.all || listAll;
        const active = req.query.active || isActive;
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.perPage) || 10;
        const skip = (page - 1) * limit;
        const roleId = parseInt(req.query.roleId) || 2;

        let whereCondition = {
            // isActive: active === "true",
            deletedAt: { $ne: null },
            roleId: roleId
        };

        if (branchId) {
            whereCondition.branchId = branchId;
        }

        if (searchText) {
            whereCondition.$or = [
                { firstName: { $regex: searchText, $options: 'i' } },
                { lastName: { $regex: searchText, $options: 'i' } },
                { email: { $regex: searchText, $options: 'i' } },
                { phone: { $regex: searchText, $options: 'i' } },
                { locality: { $regex: searchText, $options: 'i' } },
                { city: { $regex: searchText, $options: 'i' } },
                { state: { $regex: searchText, $options: 'i' } },
                {
                    $or: [
                        {
                            $expr: {
                                $regexMatch: {
                                    input: { $concat: ['$firstName', ' ', '$lastName'] },
                                    regex: searchText,
                                    options: 'i',
                                },
                            },
                        },
                    ],
                },
            ];
        }

        if (!searchText) {
            delete whereCondition.$or; // Remove $or condition if searchText is not provided
        }

        console.log("whereCondition", whereCondition);

        const [agents, count] = await Promise.all([
            userModel.find(whereCondition).skip(skip).limit(limit).sort({ _id: 'desc' }),
            userModel.countDocuments(whereCondition),
        ]);

        return res.json({
            message: 'List Soft-Deleted Agents!',
            count: count,
            listAgents: agents,
        });
    } catch (error) {
        res.status(statusCode.InternalServerError).send({
            message: error.message || errorMessage.lblInternalServerError,
        });
    }
};

// permanent delete agent
exports.deleteAgent = async (req, res) => {
    try {
        const { id } = req.params;

        const admin = req.user;

        if (admin.roleId !== 1) {
            return res.status(statusCode.Unauthorized).send({
                message: "Unauthorize to access this."
            });
        }

        // Perform permanent deletion
        const deletedAgent = await userModel.deleteOne({ _id: id });

        if (deletedAgent.deletedCount === 0) {
            return res.status(statusCode.NotFound).json({
                message: "Agent not found.",
            });
        }

        return res.status(statusCode.OK).json({
            message: "Agent permanently deleted successfully.",
        });
    } catch (error) {
        console.error("Error:", error);
        return res.status(statusCode.InternalServerError).json({
            message: errorMessage.lblInternalServerError,
        });
    }
};


// get agent of particular branch
exports.getAgentOfParticularBranch = async (req, res) => {
    try {
        const { branchId } = req.params;

        const admin = req.user;

        if (admin.roleId !== 1) {
            return res.status(statusCode.Unauthorized).send({
                message: "Unauthorize to access this."
            });
        }


        if (branchId) {
            let whereCondition = {
                isActive: true,
                deletedAt: null,
                roleId: 2,
                branchId: branchId
            };

            const agents = await userModel.find(whereCondition);

            console.log("agents", agents);

            if (agents.length > 0) {
                return res.status(statusCode.OK).json({
                    message: "Agents Found successfully.",
                    count: agents.length,
                    agents: agents

                });

            } else {

                return res.status(statusCode.NotFound).json({
                    message: "Agents Not Found successfully.",
                    agents: null

                });

            }


        } else {

            return res.status(statusCode.BadRequest).json({
                message: "BranchId Not Provided",
            });

        }

    } catch (error) {
        console.error("Error:", error);
        return res.status(statusCode.InternalServerError).json({
            message: errorMessage.lblInternalServerError,
        });
    }
};

// ###------------ agent controller ends here-------------








// ###------------ branch controller starts here------------


// update branch 
exports.updateBranch = async (req, res) => {

    try {

        const admin = req.user;
        if (admin.roleId !== 1) {
            return res.status(statusCode.Unauthorized).send({
                message: "Unauthorize to access this."
            })
        }

        const { id, branchName, branchCode, pinCode, openingDate, contactEmail, landlineNumber, phone, city, state, country, address, locality, GSTIN, status } = req.body;

        if (id) {
            const branchInfo = await Branch.findById(id);
            if (branchInfo) {

                // checking of phone and email

                const errors = await checkEmailAnsPassword(phone, contactEmail, id);

                if (errors.length > 0) {
                    return res.status(statusCode.ExpectationFailed).send({
                        message: errors.join(', ')
                    });
                }

                const branchVissible = locality.toUpperCase() + " " + "BRANCH";
                const updateBranch = await Branch.updateOne({ _id: id }, {
                    branchName: branchName,
                    branchVisibleName: branchVissible,
                    pinCode: pinCode,
                    openingDate: openingDate,
                    contactEmail: contactEmail,
                    landlineNumber: landlineNumber,
                    phone: phone,
                    city: city,
                    state: state,
                    country: country,
                    GSTIN: GSTIN,
                    status: status,
                    address: address,
                    locality: locality
                });

                if (updateBranch) {
                    return res.status(statusCode.OK).send({
                        message: "Brnach updated successfully."
                    })
                } else {
                    return res.status(statusCode.ExpectationFailed).send({
                        message: "Error Occured In Updating The Branch.."
                    })
                }
            } else {
                return res.status(statusCode.NotFound).send({
                    message: "Brnach not found."
                })
            }
        } else {
            const branchs = await Branch.find();
            let count = branchs.length + 1;
            let formattedNumber = count.toString();
            if (formattedNumber.length === 1) {
                formattedNumber = '0' + formattedNumber;
            }
            const words = locality.split(' ');

            const date = new Date().toLocaleDateString().split("/")

            const code1 = words.length > 0 ? words[0].toUpperCase() : '';

            const finalCode = city.toUpperCase() + "-" + code1 + "-" + date[2] + "-" + branchName.toUpperCase() + "-" + formattedNumber;

            const branchVissible = locality.toUpperCase() + " " + "BRANCH";


            // checking of phone and email

            const errors = await checkEmailAnsPassword(phone, contactEmail, id);

            if (errors.length > 0) {
                return res.status(statusCode.ExpectationFailed).send({
                    message: errors.join(', ')
                });
            }


            // create branch 
            const create = await Branch.create({
                branchName: branchName,
                branchVisibleName: branchVissible,
                branchCode: finalCode,
                pinCode: pinCode,
                openingDate: openingDate,
                contactEmail: contactEmail,
                landlineNumber: landlineNumber,
                phone: phone,
                city: city,
                state: state,
                country: country,
                GSTIN: GSTIN,
                status: status,
                address: address,
                locality: locality,
            })

            if (create) {
                return res.status(statusCode.OK).send({
                    message: "Brnach Created successfully."
                })
            } else {
                return res.status(statusCode.ExpectationFailed).send({
                    message: "Error Occured In Creating The Branch.."
                })
            }

        }
    } catch (error) {
        console.log("error", error);
        return res.status(statusCode.InternalServerError).send({
            message: errorMessage.lblInternalServerError
        })
    }
}

// get branches with filterationd
// exports.listBranches = async (req, res, next, listAll = "false", isActive = "true") => {
//     try {
//         const { roleId } = req.user;
//         // const searchText = req.query.keyword ? req.query.keyword : '';
//         const searchText = req.query.keyword ? req.query.keyword.trim() : '';

//         const all = req.query.all ? req.query.all : listAll;
//         const active = req.query.active ? req.query.active : isActive;
//         const page = req.query.page ? req.query.page : 1;
//         const limit = req.query.perPage ? req.query.perPage : 10;
//         const skip = (page - 1) * limit;

//         console.log("req guery", req.query);

//         const whereCondition = {
//             status: active === "true",
//             deletedAt: null
//         };

//         if (searchText) {
//             whereCondition.$or = [
//                 { branchName: { $regex: searchText, $options: 'i' } },
//                 { branchVisibleName: { $regex: searchText, $options: 'i' } },
//                 { branchCode: { $regex: searchText, $options: 'i' } },
//                 { locality: { $regex: searchText, $options: 'i' } },
//                 // { openingDate: new Date(searchText) },
//                 { city: { $regex: searchText, $options: 'i' } },
//                 { state: { $regex: searchText, $options: 'i' } },
//             ];
//         }

//         if (all === "false" && roleId === 2) {
//             whereCondition.deletedAt = null;
//         }

//         console.log("whereCondition", whereCondition);

//         const branches = await branchModel.find(whereCondition)
//             .skip(parseInt(skip))
//             .limit(parseInt(limit))
//             .sort({ _id: 'desc' });

//         return res.json({
//             message: 'List branches!',
//             count: branches.length,
//             listBranches: branches,
//         });
//     } catch (error) {
//         res.status(statusCode.InternalServerError).send({
//             message: error.message || errorMessage.lblInternalServerError,
//         });
//     }
// };


// new code for list branches
exports.listBranches = async (req, res, next, listAll = "false", isActive = "true") => {
    try {
        const { roleId } = req.user;
        const searchText = req.query.keyword ? req.query.keyword.trim() : '';

        const all = req.query.all || listAll;
        const active = req.query.active || isActive;
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.perPage) || 10;
        const skip = (page - 1) * limit;

        const whereCondition = {
            // status: active === "true",
            deletedAt: null
        };

        if (searchText) {
            whereCondition.$or = [
                { branchName: { $regex: searchText, $options: 'i' } },
                { branchVisibleName: { $regex: searchText, $options: 'i' } },
                { branchCode: { $regex: searchText, $options: 'i' } },
                { locality: { $regex: searchText, $options: 'i' } },
                { city: { $regex: searchText, $options: 'i' } },
                { state: { $regex: searchText, $options: 'i' } },
            ];
        }

        if (all === "false" && roleId === 2) {
            whereCondition.deletedAt = null;
        }

        console.log("whereCondition", whereCondition);

        const [branches, count] = await Promise.all([
            branchModel.find(whereCondition).skip(skip).limit(limit).sort({ _id: 'desc' }),
            branchModel.countDocuments(whereCondition),
        ]);

        return res.json({
            message: 'List branches!',
            count: count,
            listBranches: branches,
        });
    } catch (error) {
        res.status(statusCode.InternalServerError).send({
            message: error.message || errorMessage.lblInternalServerError,
        });
    }
};

// get branchs list
exports.getBranchs = async (req, res) => {

    try {

        const admin = req.user;
        if (admin.roleId > 2) {
            return res.status(statusCode.Unauthorized).send({
                message: "Unauthorize to access this."
            })
        }

        const branchsList = await branchModel.find();
        if (branchsList && branchsList.length > 0) {
            return res.status(statusCode.OK).send({
                message: "Branchs list found successfully.",
                branchs: branchsList,
                count: branchsList.length
            })
        } else {
            return res.status(statusCode.NotFound).send({
                branchs: null,
                message: "Branch Not Found."
            })
        }

    } catch (error) {
        console.log("error", error);
        return res.status(statusCode.InternalServerError).send({
            message: errorMessage.lblInternalServerError
        })
    }
}

// branch InActive
exports.branchInActive = async (req, res) => {

    try {

        const admin = req.user;
        const id = req.params?.id;

        const { status } = req.body

        if (admin.roleId !== 1) {
            return res.status(statusCode.Unauthorized).send({
                message: "Unauthorize to access this."
            })
        }

        const branch = await branchModel.findById(id);

        if (branch) {

            if (status) {
                const update = await branchModel.updateOne({ _id: id }, { status: status })

                if (update) {
                    return res.status(statusCode.OK).send({
                        message: "Branch Has Been Activated..."
                    })

                } else {
                    return res.status(statusCode.ExpectationFailed).send({
                        message: "Error Occured In Activating Branch"
                    })
                }

            } else {
                const update = await branchModel.updateOne({ _id: id }, { status: status })

                console.log("update", update);

                if (update) {
                    return res.status(statusCode.OK).send({
                        message: "Branch Has Been InActivated..."
                    })

                } else {
                    return res.status(statusCode.ExpectationFailed).send({
                        message: "Error Occured In InActivating Branch"
                    })
                }
            }



        } else {

            return res.status(statusCode.ExpectationFailed).send({
                message: "Branch Not Found..."
            })

        }



    } catch (error) {
        console.log("error", error);
        return res.status(statusCode.InternalServerError).send({
            message: errorMessage.lblInternalServerError
        })
    }
}

// get particular branch
exports.getParticularBranch = async (req, res) => {

    try {

        const admin = req.user;

        const id = req.params?.id;

        if (admin.roleId !== 1) {

            return res.status(statusCode.Unauthorized).send({
                message: "Unauthorize to access this."
            })

        }

        const branch = await branchModel.findById(id);

        if (branch) {

            return res.status(statusCode.OK).send({
                data: branch,
                message: "Branch Get Successfully..."
            })

        } else {

            return res.status(statusCode.ExpectationFailed).send({
                message: "Branch Not Found..."
            })

        }


    } catch (error) {

        console.log("error", error);

        return res.status(statusCode.InternalServerError).send({
            message: errorMessage.lblInternalServerError
        })

    }
}

// Soft delete a branch
exports.softDeleteBranch = async (req, res) => {
    try {
        const { id } = req.params;

        const admin = req.user;

        if (admin.roleId !== 1) {

            return res.status(statusCode.Unauthorized).send({
                message: "Unauthorize to access this."
            })

        }

        // Soft delete the branch by updating the deletedAt field
        const deletedBranch = await branchModel.findByIdAndUpdate(
            id,
            { deletedAt: new Date() },
            { new: true }
        );

        if (!deletedBranch) {
            return res.status(statusCode.NotFound).json({
                message: "Branch not found.",
            });
        }

        return res.status(statusCode.OK).json({
            message: "Branch soft deleted successfully.",
            deletedBranch,
        });
    } catch (error) {
        console.error("Error:", error);
        return res.status(statusCode.InternalServerError).json({
            message: errorMessage.lblInternalServerError,
        });
    }
};

// permanent delete brnach
exports.deleteBranch = async (req, res) => {
    try {
        const { id } = req.params;

        const admin = req.user;

        if (admin.roleId !== 1) {
            return res.status(statusCode.Unauthorized).send({
                message: "Unauthorize to access this."
            });
        }

        // Perform permanent deletion
        const deletedBranch = await branchModel.deleteOne({ _id: id });

        if (deletedBranch.deletedCount === 0) {
            return res.status(statusCode.NotFound).json({
                message: "Branch not found.",
            });
        }

        return res.status(statusCode.OK).json({
            message: "Branch permanently deleted successfully.",
        });
    } catch (error) {
        console.error("Error:", error);
        return res.status(statusCode.InternalServerError).json({
            message: errorMessage.lblInternalServerError,
        });
    }
};

// Restore a soft-deleted branch
exports.restoreBranch = async (req, res) => {
    try {
        const { id } = req.params;

        const admin = req.user;

        if (admin.roleId !== 1) {

            return res.status(statusCode.Unauthorized).send({
                message: "Unauthorize to access this."
            })

        }

        // Restore the branch by setting deletedAt to null
        const restoredBranch = await branchModel.findByIdAndUpdate(
            id,
            { deletedAt: null },
            { new: true }
        );

        if (!restoredBranch) {

            return res.status(statusCode.NotFound).json({
                message: "Branch not found.",
            });

        }

        return res.status(statusCode.OK).json({
            message: "Branch restored successfully.",
            restoredBranch,
        });
    } catch (error) {
        console.error("Error:", error);
        return res.status(statusCode.InternalServerError).json({
            message: errorMessage.lblInternalServerError,
        });
    }
};

// get soft deleted branches with filterationd
// exports.listSoftDeletedBranches = async (req, res, next, listAll = "false", isActive = "true") => {
//     try {
//         const { roleId } = req.user;
//         // const searchText = req.query.keyword ? req.query.keyword : '';
//         const searchText = req.query.keyword ? req.query.keyword.trim() : '';

//         const all = req.query.all ? req.query.all : listAll;
//         const active = req.query.active ? req.query.active : isActive;
//         const page = req.query.page ? req.query.page : 1;
//         const limit = req.query.perPage ? req.query.perPage : 10;
//         const skip = (page - 1) * limit;

//         const whereCondition = {
//             status: active === "true",
//             deletedAt: { $ne: null }
//         };

//         if (searchText) {
//             whereCondition.$or = [
//                 { branchName: { $regex: searchText, $options: 'i' } },
//                 { branchVisibleName: { $regex: searchText, $options: 'i' } },
//                 { branchCode: { $regex: searchText, $options: 'i' } },
//                 { locality: { $regex: searchText, $options: 'i' } },
//                 // { openingDate: new Date(searchText) },
//                 { city: { $regex: searchText, $options: 'i' } },
//                 { state: { $regex: searchText, $options: 'i' } },
//             ];
//         }

//         if (all === "false" && roleId === 2) {
//             whereCondition.deletedAt = null;
//         }

//         console.log("whereCondition", whereCondition);

//         const branches = await branchModel.find(whereCondition)
//             .skip(parseInt(skip))
//             .limit(parseInt(limit))
//             .sort({ _id: 'desc' });

//         return res.json({
//             message: 'List branches!',
//             count: branches.length,
//             listBranches: branches,
//         });
//     } catch (error) {
//         res.status(statusCode.InternalServerError).send({
//             message: error.message || errorMessage.lblInternalServerError,
//         });
//     }
// };


// new code for soft deleted branch list
exports.listSoftDeletedBranches = async (req, res, next, listAll = "false", isActive = "true") => {
    try {
        const { roleId } = req.user;
        const searchText = req.query.keyword ? req.query.keyword.trim() : '';

        const all = req.query.all || listAll;
        const active = req.query.active || isActive;
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.perPage) || 10;
        const skip = (page - 1) * limit;

        const whereCondition = {
            // status: active === "true",
            deletedAt: { $ne: null }
        };

        if (searchText) {
            whereCondition.$or = [
                { branchName: { $regex: searchText, $options: 'i' } },
                { branchVisibleName: { $regex: searchText, $options: 'i' } },
                { branchCode: { $regex: searchText, $options: 'i' } },
                { locality: { $regex: searchText, $options: 'i' } },
                { city: { $regex: searchText, $options: 'i' } },
                { state: { $regex: searchText, $options: 'i' } },
            ];
        }

        if (all === "false" && roleId === 2) {
            whereCondition.deletedAt = null;
        }

        console.log("whereCondition", whereCondition);

        const [branches, count] = await Promise.all([
            branchModel.find(whereCondition).skip(skip).limit(limit).sort({ _id: 'desc' }),
            branchModel.countDocuments(whereCondition),
        ]);

        return res.json({
            message: 'List soft-deleted branches!',
            count: count,
            listBranches: branches,
        });
    } catch (error) {
        res.status(statusCode.InternalServerError).send({
            message: error.message || errorMessage.lblInternalServerError,
        });
    }
};


//###---------- branch controller ends here-----------






//###--------- Apply loan for user controller starts here---------




// #-----loan form details starts here



// submit Loan Details Form by admin

exports.adminSubmitLoanDetailsForm = async (req, res) => {

    try {


        const { productId, ...rest } = req.body

        const user = req.user;
        const userExist = await userModel.findOne({ email: user.email });

        if (userExist) {

            if (user.roleId < 3) {

                // const loanId = 

                const countLoanApplication = await ApplicantForm.countDocuments({});

                const count = countLoanApplication + 1;
                const stringCode = "SMS/" + "542/" + count + "-" + new Date().getFullYear() + "/" + "245"

                const formSubmit = await ApplicantForm.create({ ...rest, loanId: stringCode });

                const trackingDetails = {
                    productId: req.body.productId,
                    userId: req.body.userId,
                    loanFormId: formSubmit._id,
                    stepAt: "1",
                    loanFormCompleted: true
                }

                const tracking = await LoanFormTracking.create(trackingDetails);


                return res.status(statusCode.OK).send({
                    message: "Sucessfully submitted...",
                    loanForm: formSubmit,
                    trackingdata: tracking
                })

            } else {
                return res.status(statusCode.OK).send({
                    message: "Not Authorized to Submit Loan Application..",
                    loanForm: null
                })

            }

        } else {
            return res.status(statusCode.NotFound).send({

                message: "Admin Not Found"
            })
        }

    } catch (error) {

        console.log("error", error);
        return res.status(statusCode.InternalServerError).send({
            message: errorMessage.lblInternalServerError
        })

    }

}


// edit loan details from by admin
exports.adminEditLoanDetailsForm = async (req, res) => {

    try {

        const dataObject = req.body;
        const { id } = req.params;  // loan form Id


        const user = req.user;
        const userExist = await userModel.findOne({ email: user.email });

        if (userExist) {

            if (user.roleId < 3) {
                const formSubmit = await ApplicantForm.findById(id);
                if (formSubmit) {

                    const update = await ApplicantForm.updateOne({ _id: id }, { ...dataObject });

                    console.log("update", update);

                    if (update.acknowledged) {
                        const formSubmit = await ApplicantForm.findById(id);
                        const tracking = await LoanFormTracking.findOne({ loanFormId: id });


                        return res.status(statusCode.OK).send({
                            message: "Form Updated Successsfully...",
                            data: formSubmit,
                            trackingdata: tracking
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
                return res.status(statusCode.OK).send({
                    message: "Not Authorized to edit Loan Application..",
                })

            }



        } else {
            return res.status(statusCode.NotFound).send({
                message: "Admin Not Found"
            })
        }

    } catch (error) {

        console.log("error", error);
        return res.status(statusCode.InternalServerError).send({
            message: errorMessage.lblInternalServerError
        })

    }

}



// get submitted loan from information by admin
exports.adminGetSubmitLoanDetailsForm = async (req, res) => {

    try {

        const { id } = req.params;   // loan from id

        const user = req.user;
        const userExist = await userModel.findOne({ email: user.email });

        if (userExist) {

            if (user.roleId < 3) {
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
                return res.status(statusCode.OK).send({
                    message: "Not Authorized to get Loan Application..",
                })

            }

        } else {
            return res.status(statusCode.NotFound).send({
                message: "Admin Not Found"
            })
        }

    } catch (error) {

        console.log("error", error);
        return res.status(statusCode.InternalServerError).send({
            message: errorMessage.lblInternalServerError
        })

    }

}


// #-----loan form details ends here


// #-----Applocant personal details starts here


// submit applicant info
exports.adminSubmitApplicantInfo = async (req, res) => {

    try {

        const { loanFormId, firstName, lastName, dateOfBirth, maritalStatus, email, optionalEmail, phone, emergencyPhone, city, state, ZipCode, propertyOwnerShip, jobTitle, placeOfWork, workAddress, yearOfExperience, monthlyNetIncome } = req.body
        const user = req.user;
        const userExist = await userModel.findOne({ email: user.email });
        if (userExist) {

            if (user.roleId < 3) {

                const fromExist = await ApplicantForm.findById(loanFormId);

                if (fromExist) {

                    const appliacntInfoSubmit = await ApplicantInfo.create(req.body);

                    const trackingDetails = {
                        stepAt: "2",
                        applicantInfoCompleted: true

                    }

                    const update = await LoanFormTracking.updateOne({ loanFormId: loanFormId }, trackingDetails)

                    if (appliacntInfoSubmit) {
                        const fromExist = await LoanFormTracking.findOne({ loanFormId: loanFormId });

                        return res.status(statusCode.OK).send({
                            message: "Applicant Info Sucessfully submitted...",
                            applicantData: appliacntInfoSubmit,
                            trackingdata: fromExist,

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
                return res.status(statusCode.OK).send({
                    message: "Not Authorized to submit Applicat Info..",
                })

            }

        } else {
            return res.status(statusCode.NotFound).send({
                message: "Admin Not Found"
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
exports.adminEditApplicantInfo = async (req, res) => {

    try {

        const dataObject = req.body;
        const { id } = req.params;  // applicant info id


        const user = req.user;
        const userExist = await userModel.findOne({ email: user.email });

        if (userExist) {

            if (user.roleId < 3) {
                const applicantFormSubmit = await ApplicantInfo.findById(id);

                if (applicantFormSubmit) {

                    const update = await ApplicantInfo.updateOne({ _id: id }, { ...dataObject });


                    if (update.acknowledged) {
                        const appliacntInfoSubmit = await ApplicantInfo.findById(id);

                        return res.status(statusCode.OK).send({
                            message: "Applicant Details Updated Successsfully...",
                            applicantData: appliacntInfoSubmit,

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
                return res.status(statusCode.OK).send({
                    message: "Not Authorized to edit Applicat Info..",
                })

            }



        } else {
            return res.status(statusCode.NotFound).send({
                message: "Admin Not Found"
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
exports.adminGetSubmitedApplicantInfo = async (req, res) => {

    try {

        const { id } = req.params;   // applicant info id

        const user = req.user;
        const userExist = await userModel.findOne({ email: user.email });

        if (userExist) {

            if (user.roleId < 3) {
                const formSubmit = await ApplicantInfo.findOne({ loanFormId: id })
                // .populate("userId");

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
                return res.status(statusCode.OK).send({
                    message: "Not Authorized to get Applicat Info..",
                })

            }

        } else {
            return res.status(statusCode.NotFound).send({
                message: "Admin Not Found"
            })
        }

    } catch (error) {

        console.log("error", error);
        return res.status(statusCode.InternalServerError).send({
            message: errorMessage.lblInternalServerError
        })

    }

}


// #-----Applicant personal details ends here



// #-----Applicant bank details starts here

// submit bank info
exports.adminSubmitApplicantBankInfo = async (req, res) => {

    try {

        const { loanFormId, userId, bankName, branchName, accountType, accountNumber, ifscCode } = req.body
        const user = req.user;
        const userExist = await userModel.findOne({ email: user.email });
        if (userExist) {

            if (user.roleId < 3) {
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
                        stepAt: "3",
                        bankInfoCompleted: true
                    }

                    const update = await LoanFormTracking.updateOne({ loanFormId: loanFormId }, trackingDetails);


                    if (appliacntBankInfoSubmit) {
                        const fromExist = await LoanFormTracking.findOne({ loanFormId: loanFormId });

                        return res.status(statusCode.OK).send({
                            message: "Bank Info Sucessfully submitted...",
                            appliacntBankInfo: appliacntBankInfoSubmit,
                            trackingdata: fromExist,
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
                return res.status(statusCode.OK).send({
                    message: "Not Authorized to submit Applicat Bank Info..",
                })

            }

        } else {
            return res.status(statusCode.NotFound).send({
                message: "Admin Not Found"
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
exports.adminEditApplicantBankInfo = async (req, res) => {

    try {

        const dataObject = req.body;
        const { id } = req.params;

        const user = req.user;
        const userExist = await userModel.findOne({ email: user.email });

        if (userExist) {

            if (user.roleId < 3) {
                const bankInfo = await BankInfo.findById(id);

                if (bankInfo) {

                    const update = await BankInfo.updateOne({ _id: id }, { ...dataObject });

                    if (update.acknowledged) {

                        const bankInfo = await BankInfo.findById(id);

                        return res.status(statusCode.OK).send({
                            message: "Applicant Bank Details Updated Successsfully...",
                            appliacntBankInfo: bankInfo,

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
                return res.status(statusCode.OK).send({
                    message: "Not Authorized to edit Applicat Bank Info..",
                })

            }

        } else {
            return res.status(statusCode.NotFound).send({
                message: "Admin Not Found"
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
exports.adminGetSubmitedApplicantBankInfo = async (req, res) => {

    try {

        const { id } = req.params;

        const user = req.user;
        const userExist = await userModel.findOne({ email: user.email });

        if (userExist) {

            if (user.roleId < 3) {
                const formSubmit = await BankInfo.findOne({ loanFormId: id })
                // .populate("userId").populate("loanFormId");

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
                return res.status(statusCode.OK).send({
                    message: "Not Authorized to get Applicat Bank Info..",
                })

            }

        } else {
            return res.status(statusCode.NotFound).send({
                message: "Admin Not Found"
            })
        }

    } catch (error) {

        console.log("error", error);
        return res.status(statusCode.InternalServerError).send({
            message: errorMessage.lblInternalServerError
        })

    }

}


// upload passbook

exports.uploadPassbook = async (req, res) => {

    try {

        const { id } = req.body;

        let profileObject = {}



        if (req.file && req.file.filename) {
            // profileImageName = req.file.filename
            profileObject = {
                ...profileObject,
                passBookFrontImage: req.file.filename

            }
        }


        const bankInfo = await BankInfo.findById(id);

        if (bankInfo) {

            const update = await BankInfo.updateOne({ _id: id }, { ...profileObject });

            if (update.acknowledged) {

                const bankInfo = await BankInfo.findById(id);

                return res.status(statusCode.OK).send({
                    message: "Applicant Passbook Updated Successsfully...",
                    appliacntBankInfo: bankInfo,

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


    } catch (error) {

    }

}

// #-----Applicant bank details ends here



// #-----Applicant guarantor details starts here


// submit guarantor info
exports.adminSubmitApplicantGuarantorInfo = async (req, res) => {

    try {


        const { loanFormId, userId } = req.body
        const user = req.user;
        const userExist = await userModel.findOne({ email: user.email });

        if (userExist) {

            if (user.roleId < 3) {

                const fromExist = await ApplicantForm.findById(loanFormId);


                if (fromExist) {

                    const { loanFormId, } = req.body

                    const appliacntGuarantorInfoSubmit = await GuarantorInfo.create({
                        ...req.body
                    });

                    const trackingDetails = {
                        stepAt: "4",
                        guarantorInfoCompleted: true

                    }

                    const update = await LoanFormTracking.updateOne({ loanFormId: loanFormId }, trackingDetails)


                    if (appliacntGuarantorInfoSubmit) {
                        const fromExist = await LoanFormTracking.findOne({ loanFormId: loanFormId });

                        return res.status(statusCode.OK).send({
                            message: "Guarantor Info Sucessfully submitted...",
                            applicantGuarantorInfo: appliacntGuarantorInfoSubmit,
                            trackingdata: fromExist,
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
                return res.status(statusCode.OK).send({
                    message: "Not Authorized to submit Applicat Guarantor Info..",
                })

            }



        } else {
            return res.status(statusCode.NotFound).send({
                message: "Admin Not Found"
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
exports.adminEditApplicantGuarantorInfo = async (req, res) => {

    try {

        const dataObject = req.body;
        const { id } = req.params;

        const user = req.user;
        const userExist = await userModel.findOne({ email: user.email });

        if (userExist) {

            if (user.roleId < 3) {

                const guarantorInfo = await GuarantorInfo.findById(id);

                if (guarantorInfo) {

                    const update = await GuarantorInfo.updateOne({ _id: id }, { ...dataObject });

                    if (update.acknowledged) {
                        const guarantorInfo = await GuarantorInfo.findById(id);

                        return res.status(statusCode.OK).send({
                            message: "Applicant Guarantor Details Updated Successsfully...",
                            applicantGuarantorInfo: guarantorInfo,
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
                return res.status(statusCode.OK).send({
                    message: "Not Authorized to edit Applicat Guarantor Info..",
                })

            }



        } else {
            return res.status(statusCode.NotFound).send({
                message: "Admin Not Found"
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
exports.adminGetSubmitedApplicantGuarantorInfo = async (req, res) => {

    try {

        const { id } = req.params;

        const user = req.user;
        const userExist = await userModel.findOne({ email: user.email });

        if (userExist) {

            if (user.roleId < 3) {
                const guarantor = await GuarantorInfo.findOne({ loanFormId: id })
                // .populate("userId").populate("loanFormId");

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
                return res.status(statusCode.OK).send({
                    message: "Not Authorized to get Applicat Guarantor Info..",
                })

            }

        } else {
            return res.status(statusCode.NotFound).send({
                message: "Admin Not Found"
            })
        }

    } catch (error) {

        console.log("error", error);
        return res.status(statusCode.InternalServerError).send({
            message: errorMessage.lblInternalServerError
        })

    }

}


// upload guarantor photo and signature
exports.adminUpdatePhotoAndSignatureOfGuarantor = async (req, res) => {

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

            if (user.roleId < 3) {

                const update = await GuarantorInfo.updateOne({ loanFormId: loanFormId }, {
                    photo: profileImageName[0],
                    signature: profileImageName[1]
                });

                if (update.acknowledged) {

                    const trackingDetails = {
                        stepAt: "5"
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
                return res.status(statusCode.OK).send({
                    message: "Not Authorized to upload Applicat Guarantor photo and signature..",
                })

            }

        } else {
            return res.status(statusCode.NotFound).send({
                message: "Admin Not Found"
            })
        }
    } catch (error) {
        console.log("error", error);
        return res.status(statusCode.InternalServerError).send({
            message: errorMessage.lblInternalServerError
        })
    }
}



// ##----guarantor adhar back and front 
exports.adminUpdateAdharBackAndFrontOfGuarantor = async (req, res) => {

    try {

        const user = req.user;

        const { loanFormId, userId, adharNumber } = req.body

        let profileImageName = [];


        if (req.files && req.files.length > 1) {

            for (let index = 0; index < req.files.length; index++) {
                const element = req.files[index];
                profileImageName.push(element.filename)
            }

        }
        // else {
        //     return res.status(statusCode.BadRequest).send({
        //         message: "image Not Provided"
        //     })
        // }

        const userExist = await userModel.findOne({ email: user.email });
        if (userExist) {

            if (user.roleId < 3) {
                const update = await GuarantorInfo.updateOne({ loanFormId: loanFormId }, {
                    adharFrontImage: profileImageName[0],
                    adharBackImage: profileImageName[1],
                    adharNumber: adharNumber
                });

                if (update.acknowledged) {

                    const trackingDetails = {
                        stepAt: "4"
                    }

                    const update = await LoanFormTracking.updateOne({ loanFormId: loanFormId }, trackingDetails);

                    const guarantorInfo = await GuarantorInfo.findOne({ loanFormId: loanFormId })

                    return res.status(statusCode.OK).send({
                        message: "Guarantor Adhar Card uploaded successfully...",
                        applicantGuarantorInfo: guarantorInfo,

                    })

                } else {
                    return res.status(statusCode.ExpectationFailed).send({
                        message: "Error Occured while uploading Guarantor Adhar Card"
                    })
                }
            } else {
                return res.status(statusCode.OK).send({
                    message: "Not Authorized to upload Applicat Guarantor Adhar",
                })

            }





        } else {
            return res.status(statusCode.NotFound).send({
                message: "Admin Not Found"
            })
        }
    } catch (error) {
        console.log("error", error);
        return res.status(statusCode.InternalServerError).send({
            message: errorMessage.lblInternalServerError
        })
    }
}

// ##----guarantor pan back and front 
exports.adminUpdatePanBackAndFrontOfGuarantor = async (req, res) => {

    try {

        const user = req.user;

        const { loanFormId, userId, panNumber } = req.body

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

            if (user.roleId < 3) {

                const update = await GuarantorInfo.updateOne({ loanFormId: loanFormId }, {
                    panFrontImage: profileImageName[0],
                    panBackImage: profileImageName[1],
                    panNumber: panNumber
                });

                if (update.acknowledged) {

                    const trackingDetails = {
                        stepAt: "5"
                    }

                    const update = await LoanFormTracking.updateOne({ loanFormId: loanFormId }, trackingDetails)

                    return res.status(statusCode.OK).send({
                        message: "Guarantor Pan Card uploaded successfully..."
                    })

                } else {
                    return res.status(statusCode.ExpectationFailed).send({
                        message: "Error Occured while uploading Guarantor Pan Card"
                    })
                }

            } else {
                return res.status(statusCode.OK).send({
                    message: "Not Authorized to upload Applicat Guarantor Pan",
                })

            }


        } else {
            return res.status(statusCode.NotFound).send({
                message: "Admin Not Found"
            })
        }
    } catch (error) {
        console.log("error", error);
        return res.status(statusCode.InternalServerError).send({
            message: errorMessage.lblInternalServerError
        })
    }
}

// ##----guarantor voter back and front 
exports.adminUpdateVoterBackAndFrontOfGuarantor = async (req, res) => {

    try {

        const user = req.user;

        const { loanFormId, userId, voterNumber } = req.body

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

            if (user.roleId < 3) {
                const update = await GuarantorInfo.updateOne({ loanFormId: loanFormId }, {
                    voterFrontImage: profileImageName[0],
                    voterBackImage: profileImageName[1],
                    voterNumber: voterNumber

                });

                if (update.acknowledged) {

                    const trackingDetails = {
                        stepAt: "5"
                    }

                    const update = await LoanFormTracking.updateOne({ loanFormId: loanFormId }, trackingDetails)

                    return res.status(statusCode.OK).send({
                        message: "Guarantor Voter Card uploaded successfully..."
                    })

                } else {
                    return res.status(statusCode.ExpectationFailed).send({
                        message: "Error Occured while uploading Guarantor Voter Card"
                    })
                }
            } else {
                return res.status(statusCode.OK).send({
                    message: "Not Authorized to upload Applicat Guarantor Voter",
                })

            }



        } else {
            return res.status(statusCode.NotFound).send({
                message: "Admin Not Found"
            })
        }
    } catch (error) {
        console.log("error", error);
        return res.status(statusCode.InternalServerError).send({
            message: errorMessage.lblInternalServerError
        })
    }
}

// ##----guarantor driving license back and front 
exports.adminUpdateLicenseBackAndFrontOfGuarantor = async (req, res) => {

    try {

        const user = req.user;

        const { loanFormId, userId, drivingLicenseNumber } = req.body

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

            if (user.roleId < 3) {
                const update = await GuarantorInfo.updateOne({ loanFormId: loanFormId }, {
                    drivingFrontImage: profileImageName[0],
                    drivingBackImage: profileImageName[1],
                    drivingLicenseNumber: drivingLicenseNumber
                });

                if (update.acknowledged) {

                    const trackingDetails = {
                        stepAt: "5"
                    }

                    const update = await LoanFormTracking.updateOne({ loanFormId: loanFormId }, trackingDetails)

                    return res.status(statusCode.OK).send({
                        message: "Guarantor Driving License uploaded successfully..."
                    })

                } else {
                    return res.status(statusCode.ExpectationFailed).send({
                        message: "Error Occured while uploading Guarantor Driving License"
                    })
                }
            } else {
                return res.status(statusCode.OK).send({
                    message: "Not Authorized to upload Applicat Guarantor License.",
                })
            }

        } else {
            return res.status(statusCode.NotFound).send({
                message: "Admin Not Found"
            })
        }
    } catch (error) {
        console.log("error", error);
        return res.status(statusCode.InternalServerError).send({
            message: errorMessage.lblInternalServerError
        })
    }
}


// ##---- guarantor identity submit
exports.adminGuarantorIdentitySubmit = async (req, res) => {

    try {


        const { loanFormId, userId } = req.body
        const user = req.user;
        const userExist = await userModel.findOne({ email: user.email });

        if (userExist) {

            if (user.roleId < 3) {

                const fromExist = await ApplicantForm.findById(loanFormId);


                if (fromExist) {

                    const { loanFormId, } = req.body

                    const trackingDetails = {
                        guarantorIdentityUploadCompleted: true
                    }

                    const update = await LoanFormTracking.updateOne({ loanFormId: loanFormId }, trackingDetails)

                    return res.status(statusCode.OK).send({
                        message: "Guarantor Identity Uploaded Successfully submitted...",
                    })

                } else {

                    return res.status(statusCode.NotFound).send({
                        message: "Loan Form Not Found...",
                    })

                }
            } else {
                return res.status(statusCode.OK).send({
                    message: "Not Authorized to submit Applicat Guarantor Info..",
                })

            }



        } else {
            return res.status(statusCode.NotFound).send({
                message: "Admin Not Found"
            })
        }

    } catch (error) {

        console.log("error", error);
        return res.status(statusCode.InternalServerError).send({
            message: errorMessage.lblInternalServerError
        })

    }

}


// #-----Applicant guarantor details ends here



// #----Applicant identity uploads by admin starts here

// ##----applicant adhar back and front 
exports.adminUpdateAdharBackAndFront = async (req, res) => {

    try {

        const user = req.user;

        const { loanFormId, userId, adharNumber } = req.body

        let profileImageName = [];


        if (req.files && req.files.length > 1) {

            for (let index = 0; index < req.files.length; index++) {
                const element = req.files[index];
                profileImageName.push(element.filename)
            }

        }

        // else {
        //     return res.status(statusCode.BadRequest).send({
        //         message: "image Not Provided"
        //     })
        // }

        const userExist = await userModel.findOne({ email: user.email });
        if (userExist) {

            if (user.roleId < 3) {
                const update = await ApplicantInfo.updateOne({ loanFormId: loanFormId }, {
                    adharFrontImage: profileImageName[0],
                    adharBackImage: profileImageName[1],
                    adharNumber: adharNumber
                });

                if (update.acknowledged) {

                    const trackingDetails = {
                        stepAt: "2",
                    }

                    const update = await LoanFormTracking.updateOne({ loanFormId: loanFormId }, trackingDetails);

                    const applicantInfo = await ApplicantInfo.findOne({ loanFormId: loanFormId })

                    return res.status(statusCode.OK).send({
                        message: "Adhar Card uploaded successfully...",
                        applicantInfo: applicantInfo
                    })

                } else {
                    return res.status(statusCode.ExpectationFailed).send({
                        message: "Error Occured while uploading Adhar Card"
                    })
                }

            } else {
                return res.status(statusCode.OK).send({
                    message: "Not Authorized to upload Applicat Adhar.",
                })
            }


        } else {
            return res.status(statusCode.NotFound).send({
                message: "Admin Not Found"
            })
        }
    } catch (error) {
        console.log("error", error);
        return res.status(statusCode.InternalServerError).send({
            message: errorMessage.lblInternalServerError
        })
    }
}


// ##----applicant pan card back and front 
exports.adminUpdatePanBackAndFront = async (req, res) => {

    try {

        const user = req.user;

        const { loanFormId, userId, panNumber } = req.body

        let profileImageName = [];


        if (req.files && req.files.length > 1) {

            for (let index = 0; index < req.files.length; index++) {
                const element = req.files[index];
                profileImageName.push(element.filename)
            }

        }
        //  else {
        //     return res.status(statusCode.BadRequest).send({
        //         message: "image Not Provided"
        //     })
        // }

        const userExist = await userModel.findOne({ email: user.email });
        if (userExist) {

            if (user.roleId < 3) {
                const update = await ApplicantInfo.updateOne({ loanFormId: loanFormId }, {
                    panFrontImage: profileImageName[0],
                    panBackImage: profileImageName[1],
                    panNumber: panNumber
                });

                if (update.acknowledged) {

                    const trackingDetails = {
                        stepAt: "2",
                    }

                    const update = await LoanFormTracking.updateOne({ loanFormId: loanFormId }, trackingDetails)
                    const applicantInfo = await ApplicantInfo.findOne({ loanFormId: loanFormId })


                    return res.status(statusCode.OK).send({
                        message: "Pan Card uploaded successfully...",
                        applicantInfo: applicantInfo
                    })

                } else {
                    return res.status(statusCode.ExpectationFailed).send({
                        message: "Error Occured while uploading Pan Card"
                    })
                }
            } else {
                return res.status(statusCode.OK).send({
                    message: "Not Authorized to upload Applicat Pan.",
                })
            }


        } else {
            return res.status(statusCode.NotFound).send({
                message: "Admin Not Found"
            })
        }
    } catch (error) {
        console.log("error", error);
        return res.status(statusCode.InternalServerError).send({
            message: errorMessage.lblInternalServerError
        })
    }
}


// ##----applicant voter card back and front 
exports.adminUpdateVoterBackAndFront = async (req, res) => {

    try {

        const user = req.user;

        const { loanFormId, userId, voterNumber } = req.body

        let profileImageName = [];


        if (req.files && req.files.length > 1) {

            for (let index = 0; index < req.files.length; index++) {
                const element = req.files[index];
                profileImageName.push(element.filename)
            }

        }

        // else {
        //     return res.status(statusCode.BadRequest).send({
        //         message: "image Not Provided"
        //     })
        // }

        const userExist = await userModel.findOne({ email: user.email });
        if (userExist) {

            if (user.roleId < 3) {
                const update = await ApplicantInfo.updateOne({ loanFormId: loanFormId }, {
                    voterFrontImage: profileImageName[0],
                    voterBackImage: profileImageName[1],
                    voterNumber: voterNumber

                });

                if (update.acknowledged) {

                    const trackingDetails = {
                        stepAt: "2",
                    }

                    const update = await LoanFormTracking.updateOne({ loanFormId: loanFormId }, trackingDetails);
                    const applicantInfo = await ApplicantInfo.findOne({ loanFormId: loanFormId })


                    return res.status(statusCode.OK).send({
                        message: "Voter Card uploaded successfully...",
                        applicantInfo: applicantInfo
                    })

                } else {
                    return res.status(statusCode.ExpectationFailed).send({
                        message: "Error Occured while uploading Voter Card"
                    })
                }
            } else {
                return res.status(statusCode.OK).send({
                    message: "Not Authorized to upload Applicat Voter.",
                })
            }



        } else {
            return res.status(statusCode.NotFound).send({
                message: "Admin Not Found"
            })
        }
    } catch (error) {
        console.log("error", error);
        return res.status(statusCode.InternalServerError).send({
            message: errorMessage.lblInternalServerError
        })
    }
}


// ##----applicant Driving License back and front 
exports.adminUpdateLicenseBackAndFront = async (req, res) => {

    try {

        const user = req.user;

        const { loanFormId, userId, drivingLicenseNumber } = req.body

        let profileImageName = [];


        if (req.files && req.files.length > 1) {

            for (let index = 0; index < req.files.length; index++) {
                const element = req.files[index];
                profileImageName.push(element.filename)
            }

        }
        // else {
        //     return res.status(statusCode.BadRequest).send({
        //         message: "image Not Provided"
        //     })
        // }

        const userExist = await userModel.findOne({ email: user.email });
        if (userExist) {

            if (user.roleId < 3) {
                const update = await ApplicantInfo.updateOne({ loanFormId: loanFormId }, {
                    drivingFrontImage: profileImageName[0],
                    drivingBackImage: profileImageName[1],
                    drivingLicenseNumber: drivingLicenseNumber
                });

                if (update.acknowledged) {

                    const trackingDetails = {
                        stepAt: "2",
                    }

                    const update = await LoanFormTracking.updateOne({ loanFormId: loanFormId }, trackingDetails);
                    const applicantInfo = await ApplicantInfo.findOne({ loanFormId: loanFormId })


                    return res.status(statusCode.OK).send({
                        message: "Driving License uploaded successfully...",
                        applicantInfo: applicantInfo
                    })

                } else {
                    return res.status(statusCode.ExpectationFailed).send({
                        message: "Error Occured while uploading Driving License"
                    })
                }
            } else {
                return res.status(statusCode.OK).send({
                    message: "Not Authorized to upload Applicat License.",
                })
            }

        } else {
            return res.status(statusCode.NotFound).send({
                message: "Admin Not Found"
            })
        }
    } catch (error) {
        console.log("error", error);
        return res.status(statusCode.InternalServerError).send({
            message: errorMessage.lblInternalServerError
        })
    }
}


// ##----applicant identity submit
exports.adminApplicantIdentitySubmit = async (req, res) => {

    try {


        const { loanFormId, userId } = req.body
        const user = req.user;
        const userExist = await userModel.findOne({ email: user.email });

        if (userExist) {

            if (user.roleId < 3) {

                const fromExist = await ApplicantForm.findById(loanFormId);


                if (fromExist) {

                    const { loanFormId, } = req.body

                    const trackingDetails = {
                        applicantIdentityUploadCompleted: true
                    }

                    const update = await LoanFormTracking.updateOne({ loanFormId: loanFormId }, trackingDetails)

                    return res.status(statusCode.OK).send({
                        message: "Guarantor Identity Uploaded Successfully submitted...",
                    })

                } else {

                    return res.status(statusCode.NotFound).send({
                        message: "Loan Form Not Found...",
                    })

                }
            } else {
                return res.status(statusCode.OK).send({
                    message: "Not Authorized to submit Applicat Guarantor Info..",
                })

            }



        } else {
            return res.status(statusCode.NotFound).send({
                message: "Admin Not Found"
            })
        }

    } catch (error) {

        console.log("error", error);
        return res.status(statusCode.InternalServerError).send({
            message: errorMessage.lblInternalServerError
        })

    }

}


// ##----applicant photo and signature
exports.adminUpdatePhotoAndSignature = async (req, res) => {

    try {

        const user = req.user;

        const { loanFormId, userId } = req.body

        let profileImageName = [];


        if (req.files && req.files.length > 1) {

            for (let index = 0; index < req.files.length; index++) {
                const element = req.files[index];
                profileImageName.push(element.filename)
            }

        }
        // else {
        //     return res.status(statusCode.BadRequest).send({
        //         message: "image Not Provided"
        //     })
        // }

        const userExist = await userModel.findOne({ email: user.email });
        if (userExist) {

            if (user.roleId < 3) {
                const update = await ApplicantInfo.updateOne({ loanFormId: loanFormId }, {
                    photo: profileImageName[0],
                    signature: profileImageName[1]
                });

                if (update.acknowledged) {

                    const trackingDetails = {
                        stepAt: "5",
                        applicantPhotoAndSignatureUploadCompleted: true
                    }

                    const update = await LoanFormTracking.updateOne({ loanFormId: loanFormId }, trackingDetails);
                    const fromTrack = await LoanFormTracking.findOne({ loanFormId: loanFormId });
                    const appliacntInfoSubmit = await ApplicantInfo.findOne({ loanFormId: loanFormId })

                    return res.status(statusCode.OK).send({
                        message: "Photo and Signature uploaded successfully...",
                        applicantData: appliacntInfoSubmit,
                        trackingdata: fromTrack,
                    })

                } else {
                    return res.status(statusCode.ExpectationFailed).send({
                        message: "Error Occured while uploading photo and signature"
                    })
                }
            } else {
                return res.status(statusCode.OK).send({
                    message: "Not Authorized to upload Applicat photo and signature.",
                })
            }



        } else {
            return res.status(statusCode.NotFound).send({
                message: "Admin Not Found"
            })
        }
    } catch (error) {
        console.log("error", error);
        return res.status(statusCode.InternalServerError).send({
            message: errorMessage.lblInternalServerError
        })
    }
}


// #----Applicant identity uploads by admin ends here




// #----preview all details
exports.adminGetAllDetails = async (req, res) => {

    try {

        const { loanFormId } = req.params;

        const user = req.user;
        const userExist = await userModel.findOne({ email: user.email });

        if (userExist) {

            if (user.roleId < 3) {

                const [formDetails, applicantDetails, guarantorDetails, bankDetails] = await Promise.all([
                    ApplicantForm.findById(loanFormId),
                    ApplicantInfo.findOne({ loanFormId: loanFormId }),
                    GuarantorInfo.findOne({ loanFormId: loanFormId }),
                    BankInfo.findOne({ loanFormId: loanFormId })
                ]);

                if (formDetails && applicantDetails && guarantorDetails && bankDetails) {
                    return res.status(statusCode.OK).send({
                        message: "All Details Found Successfully ...",
                        data: { formDetails, applicantDetails, guarantorDetails, bankDetails }
                    });
                } else {
                    return res.status(statusCode.NotFound).send({ message: "Details Not Found..." });
                }

            } else {
                return res.status(statusCode.OK).send({
                    message: "Not Authorized to get Details...",
                })
            }

        } else {
            return res.status(statusCode.NotFound).send({
                message: "Admin Not Found"
            })
        }

    } catch (error) {

        console.log("error", error);
        return res.status(statusCode.InternalServerError).send({
            message: errorMessage.lblInternalServerError
        })

    }

}


// #----final submit 
exports.adminfinalSubmitOfLoanForm = async (req, res) => {

    try {

        const { loanFormId, userId } = req.body
        const user = req.user;
        const userExist = await userModel.findOne({ email: user.email });
        if (userExist) {

            const fromExist = await ApplicantForm.findById(loanFormId);

            if (fromExist) {

                const trackingDetails = {
                    stepAt: "6",
                    isStepsCompleted: true,
                    fromSubmittedOn: new Date(),
                    submittedByOwn: false,
                    fromSubmittedBy: user._id
                }

                const update = await LoanFormTracking.updateOne({ loanFormId: loanFormId }, trackingDetails);


                const applicant = await userModel.findById(fromExist?.userId)


                const mailOptions = {
                    from: "aatif13698@gmail.com",
                    to: applicant.email,
                    subject: "Loan Applicantion Submitted Successfully...",
                    template: "loanFormSubmit",
                    context: {
                        email: applicant.email,
                        name: applicant.firstName + " " + applicant.lastName,
                        loanName: fromExist?.loanName.toUpperCase(),
                        applyingDate: formatCustomDate(new Date()),
                        loanId: fromExist?.loanId
                    },
                };
                console.log("mailOptions", mailOptions);


                await mailSender(mailOptions);


                // notification section

                const applicant2 = await ApplicantInfo.findOne({ loanFormId: loanFormId })

                const firstName = applicant2.firstName ? applicant2.firstName : "";
                const lastName = applicant2.lastName ? applicant2.lastName : "";
                const fullName = firstName + " " + lastName;

                const idObject = {
                    userId: fromExist.userId,
                    loanFormId: loanFormId
                };


                function formatCustomDate(date) {
                    const options = {
                        weekday: 'long', // Full weekday name (e.g., "Monday")
                        day: 'numeric',  // Numeric day of the month (e.g., 03)
                        month: 'short',  // Short month name (e.g., "Feb")
                        year: 'numeric', // Full year (e.g., 2024)
                        hour: 'numeric', // Hour in 12-hour clock format (e.g., 11)
                        minute: 'numeric', // Minute (e.g., 13)
                        hour12: true,    // Use 12-hour clock format (e.g., "am" or "pm")
                    };
                    return date.toLocaleString('en-US', options);
                }

                const bodyString = `An application for ${fromExist.loanName} has been registered by ${fullName !== "" ? fullName.toUpperCase() : ""} on ${formatCustomDate(new Date())} from ${applicant2.city ? applicant2?.city : ""} `;

                const dataObject = {
                    header: "New Loan Application Registered.",
                    subHeader: `Application Submitted by ${fullName !== "" ? fullName.toUpperCase() : ""}`,
                    body: bodyString,
                    importantId: JSON.stringify(idObject),
                }


                const admins = await userModel.find({ roleId: 1 }, '_id');

                for (let index = 0; index < admins.length; index++) {
                    const id = admins[index]._id;
                    const createNotification = await SuperAdminNotification.create({
                        ...dataObject,
                        userId: id,
                        notificationType: 1
                    });
                }


                if (update.acknowledged) {

                    return res.status(statusCode.OK).send({
                        message: "Loan Application Has Been Successfully Submitted...."
                    })

                } else {
                    return res.status(statusCode.ExpectationFailed).send({
                        message: "Error occured while submitting the form."
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

//###--------- Apply loan for user controller starts here---------



// #------- Get All Notification list with data and count controller starts here

exports.getAllNotificationList = async (req, res, next, listAll = "false") => {

    try {
        const user = req.user;

        const searchText = req.query.keyword ? req.query.keyword.trim() : '';
        const notificationType = req.query.notificationType || 1
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.perPage) || 10;
        const skip = (page - 1) * limit;

        const whereCondition = {
            deletedAt: null,
            notificationType: notificationType,
            userId: user._id
        };

        if (searchText) {
            whereCondition.$or = [
                { header: { $regex: searchText, $options: 'i' } },
                { subHeader: { $regex: searchText, $options: 'i' } },
            ];
        }

        const [notification, count] = await Promise.all([
            SuperAdminNotification.find(whereCondition).skip(skip).limit(limit).sort({ _id: 'desc' }),
            SuperAdminNotification.countDocuments(whereCondition),
        ]);

        return res.json({
            message: 'List Notifications!',
            count: count,
            listNotifications: notification,
        });
    } catch (error) {
        res.status(statusCode.InternalServerError).send({
            message: error.message || errorMessage.lblInternalServerError,
        });
    }
};

// #------- Get All Notification list with data and count controller ends here



// ### ------- Get All loan application -------

exports.getAllLoanApplication = async (req, res, next, listAll = "false") => {

    try {
        const user = req.user;
        // const searchText = req.query.keyword ? req.query.keyword.trim() : '';
        const fromSubmittedBy = req.query.fromSubmittedBy || null;

        const branchId = req.query.branchId || null;
        const productId = req.query.productId || null;
        const approval = req.query.approval || true;
        const isAgentAssigned = req.query.isAgentAssigned || true;
        const isBranchAssigned = req.query.isBranchAssigned || true;
        const isStepsCompleted = req.query.isStepsCompleted || true;

        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.perPage) || 10;
        const skip = (page - 1) * limit;

        const whereCondition = {

            deletedAt: null,
            branchId: branchId,
            productId: productId,
            approval: approval,
            isAgentAssigned: isAgentAssigned,
            isBranchAssigned: isBranchAssigned,
            isStepsCompleted: isStepsCompleted,
            fromSubmittedBy: fromSubmittedBy,

        };

        const [applications, count] = await Promise.all([
            LoanFormTracking.find(whereCondition).skip(skip).limit(limit).sort({ _id: 'desc' }),
            LoanFormTracking.countDocuments(whereCondition),
        ]);

        return res.json({
            message: 'List of all applications!',
            count: count,
            listOfApplications: applications,
        });

    } catch (error) {
        res.status(statusCode.InternalServerError).send({
            message: error.message || errorMessage.lblInternalServerError,
        });
    }
};


// ###----- Admin Assign Applicant Loan Application to Agent Controller Starts here----
exports.adminAssignApplicantLoanToAgent = async (req, res) => {

    try {

        const { loanFormId } = req.params;

        const { branchId, agentId } = req.body;

        const user = req.user;
        const userExist = await userModel.findOne({ email: user.email });
        if (userExist) {

            const fromExist = await ApplicantForm.findById(loanFormId);

            if (fromExist) {

                if (user.roleId < 3) {

                    const isAgentExists = await userModel.findById(agentId);

                    const isBranchExists = await branchModel.findById(branchId);

                    if (!isBranchExists) {
                        return res.status(statusCode.NotFound).send({
                            message: "Branch Not Found",
                        })
                    }

                    if (!isAgentExists) {
                        return res.status(statusCode.NotFound).send({
                            message: "Agent Not Found",
                        })
                    }


                    const loanForTracking = await LoanFormTracking.findOneAndUpdate({ loanFormId: loanFormId },
                        {
                            agentId: agentId,
                            branchId: branchId,
                            isAgentAssigned: true,
                            isBranchAssigned: true,
                            assignedBranchId: branchId,
                            agentAndBranchAssignedBy: user._id
                        }
                    );

                    const isClinetsUnderAgentExist = await ClinetsUnderAgent.findOne({ userId: agentId });

                    const clinetsIdList = isClinetsUnderAgentExist?.clinetsIdList;

                    let pareseList = [];


                    if (clinetsIdList == null || clinetsIdList == undefined) {
                        pareseList.push({ clientId: fromExist?.userId, loanFormId: loanFormId })
                    } else {
                        pareseList = JSON.parse(clinetsIdList);
                        pareseList.push({ clientId: fromExist?.userId, loanFormId: loanFormId })
                    }

                    const stringClientsList = JSON.stringify(pareseList);


                    const updateClientSUnderAgent = await ClinetsUnderAgent.findOneAndUpdate({ userId: agentId }, {
                        clinetsIdList: stringClientsList
                    })


                    if (loanForTracking) {

                        const applicant = await ApplicantInfo.findOne({ loanFormId: loanFormId })

                        const firstName = applicant.firstName ? applicant.firstName : "";
                        const lastName = applicant.lastName ? applicant.lastName : "";
                        const fullName = firstName + " " + lastName;

                        const idObject = {
                            userId: fromExist.userId,
                            loanFormId: loanFormId
                        };



                        function formatCustomDate(date) {
                            const options = {
                                weekday: 'long', // Full weekday name (e.g., "Monday")
                                day: 'numeric',  // Numeric day of the month (e.g., 03)
                                month: 'short',  // Short month name (e.g., "Feb")
                                year: 'numeric', // Full year (e.g., 2024)
                                hour: 'numeric', // Hour in 12-hour clock format (e.g., 11)
                                minute: 'numeric', // Minute (e.g., 13)
                                hour12: true,    // Use 12-hour clock format (e.g., "am" or "pm")
                            };
                            return date.toLocaleString('en-US', options);
                        }

                        const bodyString = `An application for ${fromExist.loanName} has been assigned to you on ${formatCustomDate(new Date())}. The Applicant is from ${applicant.city ? applicant?.city : ""} `;

                        const dataObject = {
                            header: "New Loan Application Assigned.",
                            subHeader: `Applicat Name : ${fullName !== "" ? fullName.toUpperCase() : ""}`,
                            body: bodyString,
                            importantId: JSON.stringify(idObject),
                            notificationType: 1,
                        }

                        const createNotification = await AgentNotification.create({
                            ...dataObject,
                            userId: agentId,
                        });


                        // const mailOptions = {
                        //     from: "aatif13698@gmail.com",
                        //     to: email,
                        //     subject: "Email Verification for DYNO",
                        //     template: "email",
                        //     context: {
                        //         otp: otp,
                        //         name: firstName,
                        //     },
                        // };

                        // // await mailSender(req, res, otp, firstName, email)
                        // await mailSender(mailOptions);


                        return res.status(statusCode.OK).send({
                            message: "Agent and Branch Assigned Successfully...",
                        })

                    }

                } else {
                    return res.status(statusCode.OK).send({
                        message: "Not Authorized To Assign...",
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



// ###----- Admin discard Applicant Loan Application Starts here----
exports.adminDiscardApplicantLoan = async (req, res) => {

    try {

        const { loanFormId } = req.params;

        const user = req.user;
        const userExist = await userModel.findOne({ email: user.email });
        if (userExist) {

            const fromExist = await ApplicantForm.findById(loanFormId);

            if (fromExist) {

                if (user.roleId < 3) {

                    const loanForTracking = await LoanFormTracking.findOneAndUpdate({ loanFormId: loanFormId },
                        {
                            applicationDiscard: true,
                            applicationDiscardBy: user._id
                        }
                    );


                    if (loanForTracking) {

                        const applicant = await ApplicantInfo.findOne({ loanFormId: loanFormId });
                        const tracking = await LoanFormTracking.findOne({ loanFormId: loanFormId })

                        const mailOptions = {
                            from: "aatif13698@gmail.com",
                            to: applicant.email,
                            subject: "Loan Applicantion Rejected On First Phase.",
                            template: "applicationDiscarded",
                            context: {
                                email: applicant.email,
                                name: applicant.firstName + " " + applicant.lastName,
                                loanName: fromExist?.loanName.toUpperCase(),
                                applyingDate: formatCustomDate(tracking?.fromSubmittedOn),
                            },
                        };

                        await mailSender(mailOptions);

                        return res.status(statusCode.OK).send({
                            message: "Application Has Been Discarded Successfully...",
                        })

                    }

                } else {
                    return res.status(statusCode.OK).send({
                        message: "Not Authorized To Discarded...",
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





// ## create Noc pdf controller
exports.createNocPdf = async (req, res) => {
    try {
        const user = req.user;

        if (user.roleId < 3) {


            let wealthData = {

            };


            const wealthBody = await ejs.renderFile(
                path.join(__dirname, '../templates/noc.ejs'),
                wealthData
            );


            if (!fs.existsSync('./public/nocPdf')) {
                fs.mkdirSync('./public/nocPdf');
            }

            const pdfFolderPath = './public/nocPdf';

            const pdfFileName = `${1}_Noc.pdf`;

            const pdfFilePath = path.join(pdfFolderPath, pdfFileName);

            if (fs.existsSync(pdfFilePath)) {
                fs.unlinkSync(pdfFilePath);
            }


            const browser = await puppeteer.launch();
            const page = await browser.newPage();

            await page.setContent(wealthBody);
            await page.pdf({
                path: pdfFilePath,
                format: 'A4',
                printBackground: true
            });

            await browser.close();

            const pdfStream = fs.createReadStream(pdfFilePath);
            pdfStream.pipe(res);

            // res.send({
            //     message : "pdf created successfully...."
            // })

        } else {
            return res.status(statusCode.OK).send({
                message: "Not Authorized To Create NOC...",
            })
        }





    } catch (error) {
        res.status(statusCode.InternalServerError).send({
            message: error.message || errorMessage.lblInternalServerError,
        });
    }
};


// ### ------ Agent Verify the Applicant Loan Application
exports.agentVerifyApplicantLonApplication = async (req, res) => {

    try {

        const { loanFormId } = req.params;

        const user = req.user;
        const userExist = await userModel.findOne({ email: user.email });

        if (userExist) {

            const fromExist = await ApplicantForm.findById(loanFormId);

            if (fromExist) {

                if (user.roleId < 3) {


                    const loanForTracking = await LoanFormTracking.findOneAndUpdate({ loanFormId: loanFormId },
                        {
                            applicationVerified: true,
                            applicationVerifiedBy: user._id,

                            applicationRjected: false,
                            applicationRejectedBy: null

                        }
                    );


                    if (loanForTracking) {

                        const applicant = await ApplicantInfo.findOne({ loanFormId: loanFormId })

                        const firstName = applicant.firstName ? applicant.firstName : "";
                        const lastName = applicant.lastName ? applicant.lastName : "";
                        const fullName = firstName + " " + lastName;

                        const idObject = {
                            userId: fromExist.userId,
                            loanFormId: loanFormId
                        };



                        function formatCustomDate(date) {
                            const options = {
                                weekday: 'long', // Full weekday name (e.g., "Monday")
                                day: 'numeric',  // Numeric day of the month (e.g., 03)
                                month: 'short',  // Short month name (e.g., "Feb")
                                year: 'numeric', // Full year (e.g., 2024)
                                hour: 'numeric', // Hour in 12-hour clock format (e.g., 11)
                                minute: 'numeric', // Minute (e.g., 13)
                                hour12: true,    // Use 12-hour clock format (e.g., "am" or "pm")
                            };
                            return date.toLocaleString('en-US', options);
                        }

                        const bodyString = `Loan Application of ${fullName} has been verified by ${user?.firstName} on ${formatCustomDate(new Date())}.`;

                        const dataObject = {
                            header: "Loan Application Verified.",
                            subHeader: `Applicat Name : ${fullName !== "" ? fullName.toUpperCase() : ""}`,
                            body: bodyString,
                            importantId: JSON.stringify(idObject),
                            notificationType: 2,
                        }



                        const admins = await userModel.find({ roleId: 1 }, '_id');

                        for (let index = 0; index < admins.length; index++) {
                            const id = admins[index]._id;
                            const createNotification = await SuperAdminNotification.create({
                                ...dataObject,
                                userId: id,
                                notificationType: 2
                            });
                        }


                        const tracking = await LoanFormTracking.findOne({ loanFormId: loanFormId })

                        const mailOptions = {
                            from: "aatif13698@gmail.com",
                            to: applicant.email,
                            subject: "Loan Applicantion Verified Successfully...",
                            template: "applicationVerified",
                            context: {
                                email: applicant.email,
                                name: applicant.firstName + " " + applicant.lastName,
                                loanName: fromExist?.loanName.toUpperCase(),
                                applyingDate: formatCustomDate(tracking?.fromSubmittedOn),
                            },
                        };

                        await mailSender(mailOptions);

                        return res.status(statusCode.OK).send({
                            message: "Loan Application Verified Successfully...",
                        })

                    }

                } else {
                    return res.status(statusCode.OK).send({
                        message: "Not Authorized To Assign...",
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


// ### ------ Agent Reject the Applicant Loan Application
exports.agentRejectApplicantLonApplication = async (req, res) => {

    try {

        const { loanFormId } = req.params;

        const user = req.user;
        const userExist = await userModel.findOne({ email: user.email });

        if (userExist) {

            const fromExist = await ApplicantForm.findById(loanFormId);

            if (fromExist) {

                if (user.roleId < 3) {


                    const loanForTracking = await LoanFormTracking.findOneAndUpdate({ loanFormId: loanFormId },
                        {
                            applicationVerified: false,
                            applicationVerifiedBy: null,
                            applicationRjected: true,
                            applicationRejectedBy: user?._id

                        }
                    );


                    if (loanForTracking) {

                        const applicant = await ApplicantInfo.findOne({ loanFormId: loanFormId })

                        const firstName = applicant.firstName ? applicant.firstName : "";
                        const lastName = applicant.lastName ? applicant.lastName : "";
                        const fullName = firstName + " " + lastName;

                        const idObject = {
                            userId: fromExist.userId,
                            loanFormId: loanFormId
                        };



                        function formatCustomDate(date) {
                            const options = {
                                weekday: 'long', // Full weekday name (e.g., "Monday")
                                day: 'numeric',  // Numeric day of the month (e.g., 03)
                                month: 'short',  // Short month name (e.g., "Feb")
                                year: 'numeric', // Full year (e.g., 2024)
                                hour: 'numeric', // Hour in 12-hour clock format (e.g., 11)
                                minute: 'numeric', // Minute (e.g., 13)
                                hour12: true,    // Use 12-hour clock format (e.g., "am" or "pm")
                            };
                            return date.toLocaleString('en-US', options);
                        }

                        const bodyString = `Loan Application of ${fullName} has been rejected by ${user?.firstName} on ${formatCustomDate(new Date())}.`;

                        const dataObject = {
                            header: "Loan Application Rejected.",
                            subHeader: `Applicat Name : ${fullName !== "" ? fullName.toUpperCase() : ""}`,
                            body: bodyString,
                            importantId: JSON.stringify(idObject),
                            notificationType: 3,
                        }

                        const admins = await userModel.find({ roleId: 1 }, '_id');

                        for (let index = 0; index < admins.length; index++) {
                            const id = admins[index]._id;
                            const createNotification = await SuperAdminNotification.create({
                                ...dataObject,
                                userId: id,
                                notificationType: 3
                            });
                        }


                        const tracking = await LoanFormTracking.findOne({ loanFormId: loanFormId })

                        const mailOptions = {
                            from: "aatif13698@gmail.com",
                            to: applicant.email,
                            subject: "Loan Applicantion Verified Successfully...",
                            template: "applicationRejected",
                            context: {
                                email: applicant.email,
                                name: applicant.firstName + " " + applicant.lastName,
                                loanName: fromExist?.loanName.toUpperCase(),
                                applyingDate: formatCustomDate(tracking?.fromSubmittedOn),
                            },
                        };

                        await mailSender(mailOptions);

                        return res.status(statusCode.OK).send({
                            message: "Loan Application Verified Successfully...",
                        })

                    }

                } else {
                    return res.status(statusCode.OK).send({
                        message: "Not Authorized To Assign...",
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



// ### ------ Loan application approved by super admin
exports.loanApplicantLoanApprovedBySuperAdmin = async (req, res) => {

    try {

        const { loanFormId } = req.params;

        const user = req.user;
        const userExist = await userModel.findOne({ email: user.email });
        if (userExist) {

            const fromExist = await ApplicantForm.findById(loanFormId);

            if (fromExist) {

                if (user.roleId == 1) {

                    const loanForTrackingExists = await LoanFormTracking.findOne({ loanFormId: loanFormId });

                    // ** return when application has not been fully completed yet.
                    if (!loanForTrackingExists?.isStepsCompleted) {

                        return res.status(statusCode.Conflict).send({
                            message: "Loan Applicantion has not been completed yet.."
                        })

                    }

                    // ** return when not assigned any agent
                    if (!loanForTrackingExists?.isAgentAssigned) {

                        return res.status(statusCode.Conflict).send({
                            message: "Loan Applicantion has not been assigned to any agent yet.."
                        })

                    }

                    // ** return when application has been rejected by agent
                    if (loanForTrackingExists?.applicationRjected) {

                        return res.status(statusCode.Conflict).send({
                            message: "Loan Applicantion has been rejected by agent.."
                        })

                    }

                    // ** return when application has not been verified by agent yet
                    if (loanForTrackingExists?.isAgentAssigned && !loanForTrackingExists?.applicationVerified) {

                        return res.status(statusCode.Conflict).send({
                            message: "Loan Applicantion has not been verified by any agent yet.."
                        })

                    }

                    // create PDF of Loan Approval

                    let wealthData = {

                    };

                    const wealthBody = await ejs.renderFile(
                        path.join(__dirname, '../templates/loanFinalApproval.ejs'),
                        wealthData
                    );


                    if (!fs.existsSync('./public/LoanApprovalPdf')) {
                        fs.mkdirSync('./public/LoanApprovalPdf');
                    }

                    const pdfFolderPath = './public/LoanApprovalPdf';

                    const pdfFileName = `${1}_loanApproval.pdf`;

                    const pdfFilePath = path.join(pdfFolderPath, pdfFileName);

                    if (fs.existsSync(pdfFilePath)) {
                        fs.unlinkSync(pdfFilePath);
                    }


                    const browser = await puppeteer.launch();
                    const page = await browser.newPage();

                    await page.setContent(wealthBody);
                    await page.pdf({
                        path: pdfFilePath,
                        format: 'A4',
                        printBackground: true
                    });

                    await browser.close();

                    const loanForTracking = await LoanFormTracking.findOneAndUpdate({ loanFormId: loanFormId },
                        {
                            approval: true,
                            approvedBy: user._id,
                            approvedOn: new Date(),
                            loanApprovalPdf: pdfFileName,
                        }
                    );


                    if (loanForTracking) {

                        // *** We need to add the code to cerate the EMI Sheet for that application

                        console.log("EmiSheet",fromExist);
                        // {
                        //     _id: new ObjectId('65d74860e51d439c3061c360'),
                        //     userId: new ObjectId('65ca16f365ead02e157d765e'),
                        //     loanName: 'Personal Loan',
                        //     loanId: 'SMS/542/14-2024/245',
                        //     rateOfInterest: 0.5,
                        //     rateTyep: 'week',
                        //     recoveryType: 'week',
                        //     processingFeePercent: 20,
                        //     processingFeeAmount: 44.2,
                        //     amountDisburse: 221,
                        //     amountSanctioned: 176.8,
                        //     emiAmount: 23.205,
                        //     NoOfEmi: 21,
                        //     createdAt: 2024-02-22T12:50:46.487Z,
                        //     deletedAt: null,
                        //     __v: 0
                        //   }

                        const createSheet = await EmiSheet.create({

                            userId : fromExist?.userId,
                            loanFormId : fromExist?._id,
                            loanId : fromExist?.loanId,
                            rateOfInterest : fromExist?.rateOfInterest,
                            recoveryType : fromExist?.recoveryType,
                            processingFeePercent : fromExist?.processingFeePercent,
                            processingFeeAmount : fromExist?.processingFeeAmount,
                            disbursedAmount : fromExist?.amountDisburse,
                            repaymentAmpount : fromExist?.processingFeePercent,
                            processingFeePercent : fromExist?.processingFeePercent,

                        })


                        //  send the user congratulation mail

                        const applicant = await ApplicantInfo.findOne({ loanFormId: loanFormId });
                        const tracking = await LoanFormTracking.findOne({ loanFormId: loanFormId });


                        const mailOptions = {
                            from: "aatif13698@gmail.com",
                            to: applicant.email,
                            subject: "Loan Applicantion Rejected On First Phase.",
                            template: "applicationApproved",
                            context: {
                                email: applicant.email,
                                name: applicant.firstName + " " + applicant.lastName,
                                loanName: fromExist?.loanName.toUpperCase(),
                                applyingDate: formatCustomDate(tracking?.fromSubmittedOn),
                                link : `${process.env.API_BASE_URL}/LoanApprovalPdf/${pdfFileName}` 
                            },
                        };

                        await mailSender(mailOptions);

                        return res.status(statusCode.OK).send({
                            message: "Application Has Been Approved Successfully...",
                            link :`${process.env.API_BASE_URL}/LoanApprovalPdf/${pdfFileName}` 
                        })

                    }

                } else {
                    return res.status(statusCode.OK).send({
                        message: "Not Authorized To Give Approval...",
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





// checkout payment

exports.checkout = async (req, res) => {
    const options = {
      amount: Number(1000)*100,
      currency: "INR",
    };

    console.log("process.env.RZORPAY_KEY_ID",process.env.RZORPAY_KEY_ID);
    console.log(" process.env.RAZORPAY_SECRECT", process.env.RAZORPAY_SECRECT);

    const instance = new Razorpay({
        key_id: process.env.RZORPAY_KEY_ID,
        key_secret: process.env.RAZORPAY_SECRECT,
      });
    // console.log("instance", instance);
    const order = await instance.orders.create(options);
    console.log("order",order);
  
    return  res.status(200).json({
      success: true,
      order,
    });
};



exports. paymentVerification = async (req, res) => {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } =
      req.body;
  
    const body = razorpay_order_id + "|" + razorpay_payment_id;
  
    const expectedSignature = crypto
      .createHmac("sha256", process.env.RAZORPAY_SECRECT)
      .update(body.toString())
      .digest("hex");
  
    const isAuthentic = expectedSignature === razorpay_signature;
  
    if (isAuthentic) {
      // Database comes here
  
     //   await Payment.create({
     //     razorpay_order_id,
     //     razorpay_payment_id,
     //     razorpay_signature,
     //   });
  
    return  res.send({
        success: true,
    });

    } else {
        return  res.status(400).json({
        success: false,
      });
    }
  };

   // `http://localhost:3000/paymentsuccess?reference=${razorpay_payment_id}`



