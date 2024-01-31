const express = require("express");
let router = express.Router();
const userController = require("../controller/user");
const adminController  = require("../controller/admin");
const multer = require('multer');
const statusCode = require('../utils/http-status-code');
const auth = require('../middleware/authorization/jwt');
const {
    uploadProfile
} = require('../utils/multer');


router.post('/signIn', adminController.signIn );
router.post('/signInByOtp', adminController.signInByOtp );
router.post('/forgetpassword', userController.forgetpassword );
router.post('/resetpassword', userController.resetPassword );



// create and update profile for admin
router.post('/adminProfile', auth.checkAdminAuth, (req, res, next) => {
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

// get Admin profile
router.get('/getAdminProfile/:id', auth.checkAdminAuth, userController.getProfile);

// ###----------- Client routes starts here-----------

// create Client 
router.post('/createClient', auth.checkAdminAuth,adminController.createClient);

// get particular client
router.get('/getParticularClient/:id', auth.checkAdminAuth,adminController.getParticularClinet);

// get clinet list with filter
router.get('/getClinetsList', auth.checkAdminAuth,adminController.listClients);

// deactivate client
router.post("/clientInActive/:id",auth.checkAdminAuth,adminController.clientInActive);

// get soft deleted client with filter 
router.get('/getSoftDeleteClinetsList', auth.checkAdminAuth,adminController.listSoftDeletedClients);

// get clients list
router.get('/getClinets/:brnachID', auth.checkAdminAuth,adminController.getClinets);

// soft delete client
router.delete("/deleteClinet/:id",auth.checkAdminAuth, adminController.softDeleteClient);

// restore client
router.put("/clientRestore/:id",auth.checkAdminAuth, adminController.restoreClient);

// permanent delete client
router.delete("/permanentDeleteClient/:id",auth.checkAdminAuth, adminController.deleteClient);


//###---------- Client routes ends here------------



//###--------- Employee routes starts here----------

// create employee 
router.post('/createEmployee', auth.checkAdminAuth,adminController.createEmployee);

// get particular employee
router.get('/getParticularEmployee/:id', auth.checkAdminAuth,adminController.getParticularEmployee);

// get employee list with filter
router.get('/getEmployeesList', auth.checkAdminAuth,adminController.listEmployees);

// get employees list
router.get('/getEmployee/:brnachID', auth.checkAdminAuth,adminController.getEmployee);

// employee active inactive
router.post("/employeeInActive/:id",auth.checkAdminAuth,adminController.employeeInActive);


// soft delete employee
router.delete("/deleteEmployee/:id",auth.checkAdminAuth, adminController.softDeleteEmployee);

// restore employee
router.put("/employeeRestore/:id",auth.checkAdminAuth, adminController.restoreEmployee);

// get soft deleted employee with filter
router.get('/getSoftDeleteEmployeesList', auth.checkAdminAuth,adminController.listSoftDeletedEmployee);





//###---------- Employee routes ends here------------



//###----------- Product routes starts here-----------

// create Products (loans)
router.post('/createproduct', auth.checkAdminAuth,adminController.createProduct);

// get products list
router.get('/getProducts', auth.checkAdminAuth,adminController.getProducts);

// get particular products 
router.get('/getParticularProduct/:id', auth.checkAdminAuth,adminController.getParticularProduct);

// get products with filter
router.get('/getProductsList', auth.checkAdminAuth,adminController.listProducts);

// soft delete product
router.delete("/deleteProduct/:id",auth.checkAdminAuth, adminController.softDeleteProduct);

// restore product
router.put("/productRestore/:id",auth.checkAdminAuth, adminController.restoreProduct);

// get soft deleted product with filter
router.get('/getSoftDeletedProductsList', auth.checkAdminAuth,adminController.listSoftDeletedProducts);

// permanent delete product
router.delete("/permanentDeleteProduct/:id",auth.checkAdminAuth, adminController.deleteProduct);

// product active inactive
router.post("/productInActive/:id",auth.checkAdminAuth,adminController.productInActive);


// create product information
router.post('/createproductInfo', auth.checkAdminAuth,adminController.createProductInformation);

// get particualr product info
router.get('/getParticularProductInfo/:id', auth.checkAdminAuth,adminController.getParticularProductInfo);

// get product info List
router.get('/getProductinfoList', auth.checkAdminAuth,adminController.getProductInfoList);






//###----------- Product routes ends here-------------







// ###----------- Agent routes starts here------------

// create Agent
router.post('/createAgent', auth.checkAdminAuth,adminController.createAgent);

// get particular agent
router.get('/getAgent/:id', auth.checkAdminAuth,adminController.getParticularAgent);

// deactivate agent
router.post("/agentInActive/:id",auth.checkAdminAuth,adminController.agentInActive);

// soft delete agent
router.delete("/deleteAgent/:id",auth.checkAdminAuth, adminController.softDeleteAgent);

// get agent list with filter
router.get('/getAgentList', auth.checkAdminAuth,adminController.listAgents);

// get soft deleted Agents with filter 
router.get('/getSoftDeleteAgentsList', auth.checkAdminAuth,adminController.listSoftDeletedAgents);

// restore agent
router.put("/agentRestore/:id",auth.checkAdminAuth, adminController.restoreAgent);

// permanent delete agent
router.delete("/permanentDeleteAgent/:id",auth.checkAdminAuth, adminController.deleteAgent);

// ###------------ Agent routes ends here---------------




// ###------------ branch routes starts here--------------

// create branch 
router.post('/createBranch', auth.checkAdminAuth,adminController.updateBranch);

// get branchs list
router.get('/getBranchs', auth.checkAdminAuth,adminController.getBranchs);
router.get('/getBranchsList', auth.checkAdminAuth,adminController.listBranches);

// get particular branch info
router.get('/getBranch/:id', auth.checkAdminAuth,adminController.getParticularBranch);

// deActivate branch
router.post("/branchInActive/:id",auth.checkAdminAuth,adminController.branchInActive);

// delete branch
router.delete("/deleteBranch/:id",auth.checkAdminAuth, adminController.softDeleteBranch);

// restore branch
router.put("/branchRestore/:id",auth.checkAdminAuth, adminController.restoreBranch);

// permanent delete branch
router.delete("/permanentDeleteBranch/:id",auth.checkAdminAuth, adminController.deleteBranch);

// get filtered list of soft deleted branch
router.get('/getBranchsSoftDeleteList', auth.checkAdminAuth,adminController.listSoftDeletedBranches);

//###------------ branch routes ends here--------------



















exports.router = router;


