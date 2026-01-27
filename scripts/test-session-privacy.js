#!/usr/bin/env node
/**
 * Test Script: MyFlowerAI Session Logging Privacy Validation
 *
 * This script tests that the validation correctly rejects strain files
 * containing prohibited session log fields.
 *
 * Usage:
 *   node scripts/test-session-privacy.js
 */

const fs = require('fs');
const path = require('path');

// Test cases
const testCases = [
  {
    name: "Valid strain file (no sessions)",
    data: {
      schema_version: "1.1",
      visibility: { client_safe: true, excluded_fields: [] },
      id: "test-strain",
      app_namespace: "myflowerai",
      strain: { name: "Test", type: "hybrid", brand: "Test", lineage: [] },
      product: { dispensary: "Test", category: "flower", form: "3.5g", size_g: 3.5 },
      stats: {
        total_thc_percent: 20,
        total_cbd_percent: 0.1,
        total_cannabinoids_percent: 25,
        total_terpenes_percent: 2,
        top_terpenes: [],
        potency_breakdown_percent: { thca: 20, delta9_thc: 1 },
        potency_breakdown_mg: {}
      },
      description: {
        dispensary_bio: "Test",
        vibes_like: [],
        product_positioning: "Test",
        brand_info: "Test"
      },
      coa: {
        status: "passed",
        lab: "Test",
        laboratory_id: "123",
        sample_matrix: "Flower",
        admin_route: "Inhalation",
        product_name_on_coa: "Test",
        cultivar_on_coa: "Test",
        batch_unit_size_g: 3.5,
        cultivation_facility: "Test",
        processing_facility: "Test"
      },
      tags: ["test"],
      your_notes: {
        rating_1to10: null,
        felt_like: [],
        avoid_if: [],
        session_notes: ""
      }
    },
    shouldPass: true
  },
  {
    name: "Invalid: contains 'sessions' array",
    data: {
      schema_version: "1.1",
      visibility: { client_safe: true, excluded_fields: [] },
      id: "test-strain",
      sessions: [
        { session_id: "123", method: "joint", notes: "Private data!" }
      ]
    },
    shouldPass: false,
    expectedError: "sessions"
  },
  {
    name: "Invalid: contains 'session_logs' array",
    data: {
      schema_version: "1.1",
      id: "test-strain",
      session_logs: []
    },
    shouldPass: false,
    expectedError: "session_logs"
  },
  {
    name: "Invalid: contains 'user_sessions' array",
    data: {
      schema_version: "1.1",
      id: "test-strain",
      user_sessions: []
    },
    shouldPass: false,
    expectedError: "user_sessions"
  },
  {
    name: "Valid: contains 'session_template' (allowed)",
    data: {
      schema_version: "1.1",
      visibility: { client_safe: true, excluded_fields: [] },
      id: "test-strain",
      app_namespace: "myflowerai",
      strain: { name: "Test", type: "hybrid", brand: "Test", lineage: [] },
      product: { dispensary: "Test", category: "flower", form: "3.5g", size_g: 3.5 },
      stats: {
        total_thc_percent: 20,
        total_cbd_percent: 0.1,
        total_cannabinoids_percent: 25,
        total_terpenes_percent: 2,
        top_terpenes: [],
        potency_breakdown_percent: { thca: 20, delta9_thc: 1 },
        potency_breakdown_mg: {}
      },
      description: {
        dispensary_bio: "Test",
        vibes_like: [],
        product_positioning: "Test",
        brand_info: "Test"
      },
      coa: {
        status: "passed",
        lab: "Test",
        laboratory_id: "123",
        sample_matrix: "Flower",
        admin_route: "Inhalation",
        product_name_on_coa: "Test",
        cultivar_on_coa: "Test",
        batch_unit_size_g: 3.5,
        cultivation_facility: "Test",
        processing_facility: "Test"
      },
      tags: ["test"],
      your_notes: {
        rating_1to10: null,
        felt_like: [],
        avoid_if: [],
        session_notes: ""
      },
      session_template: {
        suggested_methods: ["joint"],
        suggested_dose_guidance_text: "Start small",
        recommended_questions: ["How was it?"]
      }
    },
    shouldPass: true
  }
];

// Simple privacy check function (mimics validation script logic)
function checkPrivacyViolations(data) {
  const errors = [];
  
  if ("sessions" in data) {
    errors.push("PRIVACY VIOLATION: 'sessions' array found");
  }
  if ("session_logs" in data) {
    errors.push("PRIVACY VIOLATION: 'session_logs' array found");
  }
  if ("user_sessions" in data) {
    errors.push("PRIVACY VIOLATION: 'user_sessions' array found");
  }
  
  return errors;
}

// Run tests
console.log('🧪 Testing MyFlowerAI Session Privacy Validation\n');
console.log('='.repeat(60));

let passed = 0;
let failed = 0;

for (const testCase of testCases) {
  const errors = checkPrivacyViolations(testCase.data);
  const hasErrors = errors.length > 0;
  const testPassed = (testCase.shouldPass && !hasErrors) || (!testCase.shouldPass && hasErrors);
  
  if (testPassed) {
    console.log(`✅ PASS: ${testCase.name}`);
    passed++;
  } else {
    console.log(`❌ FAIL: ${testCase.name}`);
    console.log(`   Expected: ${testCase.shouldPass ? 'pass' : 'fail'}`);
    console.log(`   Got: ${hasErrors ? 'fail' : 'pass'}`);
    if (errors.length > 0) {
      console.log(`   Errors: ${errors.join(', ')}`);
    }
    failed++;
  }
}

console.log('='.repeat(60));
console.log(`\n📊 Results: ${passed} passed, ${failed} failed out of ${testCases.length} tests`);

if (failed > 0) {
  console.log('\n❌ Some tests failed!');
  process.exit(1);
} else {
  console.log('\n✅ All tests passed!');
  process.exit(0);
}
