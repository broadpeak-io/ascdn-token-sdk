var crypto = require("crypto");

/**
 * Validates a broadpeak.io ASCDN token from a signed URL.
 *
 * @param {string} signedUrl   - The full signed URL (query-param or directory-based)
 * @param {string} authKey     - The authKey for the CDN endpoint (same key used to sign)
 * @param {string} [userIp]    - Optional: the user IP if the IP-locking feature was enabled
 * @returns {{ valid: boolean, reason: string, details: object }}
 */
function validateToken(signedUrl, authKey, userIp) {
	var details = {};

	// ------------------------------------------------------------------
	// 1. Parse the URL
	// ------------------------------------------------------------------
	var parsedUrl = new URL(signedUrl);

	// Determine whether this is a directory-based or query-param-based token
	var isDirectory = signedUrl.includes("/bcdn_token=");

	var token, expires, tokenPath, tokenIgnoreParams;
	var resourcePath;

	if (isDirectory) {
		// Directory-based:  /bcdn_token=TOKEN&param=value&expires=123/path/to/resource
		var match = signedUrl.match(/\/bcdn_token=([^/]+)\/(.*)$/);
		if (!match) {
			return { valid: false, reason: "Could not parse directory-based token from URL", details };
		}
		var tokenSegment = match[1]; // TOKEN&param=value&expires=123
		resourcePath = "/" + match[2];

		// Split the token segment into token + query params
		var parts = tokenSegment.split("&");
		token = parts[0];
		var params = {};
		for (var i = 1; i < parts.length; i++) {
			var eq = parts[i].indexOf("=");
			if (eq !== -1) {
				params[parts[i].substring(0, eq)] = parts[i].substring(eq + 1);
			}
		}
		expires = params.expires ? parseInt(params.expires, 10) : null;
		tokenPath = params.token_path ? decodeURIComponent(params.token_path) : resourcePath;
		tokenIgnoreParams = params.token_ignore_params === "true";
	} else {
		// Query-param-based:  /path?token=TOKEN&param=value&expires=123
		var searchParams = parsedUrl.searchParams;
		token = searchParams.get("token");
		expires = parseInt(searchParams.get("expires"), 10);
		tokenPath = searchParams.get("token_path") ? decodeURIComponent(searchParams.get("token_path")) : decodeURIComponent(parsedUrl.pathname);
		tokenIgnoreParams = searchParams.get("token_ignore_params") === "true";
		resourcePath = decodeURIComponent(parsedUrl.pathname);
	}

	details.token = token;
	details.expires = expires;
	details.expiresDate = expires ? new Date(expires * 1000).toISOString() : null;
	details.tokenPath = tokenPath;
	details.tokenIgnoreParams = tokenIgnoreParams;
	details.resourcePath = resourcePath;
	details.isDirectory = isDirectory;

	// ------------------------------------------------------------------
	// 2. Check expiration
	// ------------------------------------------------------------------
	var now = Math.floor(Date.now() / 1000);
	details.currentTime = now;
	details.isExpired = expires ? (now > expires) : true;

	if (!expires) {
		return { valid: false, reason: "No expiration timestamp found in URL", details };
	}
	if (details.isExpired) {
		return { valid: false, reason: "Token has expired (expires=" + details.expiresDate + ")", details };
	}

	// ------------------------------------------------------------------
	// 3. Rebuild the parameter data (must match how signUrl builds it)
	// ------------------------------------------------------------------
	var signaturePath = tokenPath;

	var parameters = new URLSearchParams();
	if (tokenIgnoreParams) {
		parameters.set("token_ignore_params", "true");
	}
	if (tokenPath) {
		parameters.set("token_path", signaturePath);
	}
	parameters.sort();

	var parameterData = "";
	parameters.forEach(function (value, key) {
		if (value === "") return;
		if (parameterData.length > 0) parameterData += "&";
		parameterData += key + "=" + value;
	});

	// ------------------------------------------------------------------
	// 4. Recompute the hash
	//    hashableBase = authKey + signaturePath + expires + parameterData + userIp
	// ------------------------------------------------------------------
	var hashableBase = authKey + signaturePath + expires + parameterData + (userIp != null ? userIp : "");
	details.hashableBase = hashableBase;

	var computedToken = Buffer.from(crypto.createHash("sha256").update(hashableBase).digest()).toString("base64");
	computedToken = computedToken.replace(/\n/g, "").replace(/\+/g, "-").replace(/\//g, "_").replace(/=/g, "");

	details.computedToken = computedToken;

	// ------------------------------------------------------------------
	// 5. Compare
	// ------------------------------------------------------------------
	if (computedToken === token) {
		return { valid: true, reason: "Token is valid and not expired", details };
	} else {
		return {
			valid: false,
			reason: "Token hash mismatch — the authKey or parameters do not match what was used to sign",
			details,
		};
	}
}

module.exports = { validateToken };