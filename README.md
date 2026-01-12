# ascdn-token-sdk

## Introduction

This SDK provides two files:
- `./src/token.js`: This file provides functions for generating authentication tokens and can be used freely in your projects.
- `./tests/token.test.js`: This file provides comprehensive tests and working examples using the `./src/token.js` file.

This has been tested on Node.js versions v20.0.0 and onwards.

## What `token.js` does

The `token.js` file provides functions to generate signed URLs to be used with broadpeak.io ASCDN resources. These signed URLs include authentication tokens that control access to the resources based on various parameters such as expiration time, user IP, allowed paths, and allowed or blocked countries.

### Functions

- **addCountries(url, countriesAllowed, countriesBlocked)**: Adds allowed and blocked countries as query parameters to the URL.

- **signUrl(url, authKey, expirationTime = 3600, userIp, isDirectory = false, pathAllowed, countriesAllowed, countriesBlocked, ignoreParams = false)**: Generates a signed URL with an authentication token. The token is created using a combination of the URL, authentication key, expiration time, user IP, allowed path, and allowed or blocked countries. When `ignoreParams` is set to `true`, the token will ignore existing query parameters in the URL during validation.

## What token.test.js does

The `token.test.js` file provides a comprehensive test suite that validates the functionality of the `token.js` module. It performs 7 different tests covering various scenarios:

1. **Query Parameter Based Token** - Standard token with country restrictions
2. **Directory Based Token** - Token embedded in the URL path
3. **Token with ignoreParams=true** - Token that works with any query parameters
4. **Reuse Token with Different Params** - Validates ignoreParams flexibility
5. **Token with Mismatched Query Params** - Tests strict parameter validation
6. **Invalid/Tampered Token** - Verifies CDN rejects bad tokens (403)
7. **No Token Provided** - Confirms authentication is required (403)

Each test includes:
- Configuration details and expected results
- Generated token and URL display
- Live CDN response validation with status codes
- Response time measurement
- Comprehensive summary with key findings

### Running the Tests

```bash
node tests/token.test.js
```

The test suite will output a professional report showing each test's configuration, generated tokens, CDN responses, and a summary table with performance metrics.

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
var signedUrl = signUrl("https://362a33c2f033ab37c30201f72321fe6a5ed43cec.cdn.broadpeak.io/Broadpeak_Long.mp4", authKey, 7200, "", true, "/", "CA,US", "JP");
```

The call above will yield a URL in the format of: https://362a33c2f033ab37c30201f72321fe6a5ed43cec.cdn.broadpeak.io/bcdn_token=8V__lWE7eoq51IHtYaoLsH5weW7ykOxrj_2eINHscKs&token_countries=CA%2CUS&token_countries_blocked=JP&token_path=%2F&expires=1732563527/Broadpeak_Long.mp4

### Ignore query parameters example

When you need to generate a token that ignores query parameters in the URL (useful when the CDN resource may have varying query strings):

```javascript
var authKey = "08c8d563-bbc7-452a-95c6-99a7856b035c";
var signedUrl = signUrl("https://362a33c2f033ab37c30201f72321fe6a5ed43cec.cdn.broadpeak.io/Broadpeak_Long.mp4?custom=value&other=param", authKey, 7200, "", false, "/", "CA,US", "JP", true);
```

The call above will yield a URL in the format of: https://362a33c2f033ab37c30201f72321fe6a5ed43cec.cdn.broadpeak.io/Broadpeak_Long.mp4?token=GwchVyLMBSeyHbvxZMA9_iI3G5j38p62DugKwF_ZiU0&token_ignore_params=true&token_path=%2F&expires=1732563527


## API Reference

### signUrl

```javascript
function signUrl(url, authKey, expirationTime = 3600, userIp, isDirectory = false, pathAllowed, countriesAllowed, countriesBlocked, ignoreParams = false)
```
Generates a signed URL with an authentication token.

**Parameters:**

- **url** (string): CDN URL without the trailing '/' (e.g., https://362a33c2f033ab37c30201f72321fe6a5ed43cec.cdn.broadpeak.io/video.mp4)
- **authKey** (string): Security token found in your pull zone
- **expirationTime** (number): Authentication validity in seconds (default: 3600 seconds / 1 hour)
- **userIp** (string): Optional parameter if you have the User IP feature enabled
- **isDirectory** (boolean): When `true`, returns a URL with the token embedded in the path (e.g., /bcdn_token=.../path); when `false`, returns a URL with the token as a query parameter (default: false)
- **pathAllowed** (string): Directory to authenticate (e.g., /path/to/videos or /)
- **countriesAllowed** (string): Comma-separated list of countries allowed (e.g., "CA,US,TH")
- **countriesBlocked** (string): Comma-separated list of countries blocked (e.g., "JP,CN")
- **ignoreParams** (boolean): When `true`, the token will work with any query parameters; when `false`, the token is tied to specific query parameters (default: false)

**Returns:** (string) The signed URL with the authentication token

### addCountries

```javascript
function addCountries(url, countriesAllowed, countriesBlocked)
```

Helper function that adds country restrictions to a URL as query parameters.

**Parameters:**

- **url** (string): The URL to add country parameters to
- **countriesAllowed** (string): Comma-separated list of allowed countries
- **countriesBlocked** (string): Comma-separated list of blocked countries

**Returns:** (string) The URL with country parameters appended