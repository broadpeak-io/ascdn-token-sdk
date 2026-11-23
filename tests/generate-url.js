// Usage:
//   node tests/generate-url.js
//   node tests/generate-url.js --url "<cdnUrl>" --authKey "<authKey>" [options]

var { signUrl } = require("../src/token.js");
var defaults = require("./token-defaults.js");
var args = {};
var noArguments = process.argv.length === 2;

for (var i = 2; i < process.argv.length; i++) {
	var arg = process.argv[i];
	var next = process.argv[i + 1];

	if (arg === "--url" || arg === "-u") {
		args.url = next; i++;
	} else if (arg === "--authKey" || arg === "-k") {
		args.authKey = next; i++;
	} else if (arg === "--expiration" || arg === "-e") {
		args.expirationTime = next; i++;
	} else if (arg === "--userIp" || arg === "-i") {
		args.userIp = next; i++;
	} else if (arg === "--directory" || arg === "-d") {
		args.isDirectory = true;
	} else if (arg === "--pathAllowed" || arg === "-p") {
		args.pathAllowed = next; i++;
	} else if (arg === "--countriesAllowed" || arg === "-a") {
		args.countriesAllowed = next; i++;
	} else if (arg === "--countriesBlocked" || arg === "-b") {
		args.countriesBlocked = next; i++;
	} else if (arg === "--ignoreParams" || arg === "-g") {
		args.ignoreParams = true;
	} else if (arg === "--help" || arg === "-h") {
		args.help = true;
	} else {
		console.error("Unknown option: " + arg);
		console.error("Run with --help for usage.");
		process.exit(1);
	}
}

if (args.help) {
	console.log("");
	console.log("ASCDN Token Generator");
	console.log("");
	console.log("Usage:");
	console.log("  node tests/generate-url.js");
	console.log("  node tests/generate-url.js --url <cdnUrl> --authKey <key> [options]");
	console.log("");
	console.log("With no arguments, uses the sample URL, key, and signing settings from tests/token.test.js.");
	console.log("The sample authKey is for demonstration only; use your own key for real CDN resources.");
	console.log("When any arguments are provided, --url and --authKey (or CDN_AUTH_KEY) are required.");
	console.log("");
	console.log("Options:");
	console.log("  --url, -u <url>                  CDN resource URL");
	console.log("  --authKey, -k <key>              CDN authKey (or set CDN_AUTH_KEY)");
	console.log("  --expiration, -e <seconds>       Token validity (default: 7200)");
	console.log("  --userIp, -i <ip>                Bind token to a user IP");
	console.log("  --directory, -d                  Put the token in the URL path");
	console.log("  --pathAllowed, -p <path>         Allowed path (default: /)");
	console.log("  --countriesAllowed, -a <list>    Comma-separated allowed countries (default: CA,US)");
	console.log("  --countriesBlocked, -b <list>    Comma-separated blocked countries (default: JP)");
	console.log("  --ignoreParams, -g               Ignore query parameters");
	console.log("  --help, -h                       Show this help");
	console.log("");
	process.exit(0);
}

var url = noArguments ? defaults.baseUrl : args.url;
var authKey = args.authKey || process.env.CDN_AUTH_KEY || (noArguments ? defaults.authKey : null);

if (!url || !authKey) {
	console.error("Both --url and --authKey (or CDN_AUTH_KEY) are required when arguments are provided.");
	console.error("Run with --help for usage.");
	process.exit(1);
}

var expirationTime = args.expirationTime === undefined ? defaults.expirationTime : Number(args.expirationTime);
if (!Number.isInteger(expirationTime) || expirationTime <= 0) {
	console.error("--expiration must be a positive whole number of seconds.");
	process.exit(1);
}

var signedUrl = signUrl(
	url,
	authKey,
	expirationTime,
	args.userIp === undefined ? defaults.userIp : args.userIp,
	args.isDirectory === undefined ? defaults.isDirectory : args.isDirectory,
	args.pathAllowed === undefined ? defaults.pathAllowed : args.pathAllowed,
	args.countriesAllowed === undefined ? defaults.countriesAllowed : args.countriesAllowed,
	args.countriesBlocked === undefined ? defaults.countriesBlocked : args.countriesBlocked,
	args.ignoreParams === undefined ? defaults.ignoreParams : args.ignoreParams
);

var token = args.isDirectory
	? (signedUrl.match(/\/bcdn_token=([^/&]+)/) || [])[1]
	: new URL(signedUrl).searchParams.get("token");

console.log("Signed URL:");
console.log(signedUrl);
console.log("\nToken:");
console.log(token);
