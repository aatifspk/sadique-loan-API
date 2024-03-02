const jwt = require("jsonwebtoken");
const dotnev = require("dotenv");
const userModel = require("../../models/user");
dotnev.config();
const PRIVATEKEY = process.env.PRIVATEKEY;
const statusCode = require('../../utils/http-status-code');


exports.checkUserAuth = async (req, res, next) => {
    let token;
    const { authorization } = req.headers;
    if (authorization && authorization.startsWith("Bearer")) {
        try {
            token = authorization.split(" ")[1];
            // console.log(token);
            const { email } = jwt.verify(token, PRIVATEKEY);
            // console.log(email);
            if (email) {
                req.user = await userModel.findOne({ email: email });
                next();
            } else {
                return res.status(statusCode.Unauthorized).send({
                    message: "unauthorized user"
                })
            }
        } catch (error) {
            console.log(error);
            return res.send({ errorCode: 404, message: "unauthorized user" });
        }
    } else {
        res.send({ status: "Token not provided" });
    }
};

// check Admin
exports.checkAdminAuth = async (req, res, next) => {
    let token;
    const { authorization } = req.headers;

    console.log("authorization",authorization);

    if (authorization && authorization.startsWith("Bearer")) {
        try {
            token = authorization.split(" ")[1];
            const { email } = jwt.verify(token, PRIVATEKEY);
            if (email) {
                const User = await userModel.findOne({ email: email });
                if (User) {
                    if (User.roleId > 2) {
                        return res.send({
                            message: "UnAutherize user...",
                        });
                    } else {
                        req.user = User;
                        next();
                    }
                } else {
                    return res.send({
                        message: "user not found...",
                    });
                }
            } else {
                return res.status(statusCode.Unauthorized).send({
                    message: "unauthorized user"
                })
            }
        } catch (error) {
            console.log(error);
           return   res.status(statusCode.Unauthorized).send({ message: error.message });
        }
    } else {
        res.send({ status: "no token" });
    }
};
