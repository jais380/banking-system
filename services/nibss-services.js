const axios = require("axios");

const config = (token) => {
    const headers = {
        headers: {
            "Authorization": `Bearer ${token}`,
            "Content-Type": "application/json"
        }
    }

    return headers;
}

exports.generateToken = async () => {
    try {
        const response = await axios.post(`${process.env.NIBSS_BASE_URL}/api/auth/token`, {
            apiKey: `${process.env.API_KEY}`,
            apiSecret: `${process.env.API_SECRET}`
        });

        if(!response) {
            throw new Error("Nibss responded with undefined")
        }

        return response.data;

    } catch(error) {
        console.log(error.response?.data || error.message);
        throw new Error("Token Generation Failed");
    }
}

exports.validateBVN = async (bvn) => {
    try {
        const response = await axios.post(`${process.env.NIBSS_BASE_URL}/api/validateBvn`, {bvn});

        if(!response.data) {
            throw new Error("Nibss responded with undefined")
        }

        return response.data;

    } catch(error) {
        console.log(error.response?.data || error.message);
        throw new Error("BVN Validation Failed");
    }
}

exports.validateNIN = async (nin) => {
    try {
        const response = await axios.post(`${process.env.NIBSS_BASE_URL}/api/validateNin`, {nin});

        if(!response.data) {
            throw new Error("Nibss responded with undefined")
        }

        return response.data;

    } catch(error) {
        console.log(error.response?.data || error.message);
        throw new Error("NIN Validation Failed");
    }
}