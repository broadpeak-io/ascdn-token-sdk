// Usage:
//   node tests/validate-url.js --url "<signedUrl>" --authKey "<authKey>" [--userIp "<ip>"] [--no-live]
//
// Examples:
//   node tests/validate-url.js \
//     --url "https://362a33c2a385d7d1e52d89d1856f40f28b00dd8d.cdn.broadpeak.io/bcdn_token=n7NbxkLsLMivtGFrBTAwuA8jSnx6zHD6Y25c5LoVvlQ&token_ignore_params=true&token_path=%2Frcnnoticias%2F&expires=1786391039/rcnnoticias/manifest.mpd" \
//     --authKey "YOUR_AUTH_KEY"
//
//   node tests/validate-url.js --url "https://example.cdn.broadpeak.io/path?token=XXX&expires=123" --authKey "YOUR_KEY" --userIp "1.2.3.4"
//
// Short flags also work: -u, -k, -i, -n

var { validateToken } = require("../src/validate.js");

// ─── Parse command-line arguments ─────────────────────────────────────────────
var args = {};
for (var i = 2; i < process.argv.length; i++) {
	var arg = process.argv[i];
	var next = process.argv[i + 1];

	if (arg === "--url" || arg === "-u") {
		args.url = next; i++;
	} else if (arg === "--authKey" || arg === "-k") {
		args.authKey = next; i++;
	} else if (arg === "--userIp" || arg === "-i") {
		args.userIp = next; i++;
	} else if (arg === "--no-live" || arg === "-n") {
		args.noLive = true;
	} else if (arg === "--help" || arg === "-h") {
		args.help = true;
	}
}

if (args.help || !args.url || !args.authKey) {
	console.log("");
	console.log("ASCDN Token Validator");
	console.log("");
	console.log("Usage:");
	console.log("  node tests/validate-url.js --url \"<signedUrl>\" --authKey \"<authKey>\" [options]");
	console.log("");
	console.log("Required:");
	console.log("  --url, -u <url>        The signed CDN URL to validate");
	console.log("  --authKey, -k <key>    The authKey (security token) for the CDN endpoint");
	console.log("");
	console.log("Optional:");
	console.log("  --userIp, -i <ip>      User IP address (if IP-locking is enabled)");
	console.log("  --no-live, -n          Skip the live CDN HTTP check");
	console.log("  --help, -h             Show this help message");
	console.log("");
	console.log("Examples:");
	console.log("  node tests/validate-url.js \\");
	console.log("    -u \"https://abc.cdn.broadpeak.io/bcdn_token=XXX&token_path=%2F&expires=123/path\" \\");
	console.log("    -k \"08c8d563-bbc7-452a-95c6-99a7856b035c\"");
	console.log("");
	process.exit(0);
}

var signedUrl = args.url;
var authKey = args.authKey;
var userIp = args.userIp || null;

var result = validateToken(signedUrl, authKey, userIp);

console.log("\n" + "=".repeat(70));
console.log("  ASCDN TOKEN VALIDATION REPORT");
console.log("=".repeat(70));

console.log("\n📋 Parsed URL Components:");
console.log("  Token type:       " + (result.details.isDirectory ? "Directory-based (bcdn_token)" : "Query parameter (?token=)"));
console.log("  Token:            " + result.details.token);
console.log("  Token Path:       " + result.details.tokenPath);
console.log("  Ignore Params:    " + result.details.tokenIgnoreParams);
console.log("  Expires:          " + result.details.expires + " (" + result.details.expiresDate + ")");
console.log("  Resource Path:    " + result.details.resourcePath);

console.log("\n⏱   Expiration Check:");
console.log("  Current time:     " + result.details.currentTime + " (" + new Date(result.details.currentTime * 1000).toISOString() + ")");
console.log("  Is expired:       " + (result.details.isExpired ? "YES ✗" : "NO ✓"));

console.log("\n🔐 Hash Recomputation:");
console.log("  Hashable base:    " + result.details.hashableBase);
console.log("  Expected token:   " + result.details.token);
console.log("  Computed token:   " + result.details.computedToken);
console.log("  Match:            " + (result.details.computedToken === result.details.token ? "YES ✓" : "NO ✗"));

console.log("\n" + "=".repeat(70));
if (result.valid) {
	console.log("  ✓ VALID — Token passes all checks");
} else {
	console.log("  ✗ INVALID — " + result.reason);
}
console.log("=".repeat(70) + "\n");

// Exit code reflects validation result (0 = valid, 1 = invalid)
if (!result.valid) {
	process.exitCode = 1;
}

// Live CDN check (unless --no-live was passed)
if (args.noLive) {
	console.log("🌐 Live CDN Check: skipped (--no-live)");
	console.log("");
} else {
	(async function liveCheck() {
		console.log("🌐 Live CDN Check (HTTP HEAD)...");
		try {
			var start = Date.now();
			var response = await fetch(signedUrl, { method: "HEAD", redirect: "follow" });
			var elapsed = Date.now() - start;
			console.log("  Status:    " + response.status + " " + response.statusText);
			console.log("  Time:      " + elapsed + "ms");
			if (response.status === 200) {
				console.log("  Result:    ✓ CDN accepted the token");
			} else if (response.status === 403) {
				console.log("  Result:    ✗ CDN rejected the token (Forbidden — token invalid, expired, geo-blocked, or IP mismatch)");
			} else if (response.status === 404) {
				console.log("  Result:    ⚠️  Token accepted but resource not found (404)");
				console.log("             The token passed authentication, but the file at this path does not exist on the CDN.");
				console.log("             Check that the resource path is correct: " + result.details.resourcePath);
			} else {
				console.log("  Result:    ⚠️  Unexpected status code");
			}
		} catch (err) {
			console.log("  Error: " + err.message);
			console.log("  (This is expected if the CDN requires a different HTTP method or the resource is not directly fetchable)");
		}
		console.log("");
	})();
}