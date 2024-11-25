// Import the token.js file

var { signUrl, addCountries } = require('../src/token.js');

var authKey = "08c8d563-bbc7-452a-95c6-99a7856b035c";

// Generate a query parameter based token string

var signedUrlQP = signUrl("https://362a33c2f033ab37c30201f72321fe6a5ed43cec.cdn.broadpeak.io/Broadpeak_Long.mp4", authKey, 7200, "", false, "/", "CA,US", "JP");

console.log("Query Parameter based token string: " + signedUrlQP);

// Generate a directory based token string

var signedUrlD = signUrl("https://362a33c2f033ab37c30201f72321fe6a5ed43cec.cdn.broadpeak.io/Broadpeak_Long.mp4", authKey, 7200, "", true, "/", "CA,US", "JP");

console.log("Directory based token string: " + signedUrlD);