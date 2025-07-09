interface ApiResponse<T = any> {
  success: boolean;
  message: string;
  data?: T;
}

class ApiClient {
  private baseURL: string;
  private onSessionExpired?: () => void;
  private isSessionExpiring: boolean = false;

  constructor(baseURL: string = '') {
    this.baseURL = baseURL;
  }

  setSessionExpiredHandler(handler: () => void) {
    this.onSessionExpired = handler;
  }

  private getAuthHeaders(): HeadersInit {
    const token = localStorage.getItem('auth_token');
    return {
      'Content-Type': 'application/json',
      ...(token && { 'Authorization': `Bearer ${token}` })
    };
  }

  private async handleResponse<T>(response: Response): Promise<ApiResponse<T>> {
    if (response.status === 401) {
      // Token expired or invalid
      if (!this.isSessionExpiring) {
        this.isSessionExpiring = true;
        this.handleSessionExpiry();
      }
      throw new Error('Session expired');
    }

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || `HTTP error ${response.status}`);
    }

    return response.json();
  }

  private handleSessionExpiry() {
    // Clear local storage
    localStorage.removeItem('auth_token');
    localStorage.removeItem('user');
    localStorage.removeItem('resetToken');
    localStorage.removeItem('resetEmail');
    
    // Trigger session expired handler
    if (this.onSessionExpired) {
      this.onSessionExpired();
    }
    
    // Reset flag after a delay
    setTimeout(() => {
      this.isSessionExpiring = false;
    }, 2000);
  }

  async get<T>(url: string): Promise<ApiResponse<T>> {
    const response = await fetch(`${this.baseURL}${url}`, {
      method: 'GET',
      headers: this.getAuthHeaders(),
    });

    return this.handleResponse<T>(response);
  }

  async post<T>(url: string, data?: any): Promise<ApiResponse<T>> {
    const response = await fetch(`${this.baseURL}${url}`, {
      method: 'POST',
      headers: this.getAuthHeaders(),
      body: data ? JSON.stringify(data) : undefined,
    });

    return this.handleResponse<T>(response);
  }

  async put<T>(url: string, data?: any): Promise<ApiResponse<T>> {
    const response = await fetch(`${this.baseURL}${url}`, {
      method: 'PUT',
      headers: this.getAuthHeaders(),
      body: data ? JSON.stringify(data) : undefined,
    });

    return this.handleResponse<T>(response);
  }

  async delete<T>(url: string): Promise<ApiResponse<T>> {
    const response = await fetch(`${this.baseURL}${url}`, {
      method: 'DELETE',
      headers: this.getAuthHeaders(),
    });

    return this.handleResponse<T>(response);
  }
}

export const apiClient = new ApiClient('/api');
export default apiClient;