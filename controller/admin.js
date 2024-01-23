

const { mailSender } = require("../common/emailSend");
const jwt = require("jsonwebtoken");
const dotnev = require("dotenv");
dotnev.config();
const PRIVATEKEY = process.env.PRIVATEKEY;

const userModel = require("../models/user");
const Roles = require("../models/roles/roles");
const Branch = require("../models/branch");
const Product = require("../models/Product/product")

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
            message: errorMessage.lblInternalServerError
        })

    }

}

// sign in by Otp
exports.signInByOtp = async (req, res) => {

    try {

        const { email, otp } = req.body;
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
                    const token = jwt.sign({ email: req.body.email }, PRIVATEKEY);
                    return res.status(statusCode.OK).send({
                        token: token,
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

        const { branchId, email, phone, firstName, lastName, city, state, password, ownerId, roleId, create } = req.body;

        const clientExist = await userModel.findOne({ email: email});


        if (clientExist && create) {
            return res.status(statusCode.NotAcceptable).send({
                message: "Clinet already exists with this email."
            })

        }

        if (clientExist) {
            const updateClient = await userModel.updateOne({ email: email }, {
                firstName: firstName,
                lastName: lastName,
                city: city,
                state: state,
                phone: phone,
                branchId: branchId,
            });

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
                city: city,
                state: state,
                phone: phone,
                branchId: branchId,
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
exports.listClients = async (req, res, next, listAll = "false", isActive = "true") => {
    try {
        // const { roleId } = req.user;
        const searchText = req.query.keyword ? req.query.keyword.trim() : '';
        const branchId  = req.query.branchId ? req.query.branchId : null;
        const all = req.query.all ? req.query.all : listAll;
        const active = req.query.active ? req.query.active : isActive;
        const page = req.query.page ? req.query.page : 1;
        const limit = req.query.perPage ? req.query.perPage : 10;
        const skip = (page - 1) * limit;
        const roleId = req.query.roleId ? req.query.roleId : 4
         

        let whereCondition = {
            isActive: active === "true",
            deletedAt: null,
            roleId : roleId
        };

        if(branchId){

            whereCondition = {
                ...whereCondition,
                branchId : branchId
            }

        }

        if (searchText) {
            whereCondition.$or = [
                { firstName: { $regex: searchText, $options: 'i' } },
                { lastName: { $regex: searchText, $options: 'i' } },
                { email: { $regex: searchText, $options: 'i' } },
                { phone: { $regex: searchText, $options: 'i' } },
                { locality: { $regex: searchText, $options: 'i' } },
                // { openingDate: new Date(searchText) },
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

        const clients = await userModel.find(whereCondition)
            .skip(parseInt(skip))
            .limit(parseInt(limit))
            .sort({ _id: 'desc' });

        return res.json({
            message: 'List Clients!',
            count: clients.length,
            listClients: clients,
        });
    } catch (error) {
        res.status(statusCode.InternalServerError).send({
            message: error.message || errorMessage.lblInternalServerError,
        });
    }
};

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

        console.log("clinet",clinet);

        if (clinet) {

            if (status) {
                const update = await userModel.updateOne({ _id: id }, { isActive: status });
                console.log("update",update);

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
                console.log("update",update);

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

// get soft deleted clinet with filter
exports.listSoftDeletedClients = async (req, res, next, listAll = "false", isActive = "true") => {
    try {
        // const { roleId } = req.user;
        const searchText = req.query.keyword ? req.query.keyword.trim() : '';
        const branchId  = req.query.branchId ? req.query.branchId : null;
        const all = req.query.all ? req.query.all : listAll;
        const active = req.query.active ? req.query.active : isActive;
        const page = req.query.page ? req.query.page : 1;
        const limit = req.query.perPage ? req.query.perPage : 10;
        const skip = (page - 1) * limit;
        const roleId = req.query.roleId ? req.query.roleId : 4


        let whereCondition = {
            isActive: active === "true",
            deletedAt: { $ne: null },
            roleId : roleId
        };

        if(branchId){

            whereCondition = {
                ...whereCondition,
                branchId : branchId
            }

        }

        if (searchText) {
            whereCondition.$or = [
                { firstName: { $regex: searchText, $options: 'i' } },
                { lastName: { $regex: searchText, $options: 'i' } },
                { email: { $regex: searchText, $options: 'i' } },
                { phone: { $regex: searchText, $options: 'i' } },
                { locality: { $regex: searchText, $options: 'i' } },
                // { openingDate: new Date(searchText) },
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

        const clients = await userModel.find(whereCondition)
            .skip(parseInt(skip))
            .limit(parseInt(limit))
            .sort({ _id: 'desc' });

        return res.json({
            message: 'List Clients!',
            count: clients.length,
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
                data: clientExist,
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
exports.listEmployees = async (req, res, next, listAll = "false", isActive = "true") => {
    try {
        // const { roleId } = req.user;
        const searchText = req.query.keyword ? req.query.keyword.trim() : '';
        const branchId  = req.query.branchId ? req.query.branchId : null;
        const all = req.query.all ? req.query.all : listAll;
        const active = req.query.active ? req.query.active : isActive;
        const page = req.query.page ? req.query.page : 1;
        const limit = req.query.perPage ? req.query.perPage : 10;
        const skip = (page - 1) * limit;
        const roleId = req.query.roleId ? req.query.roleId : 3

        let whereCondition = {
            isActive: active === "true",
            deletedAt: null,
            roleId : roleId
        };

        if(branchId){

            whereCondition = {
                ...whereCondition,
                branchId : branchId
            }

        }

        if (searchText) {
            whereCondition.$or = [
                { firstName: { $regex: searchText, $options: 'i' } },
                { lastName: { $regex: searchText, $options: 'i' } },
                { email: { $regex: searchText, $options: 'i' } },
                { phone: { $regex: searchText, $options: 'i' } },
                { locality: { $regex: searchText, $options: 'i' } },
                // { openingDate: new Date(searchText) },
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

        const employees = await userModel.find(whereCondition)
            .skip(parseInt(skip))
            .limit(parseInt(limit))
            .sort({ _id: 'desc' });

        return res.json({
            message: 'List Clients!',
            count: employees.length,
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

        console.log("employee",employee);

        if (employee) {

            if (status) {
                const update = await userModel.updateOne({ _id: id }, { isActive: status });
                console.log("update",update);

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
                console.log("update",update);

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
exports.listSoftDeletedEmployee = async (req, res, next, listAll = "false", isActive = "true") => {
    try {
        // const { roleId } = req.user;
        const searchText = req.query.keyword ? req.query.keyword.trim() : '';
        const branchId  = req.query.branchId ? req.query.branchId : null;
        const all = req.query.all ? req.query.all : listAll;
        const active = req.query.active ? req.query.active : isActive;
        const page = req.query.page ? req.query.page : 1;
        const limit = req.query.perPage ? req.query.perPage : 10;
        const skip = (page - 1) * limit;
        const roleId = req.query.roleId ? req.query.roleId : 3


        let whereCondition = {
            isActive: active === "true",
            deletedAt: { $ne: null },
            roleId : roleId
        };

        if(branchId){

            whereCondition = {
                ...whereCondition,
                branchId : branchId
            }

        }

        if (searchText) {
            whereCondition.$or = [
                { firstName: { $regex: searchText, $options: 'i' } },
                { lastName: { $regex: searchText, $options: 'i' } },
                { email: { $regex: searchText, $options: 'i' } },
                { phone: { $regex: searchText, $options: 'i' } },
                { locality: { $regex: searchText, $options: 'i' } },
                // { openingDate: new Date(searchText) },
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

        const employees = await userModel.find(whereCondition)
            .skip(parseInt(skip))
            .limit(parseInt(limit))
            .sort({ _id: 'desc' });

        return res.json({
            message: 'List Clients!',
            count: employees.length,
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

        const {id} = req.body

        if (id) {

            const productExists = await Product.findById(id);

            if (productExists) {

                const object = req.body;

                const { id, intoducedDate, ...rest } = object

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

        const product = await Product.find();
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
exports.listProducts = async (req, res, next, listAll = "false", isActive = "true") => {
    try {
        const { roleId } = req.user;
        const searchText = req.query.keyword ? req.query.keyword.trim() : '';
        const all = req.query.all ? req.query.all : listAll;
        const active = req.query.active ? req.query.active : isActive;
        const page = req.query.page ? req.query.page : 1;
        const limit = req.query.perPage ? req.query.perPage : 10;
        const skip = (page - 1) * limit;

        let whereCondition = {
            productStatus: active === "true",
            deletedAt: null
        };

        
        if (searchText) {
            whereCondition.$or = [
                { productName: { $regex: searchText, $options: 'i' } },
                { rateTyep: { $regex: searchText, $options: 'i' } },
                { recoveryType: { $regex: searchText, $options: 'i' } },
            ];
        }


        const products = await Product.find(whereCondition)
            .skip(parseInt(skip))
            .limit(parseInt(limit))
            .sort({ _id: 'desc' });

        return res.json({
            message: 'List Products!',
            count: products.length,
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
exports.listSoftDeletedProducts = async (req, res, next, listAll = "false", isActive = "true") => {
    try {
        const { roleId } = req.user;
        const searchText = req.query.keyword ? req.query.keyword.trim() : '';
        const all = req.query.all ? req.query.all : listAll;
        const active = req.query.active ? req.query.active : isActive;
        const page = req.query.page ? req.query.page : 1;
        const limit = req.query.perPage ? req.query.perPage : 10;
        const skip = (page - 1) * limit;

        let whereCondition = {
            productStatus: active === "true",
            deletedAt: {$ne:null}
        };

        
        if (searchText) {
            whereCondition.$or = [
                { productName: { $regex: searchText, $options: 'i' } },
                { rateTyep: { $regex: searchText, $options: 'i' } },
                { recoveryType: { $regex: searchText, $options: 'i' } },
            ];
        }


        const products = await Product.find(whereCondition)
            .skip(parseInt(skip))
            .limit(parseInt(limit))
            .sort({ _id: 'desc' });

        return res.json({
            message: 'List Products!',
            count: products.length,
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

        console.log("product",product);

        if (product) {

            if (status) {
                const update = await Product.updateOne({ _id: id }, { productStatus: status });
                console.log("update",update);

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
                console.log("update",update);

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


//###---------- products controller ends here---------------.





// ###---------- agent controller starts here--------------.

// create Agent / Admin
exports.createAgent = async (req, res) => {

    try {

        const { branchId, email, phone, firstName, lastName, city, state, password, roleId, create } = req.body;

        const agentExists = await userModel.findOne({ email: email });

        if (agentExists && create) {

            return res.status(statusCode.NotAcceptable).send({

                message: "User already exists with this email."
            })

        }
        

        if (agentExists) {

            const updateAgent = await userModel.updateOne({ email: email }, {
                firstName: firstName,
                lastName: lastName,
                city: city,
                state: state,
                phone: phone,
                branchId: branchId,
            });

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

            const roleObjId = await Roles.findOne({ id: roleId });
            const hash = bcrypt.hashSync(password, 10);
            const createAgent = await userModel.create({
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

        console.log("agent",agent);

        if (agent) {

            if (status) {
                const update = await userModel.updateOne({ _id: id }, { isActive: status });
                console.log("update",update);

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
                console.log("update",update);

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
exports.listAgents = async (req, res, next, listAll = "false", isActive = "true") => {
    try {
        // const { roleId } = req.user;
        const searchText = req.query.keyword ? req.query.keyword.trim() : '';
        const branchId  = req.query.branchId ? req.query.branchId : null;
        const all = req.query.all ? req.query.all : listAll;
        const active = req.query.active ? req.query.active : isActive;
        const page = req.query.page ? req.query.page : 1;
        const limit = req.query.perPage ? req.query.perPage : 10;
        const skip = (page - 1) * limit;
        const roleId = req.query.roleId ? req.query.roleId : 2;

        let whereCondition = {
            isActive: active === "true",
            deletedAt: null,
            roleId : roleId
        };

        if(branchId){

            whereCondition = {
                ...whereCondition,
                branchId : branchId
            }

        }

        if (searchText) {
            whereCondition.$or = [
                { firstName: { $regex: searchText, $options: 'i' } },
                { lastName: { $regex: searchText, $options: 'i' } },
                { email: { $regex: searchText, $options: 'i' } },
                { phone: { $regex: searchText, $options: 'i' } },
                { locality: { $regex: searchText, $options: 'i' } },
                // { openingDate: new Date(searchText) },
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

        const agents = await userModel.find(whereCondition)
            .skip(parseInt(skip))
            .limit(parseInt(limit))
            .sort({ _id: 'desc' });

        return res.json({
            message: 'List Agents!',
            count: agents.length,
            listAgents: agents,
        });
    } catch (error) {
        res.status(statusCode.InternalServerError).send({
            message: error.message || errorMessage.lblInternalServerError,
        });
    }
};

// get soft deleted agents with filter
exports.listSoftDeletedAgents = async (req, res, next, listAll = "false", isActive = "true") => {
    try {
        // const { roleId } = req.user;
        const searchText = req.query.keyword ? req.query.keyword.trim() : '';
        const branchId  = req.query.branchId ? req.query.branchId : null;
        const all = req.query.all ? req.query.all : listAll;
        const active = req.query.active ? req.query.active : isActive;
        const page = req.query.page ? req.query.page : 1;
        const limit = req.query.perPage ? req.query.perPage : 10;
        const skip = (page - 1) * limit;
        const roleId = req.query.roleId ? req.query.roleId : 2;


        let whereCondition = {
            isActive: active === "true",
            deletedAt: { $ne: null },
            roleId : roleId
        };

        if(branchId){

            whereCondition = {
                ...whereCondition,
                branchId : branchId
            }

        }

        if (searchText) {
            whereCondition.$or = [
                { firstName: { $regex: searchText, $options: 'i' } },
                { lastName: { $regex: searchText, $options: 'i' } },
                { email: { $regex: searchText, $options: 'i' } },
                { phone: { $regex: searchText, $options: 'i' } },
                { locality: { $regex: searchText, $options: 'i' } },
                // { openingDate: new Date(searchText) },
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

        const agents = await userModel.find(whereCondition)
            .skip(parseInt(skip))
            .limit(parseInt(limit))
            .sort({ _id: 'desc' });

        return res.json({
            message: 'List Clients!',
            count: agents.length,
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
exports.listBranches = async (req, res, next, listAll = "false", isActive = "true") => {
    try {
        const { roleId } = req.user;
        // const searchText = req.query.keyword ? req.query.keyword : '';
        const searchText = req.query.keyword ? req.query.keyword.trim() : '';

        const all = req.query.all ? req.query.all : listAll;
        const active = req.query.active ? req.query.active : isActive;
        const page = req.query.page ? req.query.page : 1;
        const limit = req.query.perPage ? req.query.perPage : 10;
        const skip = (page - 1) * limit;

        const whereCondition = {
            status: active === "true",
            deletedAt : null
        };

        if (searchText) {
            whereCondition.$or = [
                { branchName: { $regex: searchText, $options: 'i' } },
                { branchVisibleName: { $regex: searchText, $options: 'i' } },
                { branchCode: { $regex: searchText, $options: 'i' } },
                { locality: { $regex: searchText, $options: 'i' } },
                // { openingDate: new Date(searchText) },
                { city: { $regex: searchText, $options: 'i' } },
                { state: { $regex: searchText, $options: 'i' } },
            ];
        }

        if (all === "false" && roleId === 2) {
            whereCondition.deletedAt = null;
        }

        console.log("whereCondition", whereCondition);

        const branches = await branchModel.find(whereCondition)
            .skip(parseInt(skip))
            .limit(parseInt(limit))
            .sort({ _id: 'desc' });

        return res.json({
            message: 'List branches!',
            count: branches.length,
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
        if (admin.roleId !== 1) {
            return res.status(statusCode.Unauthorized).send({
                message: "Unauthorize to access this."
            })
        }

        const branchsList = await branchModel.find();
        if (branchsList && branchsList.length > 0) {
            return res.status(statusCode.OK).send({
                message: "Branchs list found successfully.",
                branchs: branchsList
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

                console.log("update",update);

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
exports.listSoftDeletedBranches = async (req, res, next, listAll = "false", isActive = "true") => {
    try {
        const { roleId } = req.user;
        // const searchText = req.query.keyword ? req.query.keyword : '';
        const searchText = req.query.keyword ? req.query.keyword.trim() : '';

        const all = req.query.all ? req.query.all : listAll;
        const active = req.query.active ? req.query.active : isActive;
        const page = req.query.page ? req.query.page : 1;
        const limit = req.query.perPage ? req.query.perPage : 10;
        const skip = (page - 1) * limit;

        const whereCondition = {
            status: active === "true",
            deletedAt : { $ne: null }
        };

        if (searchText) {
            whereCondition.$or = [
                { branchName: { $regex: searchText, $options: 'i' } },
                { branchVisibleName: { $regex: searchText, $options: 'i' } },
                { branchCode: { $regex: searchText, $options: 'i' } },
                { locality: { $regex: searchText, $options: 'i' } },
                // { openingDate: new Date(searchText) },
                { city: { $regex: searchText, $options: 'i' } },
                { state: { $regex: searchText, $options: 'i' } },
            ];
        }

        if (all === "false" && roleId === 2) {
            whereCondition.deletedAt = null;
        }

        console.log("whereCondition", whereCondition);

        const branches = await branchModel.find(whereCondition)
            .skip(parseInt(skip))
            .limit(parseInt(limit))
            .sort({ _id: 'desc' });

        return res.json({
            message: 'List branches!',
            count: branches.length,
            listBranches: branches,
        });
    } catch (error) {
        res.status(statusCode.InternalServerError).send({
            message: error.message || errorMessage.lblInternalServerError,
        });
    }
};


//###---------- branch controller ends here-----------












