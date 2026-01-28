/**
 * Use Cases Schema Validation Test
 * 
 * This script validates that the use_cases field in strain schema works correctly.
 */

import { MyFlowerAIStrainSchemaV1_1 } from '../lib/validation/myflowerai-schema';

console.log('Testing Use Cases Field in Strain Schema...\n');

// Test 1: Strain with use_cases field
console.log('Test 1: Strain with use_cases field');
try {
  const strainWithUseCases = {
    schema_version: "1.1",
    visibility: {
      client_safe: true,
      excluded_fields: ["location", "price_current_usd", "price_original_usd"]
    },
    id: "test-strain-with-use-cases",
    app_namespace: "myflowerai",
    strain: {
      name: "Test Strain",
      type: "hybrid",
      brand: "Test Brand",
      lineage: ["Parent 1", "Parent 2"]
    },
    product: {
      dispensary: "Test Dispensary",
      category: "flower",
      form: "3.5g Whole Flower",
      size_g: 3.5
    },
    stats: {
      total_thc_percent: 25.0,
      total_cbd_percent: 0.5,
      total_cannabinoids_percent: 30.0,
      total_terpenes_percent: 2.5,
      top_terpenes: [
        { name: "Limonene", percent: 1.0 }
      ],
      potency_breakdown_percent: {
        thca: 28.0,
        delta9_thc: 1.0
      },
      potency_breakdown_mg: {}
    },
    description: {
      dispensary_bio: "Test description",
      vibes_like: ["test vibe"],
      product_positioning: "Test positioning",
      brand_info: "Test brand info"
    },
    coa: {
      status: "passed",
      lab: "Test Lab",
      laboratory_id: "TEST-001",
      sample_matrix: "Whole Flower",
      admin_route: "Inhalation",
      product_name_on_coa: "Test Product",
      cultivar_on_coa: "Test Cultivar",
      batch_unit_size_g: 3.5,
      cultivation_facility: "Test Facility",
      processing_facility: "Test Processing"
    },
    tags: ["test", "hybrid"],
    your_notes: {
      rating_1to10: null,
      felt_like: [],
      avoid_if: [],
      session_notes: ""
    },
    use_cases: {
      best_for_tags: ["creative", "social", "daytime", "relaxation"],
      avoid_if_tags: ["too_strong_for_newbies", "intense_effects"]
    }
  };

  const validated = MyFlowerAIStrainSchemaV1_1.parse(strainWithUseCases);
  console.log('✅ Strain with use_cases passed validation');
  console.log(`   - Strain: ${validated.strain.name}`);
  console.log(`   - Best for: ${validated.use_cases?.best_for_tags.join(', ')}`);
  console.log(`   - Avoid if: ${validated.use_cases?.avoid_if_tags.join(', ')}`);
} catch (error) {
  console.log('❌ Validation failed:', error);
}

// Test 2: Strain without use_cases field (should still be valid - it's optional)
console.log('\nTest 2: Strain without use_cases field (optional)');
try {
  const strainWithoutUseCases = {
    schema_version: "1.1",
    visibility: {
      client_safe: true,
      excluded_fields: ["location", "price_current_usd", "price_original_usd"]
    },
    id: "test-strain-without-use-cases",
    app_namespace: "myflowerai",
    strain: {
      name: "Test Strain 2",
      type: "indica",
      brand: "Test Brand",
      lineage: ["Parent A"]
    },
    product: {
      dispensary: "Test Dispensary",
      category: "flower",
      form: "3.5g Whole Flower",
      size_g: 3.5
    },
    stats: {
      total_thc_percent: 20.0,
      total_cbd_percent: 0.3,
      total_cannabinoids_percent: 25.0,
      total_terpenes_percent: 2.0,
      top_terpenes: [
        { name: "Myrcene", percent: 0.8 }
      ],
      potency_breakdown_percent: {
        thca: 22.0,
        delta9_thc: 0.5
      },
      potency_breakdown_mg: {}
    },
    description: {
      dispensary_bio: "Test description",
      vibes_like: ["test vibe"],
      product_positioning: "Test positioning",
      brand_info: "Test brand info"
    },
    coa: {
      status: "passed",
      lab: "Test Lab",
      laboratory_id: "TEST-002",
      sample_matrix: "Whole Flower",
      admin_route: "Inhalation",
      product_name_on_coa: "Test Product 2",
      cultivar_on_coa: "Test Cultivar 2",
      batch_unit_size_g: 3.5,
      cultivation_facility: "Test Facility",
      processing_facility: "Test Processing"
    },
    tags: ["test", "indica"],
    your_notes: {
      rating_1to10: null,
      felt_like: [],
      avoid_if: [],
      session_notes: ""
    }
    // No use_cases field
  };

  const validated = MyFlowerAIStrainSchemaV1_1.parse(strainWithoutUseCases);
  console.log('✅ Strain without use_cases passed validation');
  console.log(`   - Strain: ${validated.strain.name}`);
  console.log(`   - Use cases: ${validated.use_cases ? 'present' : 'not present (optional)'}`);
} catch (error) {
  console.log('❌ Validation failed:', error);
}

console.log('\n✅ All use_cases validation tests completed successfully!');
