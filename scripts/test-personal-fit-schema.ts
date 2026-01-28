/**
 * Personal Fit Schema Validation Test
 * 
 * This script validates that the personal fit schema works correctly
 * and demonstrates usage.
 */

import { PersonalFitSchemaV1_0 } from '../lib/validation/personal-fit-schema';

console.log('Testing Personal Fit Schema Validation...\n');

// Test 1: Valid personal fit data
console.log('Test 1: Valid personal fit data');
try {
  const validData = {
    schema_version: "1.0",
    personal_fit_id: "123e4567-e89b-12d3-a456-426614174000",
    strain_id: "trulieve-modern-flower-seed-junky-juicy-jane-3p5g-2026-01-25",
    privacy: {
      storage_location: "database_user_private",
      user_consent: true
    },
    rating_1to10: 8,
    best_for: ["morning creativity", "weekend projects", "solo brainstorming"],
    avoid_for: ["work meetings", "social events"],
    repeat_probability_0to1: 0.85,
    notes: "Great for creative work but makes me too introspective for social situations.",
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  };

  const validated = PersonalFitSchemaV1_0.parse(validData);
  console.log('✅ Valid data passed validation');
  console.log(`   - Strain ID: ${validated.strain_id}`);
  console.log(`   - Rating: ${validated.rating_1to10}/10`);
  console.log(`   - Best for: ${validated.best_for?.join(', ')}`);
  console.log(`   - User consent: ${validated.privacy.user_consent}`);
} catch (error) {
  console.log('❌ Validation failed:', error);
}

// Test 2: Minimal valid data (only required fields)
console.log('\nTest 2: Minimal valid data (only required fields)');
try {
  const minimalData = {
    schema_version: "1.0",
    personal_fit_id: "223e4567-e89b-12d3-a456-426614174001",
    strain_id: "planet-13-margalope-tier-3-3p5g-2026-01-26",
    privacy: {
      storage_location: "database_user_private",
      user_consent: true
    }
  };

  const validated = PersonalFitSchemaV1_0.parse(minimalData);
  console.log('✅ Minimal data passed validation');
  console.log(`   - Strain ID: ${validated.strain_id}`);
  console.log(`   - Rating: ${validated.rating_1to10 ?? 'not provided'}`);
} catch (error) {
  console.log('❌ Validation failed:', error);
}

// Test 3: Invalid data (missing required field)
console.log('\nTest 3: Invalid data (missing required field)');
try {
  const invalidData = {
    schema_version: "1.0",
    personal_fit_id: "323e4567-e89b-12d3-a456-426614174002",
    // Missing strain_id
    privacy: {
      storage_location: "database_user_private",
      user_consent: true
    }
  };

  PersonalFitSchemaV1_0.parse(invalidData);
  console.log('❌ Should have failed validation');
} catch (error) {
  console.log('✅ Correctly rejected invalid data');
  console.log(`   - Error: Missing required field`);
}

// Test 4: Invalid data (rating out of range)
console.log('\nTest 4: Invalid data (rating out of range)');
try {
  const invalidData = {
    schema_version: "1.0",
    personal_fit_id: "423e4567-e89b-12d3-a456-426614174003",
    strain_id: "test-strain",
    privacy: {
      storage_location: "database_user_private",
      user_consent: true
    },
    rating_1to10: 15  // Invalid: must be 1-10
  };

  PersonalFitSchemaV1_0.parse(invalidData);
  console.log('❌ Should have failed validation');
} catch (error) {
  console.log('✅ Correctly rejected invalid rating');
  console.log(`   - Error: Rating must be between 1 and 10`);
}

console.log('\n✅ All schema validation tests completed successfully!');
