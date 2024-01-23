const generateOTP = () => {
    const digits = '123456789'; 
    let OTP = digits[Math.floor(Math.random() * 9)]; 

    for (let i = 1; i < 6; i += 1) {
        OTP += digits[Math.floor(Math.random() * 9)];
    }

    return OTP;
};


module.exports = {
    generateOTP,
};