const express = require("express");
const bodyPrser = require("body-parser");
const cors = require("cors");
const welcomeRouter = require("./routes/welcome");
const clientRoute = require("./routes/user");
const adminRoutes = require("./routes/admin")
const ConnectDb = require("./configure/connectionDb");
const Roles = require("./models/roles/roles");
const Product = require("./models/Product/product")
const dotnev = require("dotenv");
dotnev.config();
const DATABASE_URL = process.env.DATABASE_URL;
const Razorpay = require('razorpay');

const cityArray = require("./utils/city");
const stateArray = require("./utils/state");


const state = require("./models/State/state");
const city = require("./models/City/city")

// creating app server
const app = express();


app.use(cors());
app.use(express.json())
app.use(express.static('public'))
app.use(bodyPrser.json());


// welcome route
app.use("/api", welcomeRouter.router);
app.use("/api/client", clientRoute.router);
app.use("/api/admin", adminRoutes.router);
require("./routes/superAdminNotification")(app);
require("./routes/roleAndCapability")(app);

// console.log("DATABASE_URL",DATABASE_URL);
ConnectDb(DATABASE_URL);


const roles = [
  { id: 1, name: 'super admin' },
  { id: 2, name: 'agent' },
  { id: 3, name: 'employee' },
  { id: 4, name: 'client' },
];

//  insert role
Roles.countDocuments({})
  .exec()
  .then(count => {
    if (count === 0) {
      // Insert predefined roles into the Role collection
      return Roles.insertMany(roles);
    } else {
      console.log('Roles already exist in the database.');
    }
  })
  .catch(err => {
    console.error('Error:', err);
  })
  .finally(() => {
  });

const productData = [
  {
    productName: "Personal Loan",
    intoducedDate: null,
    AmountRangeStart: 1000,
    AmountRangeEnd: 5000,
    rateOfInterest: 0.5,
    rateTyep: "day",
    // rateType can be day, week, month, year

    processChargeInclude: true,
    processFeePercent: 10,
    recoveryType: "day",
    productStatus: true,
    holidayExclude: true,
    gstchargeInclude: true,
    NoOfEmi:21,

    // documents required
    aharRequired: true,
    panRequired: true,
    voterRequired: true,
    drivingLicenseRequired: true,
    propertyPaperRequired: true
  },
  {
    productName: "Group Loan",
    intoducedDate: null,
    AmountRangeStart: 10000,
    AmountRangeEnd: 10000,
    rateOfInterest: 40 ,
    rateTyep: "day",
    // rateType can be day, week, month, year 

    processChargeInclude: false,
    processFeePercent: 8,
    recoveryType: "day",
    productStatus: true,
    holidayExclude: false,
    gstchargeInclude: false,
    NoOfEmi:16,

    // documents required
    aharRequired: true,
    panRequired: true,
    voterRequired: true,
    drivingLicenseRequired: true,
    propertyPaperRequired: true
  }

]


// insert products (loans)
Product.countDocuments({})
  .exec()
  .then(count => {
    if (count === 0) {
      // Insert predefined roles into the Role collection
      return Product.insertMany(productData);
    } else {
      console.log('Product already exist in the database.');
    }
  })
  .catch(err => {
    console.error('Error:', err);
  })
  .finally(() => {
  });


// insert states 
state.countDocuments({})
  .exec()
  .then(count => {
    if (count === 0) {
      insertStateData(stateArray)
    } else {
      console.log('States already exist in the database.');
    }
  })

  .catch(err => {
    console.error('Error:', err);
  })
  .finally(() => {
  });


// insert city
city.countDocuments({})
  .exec()
  .then(count => {
    if (count === 0) {
      insertCityData(cityArray)
    } else {
      console.log('cities already exist in the database.');
    }
  })

  .catch(err => {
    console.error('Error:', err);
  })
  .finally(() => {
  });



// insert state data in state table

const insertStateData = async (data) => {
  try {
    // Insert the data into the 'state' collection
    await state.insertMany(data);
    console.log('State Data inserted successfully');
  } catch (error) {
    console.error('Error inserting State data:', error);
  }
};

// insert city data in table

const insertCityData = async (cityData) => {
  try {
    // Insert the data into the 'city' collection
    await city.insertMany(cityData);
    console.log('City data inserted successfully');
  } catch (error) {
    console.error('Error inserting city data:', error);
  }
}



// delete all roles

const deleteAllRolesData = async () => {
  try {
    // Delete all documents from the 'state' collection
    await Roles.deleteMany({});
    console.log('All data deleted successfully');
  } catch (error) {
    console.error('Error deleting data:', error);
  }
};


// delete all state
const deleteAllStateData = async () => {
  try {
    // Delete all documents from the 'state' collection
    await state.deleteMany({});
    console.log('All data deleted successfully');
  } catch (error) {
    console.error('Error deleting data:', error);
  }
};

// delete all city
const deleteAllCityData = async () => {
  try {
    // Delete all documents from the 'state' collection
    await city.deleteMany({});
    console.log('All data deleted successfully');
  } catch (error) {
    console.error('Error deleting data:', error);
  }
};



// razorpay integration
const instance = new Razorpay({
  key_id: process.env.RZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_SECRECT,
});

module.exports =  instance 


// testing push


const port = process.env.PORT;

app.listen(port, () => {
  console.log("APP STARTED SUCCESSFULLY....")
})