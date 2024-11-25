# ascdn-token-sdk

## Introduction

This sdk provides includes two files:
- `./src/token.js`: This file acts is a reference for generating token strings and can be used freely in your projects.
- `./test/token.test.js`: This file provides a working example using the `./src/token.js` file. 

This has been tested on NodeJS versions v20.0.0. and onwards.

## What `token.js` does

The `token.js` file provides functions to generate signed URLs to be used with broadpeak.io ASCDN resources. These signed URLs include authentication tokens that control access to the resources based on various parameters such as expiration time, user IP, allowed paths, and allowed or blocked countries.

### Functions

- **addCountries(url, countriesAllowed, countriesBlocked)**: Adds allowed and blocked countries as query parameters to the URL.

- **signUrl(url, authKey, expirationTime = 3600, userIp, isDirectory = false, pathAllowed, countriesAllowed, countriesBlocked)**: Generates a signed URL with an authentication token. The token is created using a combination of the URL, authentication key, expiration time, user IP, allowed path, and allowed or blocked countries.

## What token.test.js does

The `token.test.js` file is used to test the functionality of the `token.js` module. It imports the functions from `token.js` and generates token strings to verify that the URL signing process works correctly. The test file includes examples of generating signed URLs with different parameters to ensure that the authentication tokens are created as expected.

### Functions Tested
`signUrl`: This function is tested with different parameters to generate signed URLs for CDN resources. The test cases include:
- Generating a query parameter-based token string.
- Generating a directory-based token string.

## Usage

### Query Parameter based authentication example

```javascript
var authKey = "08c8d563-bbc7-452a-95c6-99a7856b035c";
var signedUrl = signUrl("https://362a33c2f033ab37c30201f72321fe6a5ed43cec.cdn.broadpeak.io/Broadpeak_Long.mp4", authKey, 7200, "", false, "/", "CA,US", "JP");  
```
The call above will yield a URL in the format of: https://362a33c2f033ab37c30201f72321fe6a5ed43cec.cdn.broadpeak.io/Broadpeak_Long.mp4?token=8V__lWE7eoq51IHtYaoLsH5weW7ykOxrj_2eINHscKs&token_countries=CA%2CUS&token_countries_blocked=JP&token_path=%2F&expires=1732563527


### Directory based authentication example

```javascript
var authKey = "08c8d563-bbc7-452a-95c6-99a7856b035c";
var signedUr = signUrl("https://362a33c2f033ab37c30201f72321fe6a5ed43cec.cdn.broadpeak.io/Broadpeak_Long.mp4", authKey, 7200, "", true, "/", "CA,US", "JP");
```

The call above will yield a URL in the format of: https://362a33c2f033ab37c30201f72321fe6a5ed43cec.cdn.broadpeak.io/bcdn_token=8V__lWE7eoq51IHtYaoLsH5weW7ykOxrj_2eINHscKs&token_countries=CA%2CUS&token_countries_blocked=JP&token_path=%2F&expires=1732563527/Broadpeak_Long.mp4


### Function Description

```javascript
function signUrl(url, authKey, expirationTime = 3600, userIp, isDirectory = false, pathAllowed, countriesAllowed, countriesBlocked)
```
Generates a signed URL with an authentication token.

- **url**: CDN URL without the trailing '/' (e.g., https://362a33c2f033ab37c30201f72321fe6a5ed43cec.cdn.broadpeak.io/video.mp4)
- **authKey**: Security token found in your pull zone
- **expirationTime**: Authentication validity in seconds (default: 3600 seconds / 1 hour)
- **userIp**: Optional parameter if you have the User IP feature enabled
- **isDirectory**: Optional parameter; "true" returns a URL separated by forward slashes (e.g., (domain)/bcdn_token=.../path), while "false" returns a URL separated by traditional query separators (?token=...)
- **pathAllowed**: Directory to authenticate (e.g., /path/to/videos)
- **countriesAllowed**: List of countries allowed (e.g., CA, US, TH)
- **countriesBlocked**: List of countries blocked (e.g., CA, US, TH)
- **returns**: The signed URL with the authentication token