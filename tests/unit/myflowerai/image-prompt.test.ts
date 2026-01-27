/**
 * Unit tests for MyFlowerAI Image Generation Prompt Composer
 *
 * Tests the prompt composition logic for strain-based image generation.
 */

import {
	composeImagePrompt,
	generateImageTitle,
	validatePrompt,
	type PersonaProfile,
	type StrainData,
	type VibeSettings,
} from "@/lib/myflowerai/image/prompt-composer";

// Test strain data
const testStrain: StrainData = {
	strain: {
		name: "Test Strain",
		type: "hybrid",
	},
	meaning: {
		aroma_flavor_tags: ["citrus", "pine", "earthy"],
		effect_tags: ["uplifting", "relaxing", "creative"],
		dominant_terpenes: ["limonene", "pinene", "myrcene"],
		minor_cannabinoids_present: ["CBG", "CBC"],
		disclaimers: [],
	},
};

const sativaStrain: StrainData = {
	strain: {
		name: "Energize",
		type: "sativa",
	},
	meaning: {
		aroma_flavor_tags: ["citrus"],
		effect_tags: ["energizing"],
		dominant_terpenes: [],
		minor_cannabinoids_present: [],
		disclaimers: [],
	},
};

const indicaStrain: StrainData = {
	strain: {
		name: "Relax",
		type: "indica",
	},
	meaning: {
		aroma_flavor_tags: ["earthy"],
		effect_tags: ["relaxing"],
		dominant_terpenes: [],
		minor_cannabinoids_present: [],
		disclaimers: [],
	},
};

const testPersona: PersonaProfile = {
	persona_id: "test-persona",
	display_name: "Test Persona",
	image_style_keywords: ["neon colors", "geometric shapes"],
};

const testVibeSettings: VibeSettings = {
	intensity: 7,
	neon: 8,
	nature: 3,
	surreal: 9,
	chaos: 6,
};

// Test 1: Basic prompt generation
console.log("Test 1: Basic prompt generation");
const prompt1 = composeImagePrompt(testStrain);
console.assert(
	prompt1.includes("Abstract psychedelic art"),
	"Prompt should start with art style",
);
console.assert(
	prompt1.includes("balanced harmonious composition"),
	"Hybrid strain should have balanced composition",
);
console.assert(
	prompt1.includes("No text, no labels, no branding"),
	"Prompt should include constraints",
);
console.log("✓ Test 1 passed");

// Test 2: Sativa strain influence
console.log("Test 2: Sativa strain should have upward energy");
const prompt2 = composeImagePrompt(sativaStrain);
console.assert(
	prompt2.includes("energetic upward flowing patterns"),
	"Sativa should have upward flowing patterns",
);
console.log("✓ Test 2 passed");

// Test 3: Indica strain influence
console.log("Test 3: Indica strain should have relaxing waves");
const prompt3 = composeImagePrompt(indicaStrain);
console.assert(
	prompt3.includes("deep relaxing waves and soft gradients"),
	"Indica should have relaxing waves",
);
console.log("✓ Test 3 passed");

// Test 4: Persona adds style keywords
console.log("Test 4: Persona should add style keywords");
const prompt4 = composeImagePrompt(testStrain, testPersona);
console.assert(
	prompt4.includes("neon colors") || prompt4.includes("geometric shapes"),
	"Prompt should include persona style keywords",
);
console.log("✓ Test 4 passed");

// Test 5: Vibe settings affect prompt
console.log("Test 5: Vibe settings should affect prompt");
const prompt5 = composeImagePrompt(
	testStrain,
	undefined,
	testVibeSettings,
	undefined,
);
console.assert(
	prompt5.includes("bold") || prompt5.includes("vivid"),
	"High intensity should result in bold/vivid description",
);
console.assert(
	prompt5.includes("neon"),
	"High neon setting should add neon description",
);
console.log("✓ Test 5 passed");

// Test 6: User vibe text is included
console.log("Test 6: User vibe text should be included");
const prompt6 = composeImagePrompt(
	testStrain,
	undefined,
	undefined,
	"cosmic space vibes",
);
console.assert(
	prompt6.includes("cosmic space vibes"),
	"User vibe text should be included",
);
console.log("✓ Test 6 passed");

// Test 7: Prompt length limit
console.log("Test 7: Prompt should not exceed max length");
const longVibeText = "a".repeat(500);
const prompt7 = composeImagePrompt(
	testStrain,
	testPersona,
	testVibeSettings,
	longVibeText,
);
console.assert(
	prompt7.length <= 1003,
	`Prompt should be truncated: length is ${prompt7.length}`,
); // 1000 + "..."
console.log("✓ Test 7 passed");

// Test 8: Title generation
console.log("Test 8: Title generation");
const title1 = generateImageTitle(testStrain);
console.assert(
	title1.includes("Test Strain"),
	"Title should include strain name",
);
console.assert(title1.includes("hybrid"), "Title should include strain type");
const title2 = generateImageTitle(testStrain, testPersona);
console.assert(
	title2.includes("Test Persona"),
	"Title with persona should include persona name",
);
console.log("✓ Test 8 passed");

// Test 9: Prompt validation - safe prompt
console.log("Test 9: Prompt validation should pass for safe content");
const safePrompt = "Abstract art with flowing colors and shapes";
const validation1 = validatePrompt(safePrompt);
console.assert(validation1.isValid, "Safe prompt should be valid");
console.assert(
	validation1.issues.length === 0,
	"Safe prompt should have no issues",
);
console.log("✓ Test 9 passed");

// Test 10: Prompt validation - unsafe content
console.log("Test 10: Prompt validation should fail for forbidden content");
const unsafePrompt1 = "A person's face with branding";
const validation2 = validatePrompt(unsafePrompt1);
console.assert(!validation2.isValid, "Unsafe prompt should be invalid");
console.assert(
	validation2.issues.length > 0,
	"Unsafe prompt should have issues",
);
console.log("✓ Test 10 passed");

console.log("\n✅ All prompt composer tests passed!");
