
const Role = require("../../models/roles/roles");
const statusCode = require('../../utils/http-status-code');
const errorMessage = require('../../languages/message');



// get role and capability by id
exports.getRoleAndCapability = async (req, res) => {
    try {
        const { id } = req.params;
        const rolesExist = await Role.findOne({ id });

        if (rolesExist) {
            const parsedCapability = JSON.parse(rolesExist?.capability);
            return res.status(statusCode.OK).send({
                message: "Roles found successfully...",
                role: { ...rolesExist.toObject(), capability: parsedCapability }
            });
        } else {
            return res.status(statusCode.NotFound).send({
                message: "Roles not found..",
                role: null
            });
        }
    } catch (error) {
        console.error("Error:", error);
        return res.status(statusCode.InternalServerError).send({
            message: "Internal Server Error"
        });
    }
};

// get all roles and capability
exports.getAllRolesAndCapability = async (req, res) => {

    try {

        const rolesExist = await Role.find();

        if(rolesExist.length > 0){

            return  res.status(statusCode.OK).send({
                message : "Roles find successfully...",
                role : rolesExist

            })

        }else{

            return  res.status(statusCode.NotFound).send({
                message : "Roles not found..",
                role : null

            })

        }

       

    } catch (error) {
        console.log("error", error);
        return res.status(statusCode.InternalServerError).send({
            message: errorMessage.lblInternalServerError
        })

    }

}

// assign roles and capability

exports.assignRoleAndCapability = async (req, res) => {

    try {

        const { id } = req.params;

       const {capability} = req.body;

        const  user =  req.user;

        if(user.roleId == 1){

            const rolesExist = await Role.findById(id);

            if(rolesExist){

                const stringifyCapability = JSON.stringify(capability)

                const updateCapability = await Role.findByIdAndUpdate(
                    id,
                    { capability: stringifyCapability },
                );

                if(updateCapability){

                    const updatedCapability = await Role.findById(id);


                    return  res.status(statusCode.OK).send({
                        message : "Capability Updated Successfully...",
                        updatedCapability : updatedCapability

                    })

                }else{

                    return res.status(statusCode.ExpectationFailed).send({
                        message: "Error occured while updating Capability.."
                    })
                }

            }else{

                return  res.status(statusCode.NotFound).send({
                    message : "Role not found.."
                })
    
            }

        }else {
            return res.status(statusCode.BadRequest).send({
                message: "Not Authorized to upload capability..",
            })
        }

    } catch (error) {
        console.log("error", error);
        return res.status(statusCode.InternalServerError).send({
            message: errorMessage.lblInternalServerError
        })

    }

}

