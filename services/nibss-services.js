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

        return response.data.token;

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

exports.createAccount = async (data, token) => {
    const headers = config(token);
    const response = await axios.post(`${process.env.NIBSS_BASE_URL}/api/account/create`, data, headers);

    if(!response.data) {
        throw new Error("Nibss responded with undefined");
    }

    return response.data;
}

exports.getBalance = async (accountNumber, token) => {
    const headers = config(token);
    const response = await axios.get(`${process.env.NIBSS_BASE_URL}/api/account/balance/${accountNumber}`, headers);

    if(!response.data) {
        throw new Error("Nibss responded with undefined");
    }

    return response.data;
}

exports.getTransactionByRef = async (ref, token) => {
    const headers = config(token);
    const response = await axios.get(`${process.env.NIBSS_BASE_URL}/api/transaction/${ref}`, headers);

    if(!response.data) {
        throw new Error("Nibss responded with undefined");
    }

    return response.data;
}

exports.getAccountName = async (accountNumber, token) => {
    const headers = config(token);
    const response = await axios.get(`${process.env.NIBSS_BASE_URL}/account/name-enquiry/${accountNumber}`, headers);

    if(!response.data) {
        throw new Error("Nibss responded with undefined");
    }

    return response.data;
}

exports.transfer = async (data, token) => {
    const headers = config(token);
    const response = await axios.post(`${process.env.NIBSS_BASE_URL}/api/transfer`, data, headers);

    if(!response.data) {
        throw new Error("Nibss responded with undefined");
    }

    return response.data;
}