import test from 'node:test';
import assert from 'node:assert/strict';

import { stage3LLMMenu, stage3LLMAllergy } from './stage3_llm.js';

test('stage3_llm can be imported without loading the full natural sentiment stack', async () => {
  assert.equal(typeof stage3LLMMenu, 'function');
  assert.equal(typeof stage3LLMAllergy, 'function');
});
