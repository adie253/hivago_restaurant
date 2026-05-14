import { HubConnection, HubConnectionBuilder, LogLevel } from '@microsoft/signalr';

const HUB_URL = `${import.meta.env.VITE_API_URL || 'https://rally-production-2004.up.railway.app'}/hubs/notifications`;


class SignalRService {
  private connection: HubConnection | null = null;
  private onNewOrderCallbacks: Array<(data: any) => void> = [];

  constructor() {
    // Note: Connection is built but not started until start() is called
  }

  public async start(): Promise<void> {
    if (this.connection && this.connection.state !== 'Disconnected') return;

    const token = localStorage.getItem('hivago_access_token') || sessionStorage.getItem('hivago_access_token');
    if (!token) {
      console.warn('No access token found, skipping SignalR start.');
      return;
    }

    this.connection = new HubConnectionBuilder()
      .withUrl(HUB_URL, {
        accessTokenFactory: () => localStorage.getItem('hivago_access_token') || sessionStorage.getItem('hivago_access_token') || '',
      })
      .withAutomaticReconnect([2000, 5000, 10000, 30000])
      .configureLogging(LogLevel.Information)
      .build();

    this.connection.on('NewOrderReceived', (data) => {
      this.onNewOrderCallbacks.forEach(cb => cb(data));
    });

    try {
      await this.connection.start();
      console.log('SignalR Connected.');
    } catch (err) {
      console.error('SignalR Connection Error: ', err);
      this.connection = null;
    }
  }

  public stop(): void {
    if (this.connection) {
      this.connection.stop();
      this.connection = null;
    }
  }

  public onNewOrder(callback: (data: any) => void): () => void {
    this.onNewOrderCallbacks.push(callback);
    return () => {
      this.onNewOrderCallbacks = this.onNewOrderCallbacks.filter(c => c !== callback);
    };
  }

  public isConnected(): boolean {
    return !!this.connection;
  }
}

export const signalRService = new SignalRService();
