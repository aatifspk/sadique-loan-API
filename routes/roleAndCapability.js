
const roleAndCapability = require("../controller/roleAndCapability/roleAndCapability");
const auth = require('../middleware/authorization/jwt');


module.exports = (app) => {

    // get role and capability by id 
    app.get('/getRole/Capabolity/:id',auth.checkAdminAuth, roleAndCapability.getRoleAndCapability);

    // get all role and capability 
    app.get('/getAllRoles',auth.checkAdminAuth, roleAndCapability.getAllRolesAndCapability);

    // assign role and capability
    app.post('/assign/roleAndCapability/:id',auth.checkAdminAuth,  roleAndCapability.assignRoleAndCapability )


   

};