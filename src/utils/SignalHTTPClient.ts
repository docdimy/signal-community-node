import axios, { AxiosInstance, AxiosResponse, AxiosError } from 'axios';
import { IDataObject } from 'n8n-workflow';

export interface SignalCredentials {
  baseUrl: string;
  senderNumber: string;
  deviceName?: string;
}

export interface SignalMessage {
  number: string;
  message: string;
  recipients: string[];
  groupId?: string;
  attachments?: string[];
}

export interface SignalResponse {
  timestamp: string;
  results: Array<{
    number: string;
    success: boolean;
    error?: string;
  }>;
}

export interface SignalHealthResponse {
  status: string;
  version?: string;
  timestamp: string;
}

export class SignalHTTPClient {
  private client: AxiosInstance;
  private credentials: SignalCredentials;

  constructor(credentials: SignalCredentials) {
    this.credentials = credentials;
    
    this.client = axios.create({
      baseURL: credentials.baseUrl,
      timeout: 15000, // 15 seconds timeout
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Add request interceptor for logging (without sensitive data)
    this.client.interceptors.request.use((config) => {
      console.log(`Signal API Request: ${config.method?.toUpperCase()} ${config.url}`);
      return config;
    });

    // Add response interceptor for error handling
    this.client.interceptors.response.use(
      (response) => response,
      (error: AxiosError) => {
        this.handleError(error);
        return Promise.reject(error);
      }
    );
  }

  /**
   * Send a message via Signal
   */
  async sendMessage(message: SignalMessage): Promise<SignalResponse> {
    try {
      const payload = {
        number: this.credentials.senderNumber,
        message: message.message,
        recipients: message.recipients,
        ...(message.groupId && { groupId: message.groupId }),
        ...(message.attachments && message.attachments.length > 0 && { 
          attachments: message.attachments 
        }),
      };

      const response: AxiosResponse<SignalResponse> = await this.client.post('/v2/send', payload);
      return response.data;
    } catch (error) {
      throw this.createNodeOperationError(error as AxiosError, 'Failed to send Signal message');
    }
  }

  /**
   * Send a message with attachments
   */
  async sendMessageWithAttachments(
    message: SignalMessage,
    attachments: IDataObject[]
  ): Promise<SignalResponse> {
    try {
      const formData = new FormData();
      formData.append('number', this.credentials.senderNumber);
      formData.append('message', message.message);
      formData.append('recipients', JSON.stringify(message.recipients));
      
      if (message.groupId) {
        formData.append('groupId', message.groupId);
      }

      // Add attachments
      attachments.forEach((attachment, index) => {
        if (attachment.binary && attachment.binary.data) {
          const buffer = Buffer.from(attachment.binary.data as string, 'base64');
          const blob = new Blob([buffer], { type: attachment.binary.mimeType || 'application/octet-stream' });
          formData.append(`attachments`, blob, attachment.binary.fileName || `attachment-${index}`);
        }
      });

      const response: AxiosResponse<SignalResponse> = await this.client.post('/v2/send', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      return response.data;
    } catch (error) {
      throw this.createNodeOperationError(error as AxiosError, 'Failed to send Signal message with attachments');
    }
  }

  /**
   * Receive messages (for polling)
   */
  async receiveMessages(since?: string): Promise<any[]> {
    try {
      const params: any = {};
      if (since) {
        params.since = since;
      }

      const response: AxiosResponse<any[]> = await this.client.get('/v2/receive', { params });
      return response.data;
    } catch (error) {
      throw this.createNodeOperationError(error as AxiosError, 'Failed to receive Signal messages');
    }
  }

  /**
   * Get groups list
   */
  async getGroups(): Promise<any[]> {
    try {
      const response: AxiosResponse<any[]> = await this.client.get('/v1/groups');
      return response.data;
    } catch (error) {
      throw this.createNodeOperationError(error as AxiosError, 'Failed to get Signal groups');
    }
  }

  /**
   * Health check
   */
  async healthCheck(): Promise<SignalHealthResponse> {
    try {
      const response: AxiosResponse<SignalHealthResponse> = await this.client.get('/health');
      return response.data;
    } catch (error) {
      throw this.createNodeOperationError(error as AxiosError, 'Failed to check Signal API health');
    }
  }

  /**
   * Get version information
   */
  async getVersion(): Promise<any> {
    try {
      const response: AxiosResponse<any> = await this.client.get('/v1/about');
      return response.data;
    } catch (error) {
      throw this.createNodeOperationError(error as AxiosError, 'Failed to get Signal API version');
    }
  }

  /**
   * Handle HTTP errors and convert to n8n NodeOperationError
   */
  private handleError(error: AxiosError): void {
    if (error.response) {
      // Server responded with error status
      const status = error.response.status;
      const data = error.response.data as any;
      
      let errorMessage = `HTTP ${status}`;
      if (data && data.error) {
        errorMessage += `: ${data.error}`;
      }

      switch (status) {
        case 400:
          errorMessage = `Invalid request: ${errorMessage}`;
          break;
        case 401:
          errorMessage = `Authentication failed: ${errorMessage}`;
          break;
        case 404:
          errorMessage = `Signal API endpoint not found: ${errorMessage}`;
          break;
        case 503:
          errorMessage = `Signal service unavailable: ${errorMessage}`;
          break;
        default:
          errorMessage = `Signal API error: ${errorMessage}`;
      }

      error.message = errorMessage;
    } else if (error.request) {
      // Request was made but no response received
      error.message = 'No response from Signal API - check if the service is running';
    } else {
      // Something else happened
      error.message = `Signal API request failed: ${error.message}`;
    }
  }

  /**
   * Create n8n NodeOperationError
   */
  private createNodeOperationError(error: AxiosError, defaultMessage: string): Error {
    const message = error.message || defaultMessage;
    const nodeError = new Error(message);
    nodeError.name = 'NodeOperationError';
    return nodeError;
  }

  /**
   * Retry mechanism with exponential backoff
   */
  async retryWithBackoff<T>(
    operation: () => Promise<T>,
    maxRetries: number = 3,
    baseDelay: number = 1000
  ): Promise<T> {
    let lastError: Error;

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        return await operation();
      } catch (error) {
        lastError = error as Error;
        
        if (attempt === maxRetries) {
          break;
        }

        // Don't retry on client errors (4xx)
        if (error instanceof AxiosError && error.response && error.response.status >= 400 && error.response.status < 500) {
          break;
        }

        // Wait before retrying
        const delay = baseDelay * Math.pow(2, attempt);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }

    throw lastError!;
  }
}
