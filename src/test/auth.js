export function mockAuth(user, role = 'DONOR') {
  localStorage.setItem('accessToken', 'fake-jwt-token');
  localStorage.setItem('access_token', 'fake-jwt-token');
  localStorage.setItem('user', JSON.stringify({ ...user, role }));
}

export function clearAuth() {
  localStorage.clear();
}
