import test from 'node:test';
import assert from 'node:assert/strict';
import { getApiErrorMessage } from '../services/api-error.mjs';

test('login errors distinguish invalid credentials from connectivity failures', () => {
  assert.equal(
    getApiErrorMessage({ response: { status: 401 } }, 'login'),
    'Email or password is incorrect.',
  );
  assert.match(getApiErrorMessage({ code: 'ERR_NETWORK' }, 'login'), /backend is running.*CORS settings/);
});

test('request errors identify timeouts, authorization failures, and server errors safely', () => {
  assert.match(getApiErrorMessage({ code: 'ETIMEDOUT' }), /timed out/);
  assert.match(getApiErrorMessage({ response: { status: 401 } }), /session is invalid or has expired/);
  assert.match(getApiErrorMessage({ response: { status: 403 } }), /do not have permission/);
  assert.match(getApiErrorMessage({ response: { status: 500, data: { message: 'database secret' } } }), /server encountered an error/);
});

test('safe API validation messages are surfaced for client errors', () => {
  assert.equal(
    getApiErrorMessage({ response: { status: 400, data: { message: 'Invalid request' } } }),
    'Invalid request',
  );
});

test('409 conflict responses preserve the backend safe explanation for UI display', () => {
  assert.equal(
    getApiErrorMessage({ response: { status: 409, data: { success: false, message: 'Leave dates overlap an existing request' } } }),
    'Leave dates overlap an existing request',
  );
  assert.equal(
    getApiErrorMessage({ response: { status: 409, data: { success: false, message: 'Already enrolled' } } }),
    'Already enrolled',
  );
});
