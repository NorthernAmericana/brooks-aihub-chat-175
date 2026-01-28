/**
 * Unit tests for MyFlowerAI Image Generation Safety Module
 *
 * Tests the safety filtering logic for user vibe text.
 */

import {
	containsBlockedContent,
	scrubVibeText,
	validateVibeText,
} from "@/lib/myflowerai/image/safety";

// Test 1: Safe content should pass
console.log("Test 1: Safe content should pass");
const safeText = "cosmic underwater dreams";
console.assert(
	!containsBlockedContent(safeText),
	"Safe text should not be blocked",
);
const scrubbed1 = scrubVibeText(safeText);
console.assert(
	scrubbed1 === safeText,
	`Safe text should be unchanged: expected "${safeText}", got "${scrubbed1}"`,
);
console.log("✓ Test 1 passed");

// Test 2: Illegal sale content should be blocked
console.log("Test 2: Illegal sale content should be blocked");
const illegalSale = "for sale to customers";
console.assert(
	containsBlockedContent(illegalSale),
	"Illegal sale text should be blocked",
);
const scrubbed2 = scrubVibeText(illegalSale);
console.assert(
	scrubbed2 !== illegalSale,
	"Illegal sale text should be replaced with fallback",
);
console.log("✓ Test 2 passed");

// Test 3: Minor-related content should be blocked
console.log("Test 3: Minor-related content should be blocked");
const minorText = "fun for kids and children";
console.assert(
	containsBlockedContent(minorText),
	"Minor-related text should be blocked",
);
console.log("✓ Test 3 passed");

// Test 4: Hard drug references should be blocked
console.log("Test 4: Hard drug references should be blocked");
const drugText = "like cocaine and heroin vibes";
console.assert(
	containsBlockedContent(drugText),
	"Hard drug text should be blocked",
);
console.log("✓ Test 4 passed");

// Test 5: Weapon references should be blocked
console.log("Test 5: Weapon references should be blocked");
const weaponText = "gun and weapon imagery";
console.assert(
	containsBlockedContent(weaponText),
	"Weapon text should be blocked",
);
console.log("✓ Test 5 passed");

// Test 6: Medical claims should be blocked
console.log("Test 6: Medical claims should be blocked");
const medicalText = "cures pain and treats anxiety";
console.assert(
	containsBlockedContent(medicalText),
	"Medical claims should be blocked",
);
console.log("✓ Test 6 passed");

// Test 7: Empty text should return neutral fallback
console.log("Test 7: Empty text should return neutral fallback");
const emptyText = "";
const scrubbed7 = scrubVibeText(emptyText);
console.assert(
	scrubbed7.length > 0,
	"Empty text should return non-empty fallback",
);
console.log("✓ Test 7 passed");

// Test 8: Validation function should provide reason for blocked content
console.log("Test 8: Validation function should provide reason");
const validation = validateVibeText("selling to kids");
console.assert(!validation.isValid, "Validation should fail for blocked content");
console.assert(
	validation.reason?.length > 0,
	"Validation should provide a reason",
);
console.log("✓ Test 8 passed");

// Test 9: Long text should be truncated
console.log("Test 9: Long text should be truncated to 200 chars");
const longText = "a".repeat(300);
const scrubbed9 = scrubVibeText(longText);
console.assert(
	scrubbed9.length <= 200,
	`Long text should be truncated: length is ${scrubbed9.length}`,
);
console.log("✓ Test 9 passed");

console.log("\n✅ All safety tests passed!");
