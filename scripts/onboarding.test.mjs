import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';
import ts from 'typescript';

// Run the pure routing and persistence contracts without adding a test dependency.
function loadTypescript(relativePath) {
  const filename = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', relativePath);
  const source = ts.transpileModule(fs.readFileSync(filename, 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2017 },
  }).outputText;
  const evaluated = { exports: {} };
  vm.runInNewContext(source, { module: evaluated, exports: evaluated.exports, URL, Date }, { filename });
  return evaluated.exports;
}

const { resolvePostAuthRedirect, safePostAuthTarget, profileReturnTarget, profileSetupTarget } = loadTypescript('app/lib/onboarding.ts');
const { parseProfileDraft, EMPTY_PROFILE, DRAFT_LIFETIME, draftKey } = loadTypescript('app/profile/create/profileDraft.ts');
const newUser = { hasProfile: false };

for (const destination of [null, '/', '/dashboard', '/analysis/start', '/analysis/start/']) {
  test(`a new Bazi user sees the welcome step: ${destination}`, () => {
    assert.equal(resolvePostAuthRedirect(newUser, destination), '/profile/create');
  });
}
for (const destination of ['/liuyao', '/liuyao?question=work#result', '/pricing', '/history', '/admin']) {
  test(`an explicit independent destination survives login: ${destination}`, () => {
    assert.equal(resolvePostAuthRedirect(newUser, destination), destination);
  });
}
for (const destination of ['/chat?session=example', '/report', '/profile/edit', '/%63hat']) {
  test(`profile-dependent intent survives setup: ${destination}`, () => {
    const next = resolvePostAuthRedirect(newUser, destination);
    assert.ok(next.startsWith('/profile/create?next='));
    assert.equal(profileReturnTarget(new URL(next, 'https://local.invalid').searchParams.get('next')), destination);
  });
}
test('a route guard can preserve a future profile-dependent route', () => {
  assert.equal(profileSetupTarget('/future-tool?mode=deep'), '/profile/create?next=%2Ffuture-tool%3Fmode%3Ddeep');
});
test('guest report binding continues without an unnecessary profile form', () => {
  const destination = '/analysis/result/example?intent=bind_continue';
  assert.equal(resolvePostAuthRedirect(newUser, destination), destination);
});
test('existing users return directly to their destination', () => {
  assert.equal(resolvePostAuthRedirect({ hasProfile: true }, '/chat'), '/chat');
  assert.equal(resolvePostAuthRedirect({ hasProfile: true }, null), '/dashboard');
});
for (const destination of ['https://example.com', '//example.com', '/\\example.com', '/%5cexample.com', '/%2fexample.com', '/login?redirect=/chat', '/register', '/%6Cogin', '/register/', '/%']) {
  test(`reject unsafe or looping destination: ${destination}`, () => {
    assert.equal(safePostAuthTarget(destination), null);
    assert.equal(profileReturnTarget(destination), '/report');
  });
}
test('setup never redirects back to itself or the guest form after completion', () => {
  assert.equal(profileReturnTarget('/profile/create?next=/chat'), '/report');
  assert.equal(profileReturnTarget('/analysis/start/'), '/report');
});

const now = 1_800_000_000_000;
const fields = { gender: '女', calendarType: '农历', birthDate: '1990-05-06', birthTime: '10:30', birthLocation: '广州' };
const saved = (overrides = {}) => JSON.stringify({ version: 1, started: true, fields, updatedAt: now, ...overrides });
test('restore all fields and skip the completed welcome step', () => {
  const draft = parseProfileDraft(saved(), now);
  assert.equal(draft.started, true);
  assert.equal(JSON.stringify(draft.fields), JSON.stringify(fields));
});
test('account keys keep drafts isolated', () => assert.notEqual(draftKey(10), draftKey(11)));
test('expired birth details are cleared without repeating the welcome step', () => {
  const draft = parseProfileDraft(saved({ updatedAt: now - DRAFT_LIFETIME - 1 }), now);
  assert.equal(draft.started, true);
  assert.equal(JSON.stringify(draft.fields), JSON.stringify(EMPTY_PROFILE));
});
test('invalid storage is recoverable and never prepopulates malformed fields', () => {
  for (const raw of ['{', 'null', saved({ fields: null }), saved({ fields: { ...fields, birthLocation: 23 } }), saved({ updatedAt: now + 1 })]) {
    assert.equal(JSON.stringify(parseProfileDraft(raw, now).fields), JSON.stringify(EMPTY_PROFILE));
  }
});
test('fresh or incompatible drafts begin at welcome', () => {
  assert.equal(parseProfileDraft(null).started, false);
  assert.equal(parseProfileDraft(saved({ version: 2 }), now).started, false);
});
