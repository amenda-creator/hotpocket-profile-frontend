// Message sent to the contract. Service/Action are PascalCase and must match the
// backend exactly; payload key is lowercase `data` (the contract normalizes Data->data).
export interface ContractMessage {
  Service: string;
  Action: string;
  data?: unknown;
}

// Contract responses are either { success } or { error }.
// On writes, the contract echoes the promiseId so the client can correlate.
export interface ContractResponse<T = unknown> {
  success?: T;
  error?: unknown;
  promiseId?: string;
}

// -------------------------
// Profile service models
// -------------------------

export interface SetProfileInput {
  username: string;
  bio: string;
}

export interface SetProfileSuccess {
  created?: true;
  updated?: true;
}

export interface ProfileView {
  pubKey: string;
  username: string;
  bio: string;
  updatedOn: string;
}

export interface GetProfileByPubKeyInput {
  pubKey: string;
}

// -------------------------
// Cluster service models
// -------------------------

export type ClusterConfigAction = 'add' | 'remove';

export interface UpdateClusterConfigInput {
  action: ClusterConfigAction;
  publicKey: string;
}

export interface ClusterUnlView {
  unl: string[];
}

export interface ContractVersionView {
  version: number;
}

export interface ClusterDetailItem {
  domain: string;
  peer_port: string | number;
  pubkey: string;
}

export interface UpdateClusterDetailsInput {
  clusterDetails: ClusterDetailItem[];
}

export interface UpdateClusterDetailsSuccess {
  peers: string[];
}
