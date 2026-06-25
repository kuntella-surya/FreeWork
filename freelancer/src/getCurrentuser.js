import {jwtDecode} from 'jwt-decode';

export async function getCurrentUser() {
  const token = localStorage.getItem('token');
  if (!token) return null;

  let decoded;
  try {
    decoded = jwtDecode(token);
  } catch (err) {
    console.error("Invalid token:", err);
    return null;
  }

  const userId = decoded.id;
  try {
    const res = await fetch(
      `${process.env.REACT_APP_API_URL}/api/cur/${userId}`,
      {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
      }
    );
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const user = await res.json();
    return user;
  } catch (err) {
    console.error("Error fetching current user:", err);
    return null;
  }
}
