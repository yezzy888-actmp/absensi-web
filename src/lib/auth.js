// src/lib/auth.js
import { jwtDecode } from "jwt-decode";

export class AuthManager {
  static TOKEN_KEY = "token";
  static USER_KEY = "user";

  static setToken(token) {
    localStorage.setItem(this.TOKEN_KEY, token);
  }

  static getToken() {
    return localStorage.getItem(this.TOKEN_KEY);
  }

  static removeToken() {
    localStorage.removeItem(this.TOKEN_KEY);
  }

  static setUser(user) {
    localStorage.setItem(this.USER_KEY, JSON.stringify(user));
  }

  static getUser() {
    const user = localStorage.getItem(this.USER_KEY);
    return user ? JSON.parse(user) : null;
  }

  static removeUser() {
    localStorage.removeItem(this.USER_KEY);
  }

  static isAuthenticated() {
    const token = this.getToken();
    if (!token) return false;

    try {
      const decoded = jwtDecode(token);
      const currentTime = Date.now() / 1000;
      return decoded.exp > currentTime;
    } catch (error) {
      return false;
    }
  }

  static getUserRole() {
    const user = this.getUser();
    return user?.role || null;
  }

  static hasRole(role) {
    return this.getUserRole() === role;
  }

  static isAdmin() {
    return this.hasRole("ADMIN");
  }

  static isTeacher() {
    return this.hasRole("TEACHER");
  }

  static isStudent() {
    return this.hasRole("STUDENT");
  }

  // Remove the automatic redirect from logout
  static logout() {
    this.removeToken();
    this.removeUser();
    // Don't automatically redirect here - let the components handle it
  }

  static async refreshToken() {
    try {
      const response = await api.post("/auth/refresh");
      const { token } = response.data;
      this.setToken(token);
      return token;
    } catch (error) {
      this.logout();
      throw error;
    }
  }
}
