/**
 * Turn Axios/network failures into safe, actionable messages for the UI.
 * @param {unknown} error
 * @param {'login' | 'request'} [context]
 */
export function getApiErrorMessage(error, context = 'request') {
  if (!error || typeof error !== 'object') {
    return 'The request could not be completed. Please try again.';
  }

  const failure = /** @type {{ response?: { status?: number, data?: { message?: unknown } }, code?: string }} */ (error);
  const status = failure.response?.status;
  const serverMessage = failure.response?.data?.message;

  if (status === 401) {
    return context === 'login'
      ? 'Email or password is incorrect.'
      : 'Your session is invalid or has expired. Please sign in again.';
  }
  if (status === 403) return 'You do not have permission to perform this action.';
  if (status && status >= 500) return 'The StaffSync server encountered an error. Please try again shortly.';
  if (status && typeof serverMessage === 'string') return serverMessage;
  if (status) return `The StaffSync API rejected the request (HTTP ${status}).`;

  if (failure.code === 'ECONNABORTED' || failure.code === 'ETIMEDOUT') {
    return 'The request to StaffSync timed out. Check the API and try again.';
  }

  // Browsers intentionally expose CORS failures and connection failures the same way.
  // Avoid claiming which one occurred; point the user to both relevant checks.
  return 'The browser could not reach the StaffSync API. Confirm the backend is running and that its CORS settings allow this frontend origin.';
}
