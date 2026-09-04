import type { ContractMessage, ContractResponse } from '../types';

const HotPocket = (window as any).HotPocket;

interface PendingPromise {
  resolve: (value: any) => void;
  reject: (reason?: any) => void;
}

export default class ContractService {
  private static instance: ContractService;

  private client: any = null;
  private keyPair: unknown = null;
  private connected = false;
  private mockMode = false;

  private readonly promiseMap = new Map<string, PendingPromise>();

  private readonly servers: string[] = (import.meta.env.VITE_CONTRACT_URLS ?? '')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);

  // ---- Mock state ----
  private mockProfileByPubKey = new Map<string, { username: string; bio: string; updatedOn: string }>();
  private mockMyPubKey = 'ED25519_PUBKEY_MOCK_ABC123';

  private constructor() {}

  static getInstance(): ContractService {
    if (!ContractService.instance) ContractService.instance = new ContractService();
    return ContractService.instance;
  }

  async init(): Promise<boolean> {
    const envMock = import.meta.env.VITE_MOCK_MODE === 'true';
    const serversMissing = this.servers.length === 0;
    const hpMissing = !HotPocket;

    if (envMock || serversMissing || hpMissing) {
      this.mockMode = true;
      console.warn(
        '[Profile Hub] Running in MOCK MODE. To connect to HotPocket set VITE_MOCK_MODE=false and configure VITE_CONTRACT_URLS (wss://...).',
      );
      // Seed a default profile in mock mode.
      if (!this.mockProfileByPubKey.has(this.mockMyPubKey)) {
        this.mockProfileByPubKey.set(this.mockMyPubKey, {
          username: 'alice_01',
          bio: 'Hello Evernode',
          updatedOn: new Date().toISOString(),
        });
      }
      return true;
    }

    if (!this.keyPair) this.keyPair = await HotPocket.generateKeys();

    if (!this.client) {
      this.client = await HotPocket.createClient(this.servers, this.keyPair);
    }

    if (!this.client || typeof this.client.connect !== 'function') {
      throw new Error(
        'Failed to initialize HotPocket client. Check VITE_CONTRACT_URLS or set VITE_MOCK_MODE=true.',
      );
    }

    this.registerEvents();

    if (!this.connected) {
      const ok = await this.client.connect();
      if (!ok) {
        throw new Error('HotPocket connection failed. Verify your nodes are reachable over wss://.');
      }
      this.connected = true;
    }

    return true;
  }

  private registerEvents(): void {
    this.client.on(HotPocket.events.disconnect, () => {
      this.connected = false;
      window.location.reload();
    });

    this.client.on(HotPocket.events.connectionChange, (server: string, action: string) => {
      console.log(`HotPocket ${action}: ${server}`);
    });

    this.client.on(HotPocket.events.contractOutput, (r: { outputs: unknown[] }) => {
      r.outputs.forEach((output) => {
        const parsed = this.deserialize<ContractResponse>(output);
        const pId = parsed.promiseId;
        if (!pId) return;

        const pending = this.promiseMap.get(pId);
        if (!pending) return;

        if (parsed.error) pending.reject(parsed.error);
        else pending.resolve(parsed.success);

        this.promiseMap.delete(pId);
      });
    });

    this.client.on(HotPocket.events.healthEvent, (ev: unknown) => console.log(ev));
  }

  async submitContractReadRequest<T = unknown>(message: ContractMessage): Promise<T> {
    if (this.mockMode) return this.mockResponse<T>(message);

    const output = await this.client.submitContractReadRequest(this.serialize(message));
    const parsed = this.deserialize<ContractResponse<T>>(output);

    if (parsed.error) {
      const msg = typeof parsed.error === 'string' ? parsed.error : JSON.stringify(parsed.error);
      throw new Error(msg);
    }

    return (parsed.success ?? null) as T;
  }

  async submitInputToContract<T = unknown>(message: ContractMessage): Promise<T> {
    if (this.mockMode) return this.mockResponse<T>(message);

    const promiseId = this.getUniqueId();
    const result = new Promise<T>((resolve, reject) => {
      this.promiseMap.set(promiseId, { resolve: resolve as (value: any) => void, reject });
    });

    const input = await this.client.submitContractInput(this.serialize({ promiseId, ...message }));
    const status = await input.submissionStatus;

    if (status.status !== 'accepted') {
      this.promiseMap.delete(promiseId);
      throw new Error(`Ledger rejection: ${status.reason ?? 'Unknown reason'}`);
    }

    return result;
  }

  private serialize(payload: unknown): string {
    return JSON.stringify(payload);
  }

  private deserialize<T>(output: unknown): T {
    if (typeof output === 'string') {
      try {
        return JSON.parse(output) as T;
      } catch {
        return output as T;
      }
    }
    return output as T;
  }

  private getUniqueId(): string {
    const bytes = new Uint8Array(10);
    window.crypto.getRandomValues(bytes);
    return Array.from(bytes)
      .map((b) => b.toString(16).padStart(2, '0'))
      .join('');
  }

  private async mockResponse<T>(message: ContractMessage): Promise<T> {
    await new Promise((r) => setTimeout(r, 150));
    console.log('[MOCK] Contract call:', message);

    // ---- Profile ----
    if (message.Service === 'Profile' && message.Action === 'GetMyProfile') {
      const p = this.mockProfileByPubKey.get(this.mockMyPubKey);
      if (!p) throw new Error('Profile not found.');
      return {
        pubKey: this.mockMyPubKey,
        username: p.username,
        bio: p.bio,
        updatedOn: p.updatedOn,
      } as unknown as T;
    }

    if (message.Service === 'Profile' && message.Action === 'GetProfileByPubKey') {
      const data = (message.data ?? {}) as { pubKey?: string };
      const pubKey = String(data.pubKey ?? '').trim();
      if (!pubKey) throw new Error('pubKey is required.');
      const p = this.mockProfileByPubKey.get(pubKey);
      if (!p) throw new Error('Profile not found.');
      return { pubKey, username: p.username, bio: p.bio, updatedOn: p.updatedOn } as unknown as T;
    }

    if (message.Service === 'Profile' && message.Action === 'SetProfile') {
      const data = (message.data ?? {}) as { username?: string; bio?: string };
      const username = String(data.username ?? '').trim();
      const bio = String(data.bio ?? '').trim();

      if (username.length < 3 || username.length > 32) {
        throw new Error('username must be 3-32 characters.');
      }
      if (!/^[a-zA-Z0-9_]+$/.test(username)) {
        throw new Error('username may contain only letters, numbers, and underscore.');
      }
      if (bio.length > 160) {
        throw new Error('bio must be <= 160 characters.');
      }

      const exists = this.mockProfileByPubKey.has(this.mockMyPubKey);
      this.mockProfileByPubKey.set(this.mockMyPubKey, {
        username,
        bio,
        updatedOn: new Date().toISOString(),
      });
      return (exists ? { updated: true } : { created: true }) as unknown as T;
    }

    // ---- Cluster ----
    if (message.Service === 'Cluster' && message.Action === 'GetClusterUnl') {
      return { unl: ['UNL_NODE_PUBKEY_1', 'UNL_NODE_PUBKEY_2'] } as unknown as T;
    }

    if (message.Service === 'Cluster' && message.Action === 'GetContractVersion') {
      return { version: 1 } as unknown as T;
    }

    if (message.Service === 'Cluster' && message.Action === 'UpdateClusterConfig') {
      return true as unknown as T;
    }

    if (message.Service === 'Cluster' && message.Action === 'UpdateClusterDetails') {
      return { peers: ['node-a.example.com:8081', 'node-b.example.com:8081'] } as unknown as T;
    }

    throw new Error(`Unhandled mock action: ${message.Service}.${message.Action}`);
  }
}
