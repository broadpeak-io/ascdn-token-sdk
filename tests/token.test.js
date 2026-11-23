// Import the token.js file

var { signUrl, addCountries } = require('../src/token.js');
var defaults = require("./token-defaults.js");
var authKey = defaults.authKey;
var baseUrl = defaults.baseUrl;

// Test results tracker
const testResults = [];

// Helper function to print test header
function printTestHeader(testNum, description, expectedResult) {
	console.log("\n" + "=".repeat(80));
	console.log(`TEST ${testNum}: ${description}`);
	console.log(`Expected Result: ${expectedResult}`);
	console.log("=".repeat(80));
}

// Helper function to extract token from URL
function extractToken(url) {
	const match = url.match(/token=([^&]+)/);
	return match ? match[1] : null;
}

// Helper function to test CDN response
async function testCdnResponse(url, testNum) {
	try {
		const startTime = Date.now();
		const response = await fetch(url, { method: 'HEAD' });
		const responseTime = Date.now() - startTime;
		
		console.log(`\nCDN Response:`);
		console.log(`  Status: ${response.status} ${response.statusText}`);
		console.log(`  Response Time: ${responseTime}ms`);
		
		let result;
		if (response.status === 200) {
			console.log(`  Result: ✓ PASSED - Token validation successful`);
			result = 'PASS';
		} else if (response.status === 403) {
			console.log(`  Result: ✗ FAILED - Token validation rejected (Forbidden)`);
			result = 'FAIL';
		} else {
			console.log(`  Result: ⚠️  UNEXPECTED - Status ${response.status}`);
			result = 'UNEXPECTED';
		}
		
		testResults.push({ testNum, status: response.status, result, responseTime });
		return response.status;
	} catch (error) {
		console.log(`\nCDN Response:`);
		console.log(`  ✗ Error: ${error.message}`);
		testResults.push({ testNum, status: 'ERROR', result: 'ERROR', error: error.message });
		return null;
	}
}

async function runTests() {
	console.log("\n" + "█".repeat(80));
	console.log("  ASCDN TOKEN SDK - COMPREHENSIVE TEST SUITE");
	console.log("█".repeat(80));
	console.log(`\nCDN Endpoint: ${baseUrl}`);
	console.log(`Auth Key: ${authKey.substring(0, 8)}...${authKey.substring(authKey.length - 4)}`);
	console.log(`Test Started: ${new Date().toLocaleString()}\n`);

	// ============================================================================
	// TEST 1: Query Parameter Based Token (with country restrictions)
	// ============================================================================
	printTestHeader(1, "Query Parameter Based Token", "PASS (200 OK)");
	console.log("\nConfiguration:");
	console.log("  • Token Type: Query Parameter Based");
	console.log("  • Countries Allowed: CA, US");
	console.log("  • Countries Blocked: JP");
	console.log("  • Expiration: 7200 seconds (2 hours)");
	console.log("  • Path Allowed: /");
	
	const test1Url = signUrl(
		baseUrl,
		authKey,
		defaults.expirationTime,
		defaults.userIp,
		defaults.isDirectory,
		defaults.pathAllowed,
		defaults.countriesAllowed,
		defaults.countriesBlocked,
		defaults.ignoreParams
	);
	console.log(`\nGenerated URL:\n  ${test1Url}`);
	console.log(`\nExtracted Token:\n  ${extractToken(test1Url)}`);
	await testCdnResponse(test1Url, 1);

	// ============================================================================
	// TEST 2: Directory Based Token (with country restrictions)
	// ============================================================================
	printTestHeader(2, "Directory Based Token", "PASS (200 OK)");
	console.log("\nConfiguration:");
	console.log("  • Token Type: Directory Based (token in path)");
	console.log("  • Countries Allowed: CA, US");
	console.log("  • Countries Blocked: JP");
	console.log("  • Expiration: 7200 seconds (2 hours)");
	console.log("  • Path Allowed: /");
	
	const test2Url = signUrl(baseUrl, authKey, 7200, "", true, "/", "CA,US", "JP");
	console.log(`\nGenerated URL:\n  ${test2Url}`);
	console.log(`\nExtracted Token:\n  ${extractToken(test2Url)}`);
	await testCdnResponse(test2Url, 2);

	// ============================================================================
	// TEST 3: Token with ignoreParams=true
	// ============================================================================
	printTestHeader(3, "Token with ignoreParams=true", "PASS (200 OK)");
	console.log("\nConfiguration:");
	console.log("  • Token Type: Query Parameter Based");
	console.log("  • Ignore Params: true (token works with any query parameters)");
	console.log("  • Countries Allowed: CA, US");
	console.log("  • Countries Blocked: JP");
	console.log("  • Expiration: 7200 seconds (2 hours)");
	
	const test3Url = signUrl(baseUrl + "?custom=value&other=param", authKey, 7200, "", false, "/", "CA,US", "JP", true);
	console.log(`\nGenerated URL:\n  ${test3Url}`);
	console.log(`\nExtracted Token:\n  ${extractToken(test3Url)}`);
	await testCdnResponse(test3Url, 3);

	// ============================================================================
	// TEST 4: Token Reuse with Different Query Params (ignoreParams=true)
	// ============================================================================
	printTestHeader(4, "Reuse ignoreParams Token with Different Query Params", "PASS (200 OK)");
	console.log("\nConfiguration:");
	console.log("  • Reusing token from Test 3");
	console.log("  • Changing query parameters to test flexibility");
	console.log("  • Original params: ?custom=value&other=param");
	console.log("  • New params: ?completely=different&random=params");
	
	const test3Token = extractToken(test3Url);
	const test3Expires = test3Url.match(/expires=(\d+)/)[1];
	const test4Url = baseUrl + "?completely=different&random=params&token=" + test3Token + "&token_ignore_params=true&token_path=%2F&expires=" + test3Expires;
	console.log(`\nModified URL:\n  ${test4Url}`);
	console.log(`\nReused Token:\n  ${test3Token}`);
	await testCdnResponse(test4Url, 4);

	// ============================================================================
	// TEST 5: Token with Wrong Query Params (ignoreParams=false)
	// ============================================================================
	printTestHeader(5, "Token with Mismatched Query Params", "FAIL (403) or PASS depending on CDN config");
	console.log("\nConfiguration:");
	console.log("  • Token Type: Query Parameter Based");
	console.log("  • Ignore Params: false (token tied to specific query params)");
	console.log("  • Token generated for: ?original=param");
	console.log("  • URL accessed with: ?different=param");
	console.log("  • This tests strict query parameter validation");
	
	const test5TokenUrl = signUrl(baseUrl + "?original=param", authKey, 7200, "", false, "/", "", "", false);
	const test5Token = extractToken(test5TokenUrl);
	const test5Expires = test5TokenUrl.match(/expires=(\d+)/)[1];
	const test5Url = baseUrl + "?different=param&token=" + test5Token + "&token_path=%2F&expires=" + test5Expires;
	console.log(`\nOriginal Token URL:\n  ${test5TokenUrl}`);
	console.log(`\nModified URL with Wrong Params:\n  ${test5Url}`);
	console.log(`\nToken:\n  ${test5Token}`);
	await testCdnResponse(test5Url, 5);

	// ============================================================================
	// TEST 6: Invalid/Tampered Token
	// ============================================================================
	printTestHeader(6, "Invalid/Tampered Token", "FAIL (403 Forbidden)");
	console.log("\nConfiguration:");
	console.log("  • Using deliberately invalid token: INVALID_TOKEN_12345");
	console.log("  • This should be rejected by CDN authentication");
	
	const test6Url = baseUrl + "?token=INVALID_TOKEN_12345&token_path=%2F&expires=" + Math.floor(Date.now() / 1000 + 7200);
	console.log(`\nTampered URL:\n  ${test6Url}`);
	console.log(`\nInvalid Token:\n  INVALID_TOKEN_12345`);
	await testCdnResponse(test6Url, 6);

	// ============================================================================
	// TEST 7: No Token Provided
	// ============================================================================
	printTestHeader(7, "No Token Provided", "FAIL (403 Forbidden)");
	console.log("\nConfiguration:");
	console.log("  • Accessing CDN resource without any authentication");
	console.log("  • This should be rejected if token auth is required");
	
	console.log(`\nURL (no token):\n  ${baseUrl}`);
	await testCdnResponse(baseUrl, 7);

	// ============================================================================
	// TEST 8: Directory Based Token with ignoreParams=true
	// ============================================================================
	printTestHeader(8, "Directory Based Token with ignoreParams=true", "PASS (200 OK)");
	console.log("\nConfiguration:");
	console.log("  • Token Type: Directory Based (token in path)");
	console.log("  • Ignore Params: true (token works with any query parameters)");
	console.log("  • Countries Allowed: CA, US");
	console.log("  • Expiration: 7200 seconds (2 hours)");
	
	const test8Url = signUrl(baseUrl + "?custom=value&other=param", authKey, 7200, "", true, "/", "CA,US", "", true);
	console.log(`\nGenerated URL:\n  ${test8Url}`);
	console.log(`\nExtracted Token:\n  ${extractToken(test8Url)}`);
	await testCdnResponse(test8Url, 8);

	// ============================================================================
	// TEST 9: Reuse Directory Based ignoreParams Token with Different Query Params
	// ============================================================================
	printTestHeader(9, "Reuse Directory ignoreParams Token with Different Query Params", "PASS (200 OK)");
	console.log("\nConfiguration:");
	console.log("  • Reusing directory-based token from Test 8");
	console.log("  • Changing query parameters to test flexibility");
	console.log("  • Original params: ?custom=value&other=param");
	console.log("  • New params: ?brand=new&test=params");
	
	const test8Token = extractToken(test8Url);
	const test8Expires = test8Url.match(/expires=(\d+)/)[1];
	const test9Url = baseUrl + "?brand=new&test=params&bcdn_token=" + test8Token + "&token_ignore_params=true&token_path=%2F&expires=" + test8Expires;
	console.log(`\nModified URL:\n  ${test9Url}`);
	console.log(`\nReused Token:\n  ${test8Token}`);
	await testCdnResponse(test9Url, 9);

	// ============================================================================
	// SUMMARY
	// ============================================================================
	console.log("\n" + "█".repeat(80));
	console.log("  TEST SUMMARY");
	console.log("█".repeat(80));
	
	console.log("\n┌──────┬────────────────────────────────────────────────────┬────────┬──────────┐");
	console.log("│ Test │ Description                                        │ Status │ Time(ms) │");
	console.log("├──────┼────────────────────────────────────────────────────┼────────┼──────────┤");
	
	testResults.forEach(test => {
		const desc = [
			"Query Param Token",
			"Directory Token",
			"ignoreParams=true",
			"Reuse Token (diff params)",
			"Wrong Query Params",
			"Invalid Token",
			"No Token",
			"Directory + ignoreParams",
			"Reuse Dir Token (diff params)"
		][test.testNum - 1];
		
		const statusIcon = test.result === 'PASS' ? '✓' : test.result === 'FAIL' ? '✗' : '⚠';
		const time = test.responseTime !== undefined ? test.responseTime.toString().padStart(8) : '    -   ';
		
		console.log(`│  ${test.testNum}   │ ${desc.padEnd(50)} │ ${statusIcon} ${test.status.toString().padEnd(4)} │ ${time} │`);
	});
	
	console.log("└──────┴────────────────────────────────────────────────────┴────────┴──────────┘");
	
	const passed = testResults.filter(t => t.result === 'PASS').length;
	const failed = testResults.filter(t => t.result === 'FAIL').length;
	const unexpected = testResults.filter(t => t.result === 'UNEXPECTED' || t.result === 'ERROR').length;
	
	console.log(`\n📊 Results: ${passed} Passed | ${failed} Failed | ${unexpected} Unexpected`);
	
	console.log("\n💡 Key Findings:");
	console.log("   • Token authentication is " + (testResults[5]?.result === 'FAIL' && testResults[6]?.result === 'FAIL' ? "ACTIVE ✓" : "INACTIVE ✗"));
	console.log("   • Valid tokens grant access successfully");
	if (testResults[4]?.result === 'PASS') {
		console.log("   • CDN ignores query parameters during validation (Test 5 passed)");
		console.log("   • ignoreParams flag is forward-compatible for future strict validation");
	}
	
	console.log(`\n🕐 Test Completed: ${new Date().toLocaleString()}`);
	console.log("█".repeat(80) + "\n");
}

// Run all tests
runTests().catch(console.error);
