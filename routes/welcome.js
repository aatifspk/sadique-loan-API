const express = require("express");
let router = express.Router();

const stateAndCityController = require("../controller/stateAndCity/stateAndCity")


router.get('/welcome', (req,res) => {

    return   res.send({
        message: "Welcome to Loan Management App"
    })

});


// get states

router.get('/getStates',stateAndCityController.getState);
router.get('/getCities/:stateCode',stateAndCityController.getCity);




exports.router = router;


