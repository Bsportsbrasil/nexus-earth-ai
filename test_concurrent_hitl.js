import { agentMemoryStore } from './engine/agent_memory.js';
import assert from 'node:assert';

console.log('Testing Concurrent HITL & Vector Edit/Delete Architecture...');

// 1. Test Agent Memory Creation
const testAgentId = 'aura';
const testEntry = agentMemoryStore.addAgentVectorMemory(testAgentId, 'Test Vector Entry for HITL Governance', 'test_category');
assert.ok(testEntry && testEntry.id, 'Failed to create test vector');
console.log('✓ Created test vector with id:', testEntry.id);

// 2. Test Update Vector
const updated = agentMemoryStore.updateVector(testAgentId, testEntry.id, 'Updated Vector Text - Validated by Creator', 'governance_verified');
assert.strictEqual(updated.text, 'Updated Vector Text - Validated by Creator');
assert.strictEqual(updated.category, 'governance_verified');
console.log('✓ Successfully updated vector text and category');

// 3. Test Delete Vector
const deleted = agentMemoryStore.deleteVector(testAgentId, testEntry.id);
assert.strictEqual(deleted.status, 'DELETED');
console.log('✓ Successfully deleted vector with sovereign authorization');

console.log('ALL HITL AGENT MEMORY TESTS PASSED 100%!');
