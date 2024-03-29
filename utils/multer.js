/* eslint-disable consistent-return */
const multer = require('multer');
const fs = require('fs')

// create public folder
if(!fs.existsSync('./public')){
    fs.mkdirSync('./public')
}

// create profile folder
if(!fs.existsSync('./public/profile')){
    fs.mkdirSync('./public/profile')
}

// create signature folder
if(!fs.existsSync('./public/signaturesAndPhoto')){
    fs.mkdirSync('./public/signaturesAndPhoto')
}



// create adhar folder
if(!fs.existsSync('./public/adhar')){
    fs.mkdirSync('./public/adhar')
}


// create pan card folder
if(!fs.existsSync('./public/panCard')){
    fs.mkdirSync('./public/panCard')
}



// create voter card folder
if(!fs.existsSync('./public/voterCard')){
    fs.mkdirSync('./public/voterCard')
}


// create voter card folder
if(!fs.existsSync('./public/drivingLicense')){
    fs.mkdirSync('./public/drivingLicense')
}


// create passbook folder
if(!fs.existsSync('./public/passbook')){
    fs.mkdirSync('./public/passbook')
}




// image filter
const imageFilter = (req, file, cb) => {
    if (!file.originalname.match(/\.(jpg|JPG|jpeg|JPEG|png|PNG|gif|GIF)$/)) {
        req.fileValidationError = 'Only images are allowed!';
        return cb(new Error('Only images are allowed!'), false);
    }
    cb(null, true);
};

// video filter
const imageAndVideoFilter = (req, file, cb) => {
    if (!file.originalname.match(
        /\.(jpg|JPG|jpeg|JPEG|png|PNG|gif|GIF|mp4|MP4|m4a|M4A|m4b|M4B|f4v|F4V|mov|MOV)$/)) {
        req.fileValidationError = 'Only images and video are allowed!';
        return cb(new Error('Only images and video are allowed!'), false);
    }
    cb(null, true);
};

// upload profile image
const profileStorage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, './public/profile');
    },
    filename: async (req, file, cb) => {
        cb(null, `${Date.now()}_${file.originalname.toLowerCase().replaceAll(' ', '')}`);
    },
});

const uploadProfile = multer({
    storage: profileStorage,
    limits: {
        fileSize: 1024 * 1024,
        files: 1
    },
    fileFilter: imageFilter
});


// upload passbook

const passbookStorage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, './public/passbook');
    },
    filename: async (req, file, cb) => {
        cb(null, `${Date.now()}_${file.originalname.toLowerCase().replaceAll(' ', '')}`);
    },
});

const uploadPassbook = multer({
    storage: passbookStorage,
    limits: {
        fileSize: 1024 * 1024,
        files: 1
    },
    fileFilter: imageFilter
});


// upload photo and signature

const combinedStorage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, './public/signaturesAndPhoto');
    },
    filename: async (req, file, cb) => {
        cb(null, `${Date.now()}_${file.originalname.toLowerCase().replaceAll(' ', '')}`);
    },
});


const uploadCombined = multer({
    storage: combinedStorage,
    limits: {
        fileSize: 1024 * 1024, // 1 MB
        files: 2 // Allow uploading both signature and photo
    },
    fileFilter: imageFilter
});



// upload adhar back and front

const combinedStorageAdhar = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, './public/adhar');
    },
    filename: async (req, file, cb) => {
        cb(null, `${Date.now()}_${file.originalname.toLowerCase().replaceAll(' ', '')}`);
    },
});


const uploadCombinedAdhar = multer({
    storage: combinedStorageAdhar,
    limits: {
        fileSize: 1024 * 1024, // 1 MB
        files: 2 // Allow uploading both signature and photo
    },
    fileFilter: imageFilter
});


// upload pan back and front
const combinedStoragePan = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, './public/panCard');
    },
    filename: async (req, file, cb) => {
        cb(null, `${Date.now()}_${file.originalname.toLowerCase().replaceAll(' ', '')}`);
    },
});


const uploadCombinedPan = multer({
    storage: combinedStoragePan,
    limits: {
        fileSize: 1024 * 1024, // 1 MB
        files: 2 // Allow uploading both signature and photo
    },
    fileFilter: imageFilter
});



// upload voter back and front
const combinedStorageVoter = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, './public/voterCard');
    },
    filename: async (req, file, cb) => {
        cb(null, `${Date.now()}_${file.originalname.toLowerCase().replaceAll(' ', '')}`);
    },
});


const uploadCombinedVoter = multer({
    storage: combinedStorageVoter,
    limits: {
        fileSize: 1024 * 1024, // 1 MB
        files: 2 // Allow uploading both signature and photo
    },
    fileFilter: imageFilter
});



// upload driving license back and front
const combinedStorageLicense = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, './public/drivingLicense');
    },
    filename: async (req, file, cb) => {
        cb(null, `${Date.now()}_${file.originalname.toLowerCase().replaceAll(' ', '')}`);
    },
});


const uploadCombinedLicense = multer({
    storage: combinedStorageLicense,
    limits: {
        fileSize: 1024 * 1024, // 1 MB
        files: 2 // Allow uploading both signature and photo
    },
    fileFilter: imageFilter
});






//  remaining one
const spaceStorage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, './public/spaces');
    },
    filename: async (req, file, cb) => {
        cb(null, `${Date.now()}_${file.originalname.toLowerCase().replaceAll(' ', '')}`);
    },
});
const imageStorage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, './public/pages');
    },
    filename: async (req, file, cb) => {
        cb(null, `${Date.now()}_${file.originalname.toLowerCase().replaceAll(' ', '')}`);
    },
});
const imageStorageType = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, './public/storage_types');
    },
    filename: async (req, file, cb) => {
        cb(null, `${Date.now()}_${file.originalname.toLowerCase().replaceAll(' ', '')}`);
    },
});
const imageChat = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, './public/chats');
    },
    filename: async (req, file, cb) => {
        cb(null, `${Date.now()}_${file.originalname.toLowerCase().replaceAll(' ', '')}`);
    },
});

const uploadSpace = multer({
    storage: spaceStorage,
    limits: {
        fileSize: 1024 * 1024 * 5
    },
    fileFilter: imageAndVideoFilter
});
const uploadImage = multer({
    storage: imageStorage,
    limits: {
        fileSize: 1024 * 1024,
        files: 1
    },
    fileFilter: imageFilter
});
const uploadStorageTypeImage = multer({
    storage: imageStorageType,
    limits: {
        fileSize: 1024 * 1024,
        files: 1
    },
    fileFilter: imageFilter
});
const uploadChatImage = multer({
    storage: imageChat,
    limits: {
        fileSize: 1024 * 1024,
    },
    fileFilter: imageFilter
});
exports.uploadProfile = uploadProfile;
exports.uploadSpace = uploadSpace;
exports.uploadImage = uploadImage;
exports.uploadStorageType = uploadStorageTypeImage;
exports.uploadChatImage = uploadChatImage;
exports.uploadCombined = uploadCombined;
exports.uploadCombinedAdhar = uploadCombinedAdhar;
exports.uploadCombinedPan = uploadCombinedPan;
exports.uploadCombinedVoter = uploadCombinedVoter;
exports.uploadCombinedLicense = uploadCombinedLicense;
exports.uploadPassbook = uploadPassbook