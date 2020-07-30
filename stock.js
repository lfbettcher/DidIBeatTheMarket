const axios = require("axios");

const makeRequest = axios.create({
  baseURL: "https://www.alphavantage.co/",
  method: "get",
});

module.exports = { makeRequest };
