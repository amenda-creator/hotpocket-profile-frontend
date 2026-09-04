import ContractService from './contract-service';
import type {
  ClusterUnlView,
  ContractVersionView,
  GetProfileByPubKeyInput,
  ProfileView,
  SetProfileInput,
  SetProfileSuccess,
  UpdateClusterConfigInput,
  UpdateClusterDetailsInput,
  UpdateClusterDetailsSuccess,
} from '../types';

export default class ApiService {
  private static instance: ApiService;
  private readonly contract: ContractService;

  private constructor() {
    this.contract = ContractService.getInstance();
  }

  static getInstance(): ApiService {
    if (!ApiService.instance) ApiService.instance = new ApiService();
    return ApiService.instance;
  }

  // ----------------
  // Profile (domain)
  // ----------------

  async setProfile(input: SetProfileInput): Promise<SetProfileSuccess> {
    return this.contract.submitInputToContract<SetProfileSuccess>({
      Service: 'Profile',
      Action: 'SetProfile',
      data: input,
    });
  }

  async getMyProfile(): Promise<ProfileView> {
    return this.contract.submitContractReadRequest<ProfileView>({
      Service: 'Profile',
      Action: 'GetMyProfile',
      data: {},
    });
  }

  async getProfileByPubKey(input: GetProfileByPubKeyInput): Promise<ProfileView> {
    return this.contract.submitContractReadRequest<ProfileView>({
      Service: 'Profile',
      Action: 'GetProfileByPubKey',
      data: input,
    });
  }

  // ----------------
  // Cluster (domain)
  // ----------------

  async updateClusterConfig(input: UpdateClusterConfigInput): Promise<unknown> {
    return this.contract.submitInputToContract<unknown>({
      Service: 'Cluster',
      Action: 'UpdateClusterConfig',
      data: input,
    });
  }

  async getClusterUnl(): Promise<ClusterUnlView> {
    return this.contract.submitContractReadRequest<ClusterUnlView>({
      Service: 'Cluster',
      Action: 'GetClusterUnl',
    });
  }

  async getContractVersion(): Promise<ContractVersionView> {
    return this.contract.submitContractReadRequest<ContractVersionView>({
      Service: 'Cluster',
      Action: 'GetContractVersion',
    });
  }

  async updateClusterDetails(input: UpdateClusterDetailsInput): Promise<UpdateClusterDetailsSuccess> {
    return this.contract.submitInputToContract<UpdateClusterDetailsSuccess>({
      Service: 'Cluster',
      Action: 'UpdateClusterDetails',
      data: input,
    });
  }
}
