var queryString = require("querystring");
var crypto = require("crypto");

function addCountries(url, a, b) {
	var tempUrl = url;
	if (a != null) {
		var tempUrlOne = new URL(tempUrl);
		tempUrl += ((tempUrlOne.search == "") ? "?" : "&") + "token_countries=" + a;
	}
	if (b != null) {
		var tempUrlTwo = new URL(tempUrl);
		tempUrl += ((tempUrlTwo.search == "") ? "?" : "&") + "token_countries_blocked=" + b;
	}
	return tempUrl;
}

function signUrl(url, authKey, expirationTime = 3600, userIp, isDirectory = false, pathAllowed, countriesAllowed, countriesBlocked, ignoreParams = false) {
	/*
		url: CDN URL w/o the trailing '/'
		authKey: authKey for your cdnEndpoint
		expirationTime: Authentication validity (default. 86400 sec/24 hrs)
		userIp: Optional parameter if you have the User IP feature enabled
		isDirectory: Optional parameter - "true" returns a URL separated by forward slashes (e.g. (domain)/bcdn_token=...)
		pathAllowed: Directory to authenticate (e.g. /path/to/videos)
		countriesAllowed: List of countries allowed (e.g. CA, US, TH)
		countriesBlocked: List of countries blocked (e.g. CA, US, TH)
		ignoreParams: Optional parameter - if true, adds token_ignore_params=true to ignore query parameters in validation
	*/
	var parameterData = "", parameterDataUrl = "", signaturePath = "", hashableBase = "", token = "";
	var expires = Math.floor(new Date() / 1000) + expirationTime;
	var url = addCountries(url, countriesAllowed, countriesBlocked);
	var parsedUrl = new URL(url);
	var parameters = (new URL(url)).searchParams;
	
	if (ignoreParams) {
		parameters = new URLSearchParams();
		parameters.set("token_ignore_params", "true");
	}
	
	if (pathAllowed != "") {
		signaturePath = pathAllowed;
		parameters.set("token_path", signaturePath);
	} else {
		signaturePath = decodeURIComponent(parsedUrl.pathname);
	}
	parameters.sort();
	if (Array.from(parameters).length > 0) {
		parameters.forEach(function(value, key) {
			if (value == "") {
				return;
			}
			if (parameterData.length > 0) {
				parameterData += "&";
			}
			parameterData += key + "=" + value;
			parameterDataUrl += "&" + key + "=" + queryString.escape(value);
			
		});
	}
	hashableBase = authKey + signaturePath + expires + parameterData + ((userIp != null) ? userIp : "");
	token = Buffer.from(crypto.createHash("sha256").update(hashableBase).digest()).toString("base64");
	token = token.replace(/\n/g, "").replace(/\+/g, "-").replace(/\//g, "_").replace(/=/g, "");
	if (isDirectory) {
		return parsedUrl.protocol+ "//" + parsedUrl.host + "/bcdn_token=" + token + parameterDataUrl + "&expires=" + expires + parsedUrl.pathname;
	} else {
		return parsedUrl.protocol + "//" + parsedUrl.host + parsedUrl.pathname + "?token=" + token + parameterDataUrl + "&expires=" + expires;
	}
}

module.exports = {
    addCountries,
    signUrl
};