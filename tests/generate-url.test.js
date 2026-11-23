var assert = require("node:assert/strict");
var { execFileSync, spawnSync } = require("node:child_process");
var path = require("node:path");
var test = require("node:test");
var { validateToken } = require("../src/validate.js");
var defaults = require("./token-defaults.js");

var cliPath = path.join(__dirname, "generate-url.js");

function runGenerator(args) {
	return execFileSync(process.execPath, [cliPath, ...args], { encoding: "utf8" });
}

function getSignedUrl(output) {
	return output.split("Signed URL:\n")[1].split("\n")[0];
}

test("uses the sample configuration when invoked without arguments", function () {
	var output = runGenerator([]);
	var signedUrl = getSignedUrl(output);
	var parsedUrl = new URL(signedUrl);

	assert.equal(parsedUrl.origin + parsedUrl.pathname, defaults.baseUrl);
	assert.match(parsedUrl.searchParams.get("token"), /^[A-Za-z0-9_-]{43}$/);
	assert.equal(parsedUrl.searchParams.get("token_path"), defaults.pathAllowed);
	assert.equal(parsedUrl.searchParams.get("token_countries"), defaults.countriesAllowed);
	assert.equal(parsedUrl.searchParams.get("token_countries_blocked"), defaults.countriesBlocked);
	assert.ok(Number(parsedUrl.searchParams.get("expires")) > Math.floor(Date.now() / 1000));
});

test("generates a custom URL that validates", function () {
	var authKey = "test-key";
	var output = runGenerator([
		"--url", "https://example.cdn.test/video.mp4",
		"--authKey", authKey,
		"--directory",
		"--countriesAllowed", "",
		"--countriesBlocked", ""
	]);
	var signedUrl = getSignedUrl(output);
	var result = validateToken(signedUrl, authKey);

	assert.equal(result.valid, true);
	assert.equal(result.details.isDirectory, true);
	assert.equal(output.split("Token:\n")[1].trim(), result.details.token);
});

test("requires URL and authKey when arguments are provided", function () {
	var result = spawnSync(process.execPath, [cliPath, "--url", "https://example.cdn.test/video.mp4"], {
		encoding: "utf8"
	});

	assert.equal(result.status, 1);
	assert.match(result.stderr, /--url and --authKey/);
});
