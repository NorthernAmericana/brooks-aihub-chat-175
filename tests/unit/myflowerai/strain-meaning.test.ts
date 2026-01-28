/**
 * Unit tests for MyFlowerAI Strain Meaning Utility
 *
 * Tests the deterministic derivation of meaning tags from strain data.
 */

import {
	deriveStrainMeaning,
	ensureStrainMeaning,
	getRecommendedTagsFromMeaning,
} from "@/lib/myflowerai/strain/meaning";

// Test 1: Derive meaning from sativa strain type
console.log("Test 1: Derive meaning from sativa strain type");
const sativaStrain = {
	strain: {
		name: "Test Sativa",
		type: "sativa",
	},
};
const sativaMeaning = deriveStrainMeaning(sativaStrain);
console.assert(
	sativaMeaning.effect_tags.includes("uplifting"),
	"Sativa should have uplifting effect",
);
console.assert(
	sativaMeaning.effect_tags.includes("energizing"),
	"Sativa should have energizing effect",
);
console.log("✓ Test 1 passed");

// Test 2: Derive meaning from indica strain type
console.log("Test 2: Derive meaning from indica strain type");
const indicaStrain = {
	strain: {
		name: "Test Indica",
		type: "indica",
	},
};
const indicaMeaning = deriveStrainMeaning(indicaStrain);
console.assert(
	indicaMeaning.effect_tags.includes("relaxing"),
	"Indica should have relaxing effect",
);
console.assert(
	indicaMeaning.effect_tags.includes("calming"),
	"Indica should have calming effect",
);
console.log("✓ Test 2 passed");

// Test 3: Derive meaning from terpenes
console.log("Test 3: Derive meaning from terpenes");
const strainWithTerpenes = {
	strain: {
		name: "Test Strain",
		type: "hybrid",
	},
	stats: {
		top_terpenes: [
			{ name: "limonene", percent: 1.5 },
			{ name: "myrcene", percent: 1.2 },
		],
	},
};
const terpeneMeaning = deriveStrainMeaning(strainWithTerpenes);
console.assert(
	terpeneMeaning.effect_tags.includes("uplifting"),
	"Limonene should add uplifting effect",
);
console.assert(
	terpeneMeaning.aroma_flavor_tags.includes("citrus"),
	"Limonene should add citrus aroma",
);
console.log("✓ Test 3 passed");

// Test 4: Ensure strain meaning preserves existing meaning
console.log("Test 4: Ensure strain meaning preserves existing meaning");
const strainWithMeaning = {
	strain: {
		name: "Test Strain",
		type: "sativa",
	},
	meaning: {
		effect_tags: ["custom-effect"],
		aroma_flavor_tags: ["custom-aroma"],
	},
};
const preserved = ensureStrainMeaning(strainWithMeaning);
console.assert(
	preserved.meaning.effect_tags.includes("custom-effect"),
	"Existing meaning should be preserved",
);
console.log("✓ Test 4 passed");

// Test 5: Get recommended tags combines effect and aroma
console.log("Test 5: Get recommended tags combines effect and aroma");
const meaning = {
	effect_tags: ["relaxing", "calming"],
	aroma_flavor_tags: ["citrus", "pine"],
};
const tags = getRecommendedTagsFromMeaning(meaning);
console.assert(tags.length === 4, "Should combine all tags");
console.assert(
	tags.includes("relaxing") && tags.includes("citrus"),
	"Should include both effect and aroma tags",
);
console.log("✓ Test 5 passed");

console.log("\n✅ All strain meaning tests passed!");
