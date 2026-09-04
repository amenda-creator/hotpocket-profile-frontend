import { useEffect, useMemo, useState } from 'react';
import { useDispatch } from 'react-redux';
import { RefreshCw, Shield, PlusCircle, MinusCircle, GitCommit, Network } from 'lucide-react';
import ApiService from '../../services/api-service';
import Loading from '../Shared/Loading';
import { showSnackbar } from '../../features/snackbar/snackbarSlice';
import type {
  ClusterConfigAction,
  ClusterDetailItem,
  ClusterUnlView,
  ContractVersionView,
  UpdateClusterConfigInput,
  UpdateClusterDetailsSuccess,
} from '../../types';

export default function ClusterPage() {
  const dispatch = useDispatch();

  const [loading, setLoading] = useState(true);
  const [unl, setUnl] = useState<ClusterUnlView | null>(null);
  const [version, setVersion] = useState<ContractVersionView | null>(null);

  const [cfgAction, setCfgAction] = useState<ClusterConfigAction>('add');
  const [cfgPubKey, setCfgPubKey] = useState('');
  const [cfgSubmitting, setCfgSubmitting] = useState(false);

  const [clusterDetails, setClusterDetails] = useState<ClusterDetailItem[]>([]);
  const [detailDomain, setDetailDomain] = useState('');
  const [detailPort, setDetailPort] = useState('8081');
  const [detailPubKey, setDetailPubKey] = useState('');
  const [detailsSubmitting, setDetailsSubmitting] = useState(false);
  const [detailsResult, setDetailsResult] = useState<UpdateClusterDetailsSuccess | null>(null);

  const unlCount = (unl?.unl ?? []).length;

  const canAddDetail = useMemo(() => {
    return (
      detailDomain.trim().length > 0 &&
      String(detailPort).trim().length > 0 &&
      detailPubKey.trim().length > 0
    );
  }, [detailDomain, detailPort, detailPubKey]);

  const loadClusterInfo = async () => {
    setLoading(true);
    setDetailsResult(null);
    try {
      const [u, v] = await Promise.all([
        ApiService.getInstance().getClusterUnl(),
        ApiService.getInstance().getContractVersion(),
      ]);
      setUnl(u);
      setVersion(v);
    } catch (e) {
      dispatch(
        showSnackbar({
          message: e instanceof Error ? e.message : 'Failed to load cluster info',
          severity: 'error',
        }),
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadClusterInfo();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const submitConfigChange = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setCfgSubmitting(true);
    try {
      const input: UpdateClusterConfigInput = {
        action: cfgAction,
        publicKey: cfgPubKey.trim(),
      };
      if (!input.publicKey) throw new Error('publicKey is required.');
      await ApiService.getInstance().updateClusterConfig(input);
      dispatch(showSnackbar({ message: 'Cluster config update submitted', severity: 'success' }));
      setCfgPubKey('');
      await loadClusterInfo();
    } catch (e2) {
      dispatch(
        showSnackbar({
          message: e2 instanceof Error ? e2.message : 'Failed to update cluster config',
          severity: 'error',
        }),
      );
    } finally {
      setCfgSubmitting(false);
    }
  };

  const addDetail = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    const item: ClusterDetailItem = {
      domain: detailDomain.trim(),
      peer_port: detailPort.trim(),
      pubkey: detailPubKey.trim(),
    };
    setClusterDetails((prev: ClusterDetailItem[]) => [...prev, item]);
    setDetailDomain('');
    setDetailPort('8081');
    setDetailPubKey('');
  };

  const removeDetailAt = (idx: number) => {
    setClusterDetails((prev: ClusterDetailItem[]) =>
      prev.filter((_: ClusterDetailItem, i: number) => i !== idx),
    );
  };

  const submitClusterDetails = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setDetailsSubmitting(true);
    setDetailsResult(null);
    try {
      if (clusterDetails.length === 0) {
        throw new Error('clusterDetails is required and must be a non-empty array.');
      }
      const res = await ApiService.getInstance().updateClusterDetails({ clusterDetails });
      setDetailsResult(res);
      dispatch(showSnackbar({ message: 'Cluster details update submitted', severity: 'success' }));
    } catch (e2) {
      dispatch(
        showSnackbar({
          message: e2 instanceof Error ? e2.message : 'Failed to update cluster details',
          severity: 'error',
        }),
      );
    } finally {
      setDetailsSubmitting(false);
    }
  };

  if (loading) return <Loading text="Loading cluster info..." />;

  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      <div className="mb-8 flex items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Cluster</h1>
          <p className="mt-1 text-sm text-gray-600">Tools for viewing UNL and contract version.</p>
        </div>
        <button
          type="button"
          onClick={(e: React.MouseEvent<HTMLButtonElement>) => {
            e.preventDefault();
            void loadClusterInfo();
          }}
          className="inline-flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-50"
        >
          <RefreshCw className="h-4 w-4" />
          Refresh
        </button>
      </div>

      <div className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-3">
        <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
          <div className="flex items-center gap-2 text-gray-500">
            <Shield className="h-4 w-4" />
            <p className="text-xs font-medium uppercase tracking-wide">UNL Entries</p>
          </div>
          <p className="mt-2 text-3xl font-bold text-gray-900">{unlCount}</p>
        </div>

        <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
          <div className="flex items-center gap-2 text-gray-500">
            <GitCommit className="h-4 w-4" />
            <p className="text-xs font-medium uppercase tracking-wide">Contract Version</p>
          </div>
          <p className="mt-2 text-3xl font-bold text-gray-900">{version?.version ?? '—'}</p>
        </div>

        <div className="rounded-2xl border border-indigo-100 bg-indigo-50 p-5 shadow-sm">
          <div className="flex items-center gap-2 text-indigo-700">
            <Network className="h-4 w-4" />
            <p className="text-xs font-medium uppercase tracking-wide">Note</p>
          </div>
          <p className="mt-2 text-sm text-indigo-900/80">
            Cluster actions typically require privileged access depending on your node setup.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* UNL display */}
        <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-gray-900">Current UNL</h2>
          <div className="mt-4 space-y-2">
            {(unl?.unl ?? []).length === 0 ? (
              <div className="rounded-xl border-2 border-dashed border-gray-200 bg-gray-50 p-10 text-center">
                <p className="text-sm font-semibold text-gray-800">No UNL entries</p>
                <p className="mt-1 text-sm text-gray-600">Add a node public key to the UNL.</p>
              </div>
            ) : (
              (unl?.unl ?? []).map((k: string) => (
                <div key={k} className="rounded-xl border border-gray-100 bg-gray-50 px-4 py-3">
                  <p className="break-all text-sm text-gray-800">{k}</p>
                </div>
              ))
            )}
          </div>
        </div>

        {/* UpdateClusterConfig */}
        <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-gray-900">Update cluster config (UNL)</h2>
          <p className="mt-1 text-sm text-gray-600">Add or remove a public key from UNL.</p>

          <form onSubmit={submitConfigChange} className="mt-5 space-y-4">
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
              <div>
                <label className="mb-1.5 block text-sm font-medium text-gray-700">Action</label>
                <select
                  value={cfgAction}
                  onChange={(e: React.ChangeEvent<HTMLSelectElement>) =>
                    setCfgAction(e.target.value as ClusterConfigAction)
                  }
                  className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
                >
                  <option value="add">add</option>
                  <option value="remove">remove</option>
                </select>
              </div>
              <div className="sm:col-span-2">
                <label className="mb-1.5 block text-sm font-medium text-gray-700">Public key</label>
                <input
                  value={cfgPubKey}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setCfgPubKey(e.target.value)}
                  placeholder="Node public key"
                  className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={cfgSubmitting}
              className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-indigo-700 disabled:opacity-60"
            >
              {cfgAction === 'add' ? (
                <PlusCircle className="h-4 w-4" />
              ) : (
                <MinusCircle className="h-4 w-4" />
              )}
              {cfgSubmitting ? 'Submitting...' : 'Submit change'}
            </button>
          </form>
        </div>
      </div>

      {/* UpdateClusterDetails */}
      <div className="mt-6 rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-gray-900">Update cluster details (known peers)</h2>
        <p className="mt-1 text-sm text-gray-600">
          Sends <code className="rounded bg-gray-100 px-1">clusterDetails</code> array to the contract.
        </p>

        <div className="mt-5 grid grid-cols-1 gap-6 lg:grid-cols-2">
          <div>
            <form onSubmit={submitClusterDetails} className="space-y-4">
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                <div className="sm:col-span-1">
                  <label className="mb-1.5 block text-sm font-medium text-gray-700">Domain</label>
                  <input
                    value={detailDomain}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setDetailDomain(e.target.value)}
                    placeholder="node.example.com"
                    className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
                  />
                </div>
                <div className="sm:col-span-1">
                  <label className="mb-1.5 block text-sm font-medium text-gray-700">Peer port</label>
                  <input
                    value={detailPort}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setDetailPort(e.target.value)}
                    placeholder="8081"
                    className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
                  />
                </div>
                <div className="sm:col-span-1">
                  <label className="mb-1.5 block text-sm font-medium text-gray-700">Pubkey</label>
                  <input
                    value={detailPubKey}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setDetailPubKey(e.target.value)}
                    placeholder="Node pubkey"
                    className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
                  />
                </div>
              </div>

              <button
                type="button"
                onClick={addDetail}
                disabled={!canAddDetail}
                className="inline-flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-semibold text-gray-800 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-60"
              >
                <PlusCircle className="h-4 w-4" />
                Add item
              </button>

              <button
                type="submit"
                disabled={detailsSubmitting}
                className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-gray-900 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-gray-800 disabled:opacity-60"
              >
                {detailsSubmitting ? 'Submitting...' : 'Submit clusterDetails'}
              </button>
            </form>

            {detailsResult && (
              <div className="mt-4 rounded-xl bg-emerald-50 p-4">
                <p className="text-sm font-semibold text-emerald-900">Peers written</p>
                <div className="mt-2 space-y-1">
                  {(detailsResult.peers ?? []).map((p: string) => (
                    <p key={p} className="text-sm text-emerald-900/80">
                      {p}
                    </p>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div>
            <h3 className="text-sm font-semibold text-gray-900">Pending clusterDetails</h3>
            <div className="mt-3 space-y-2">
              {clusterDetails.length === 0 ? (
                <div className="rounded-xl border-2 border-dashed border-gray-200 bg-gray-50 p-10 text-center">
                  <p className="text-sm font-semibold text-gray-800">No items added</p>
                  <p className="mt-1 text-sm text-gray-600">Add at least one item before submitting.</p>
                </div>
              ) : (
                clusterDetails.map((it: ClusterDetailItem, idx: number) => (
                  <div
                    key={`${it.domain}:${String(it.peer_port)}:${it.pubkey}:${idx}`}
                    className="flex items-start justify-between gap-3 rounded-xl border border-gray-100 bg-gray-50 px-4 py-3"
                  >
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-gray-900">
                        {it.domain}:{String(it.peer_port)}
                      </p>
                      <p className="mt-1 break-all text-xs text-gray-600">{it.pubkey}</p>
                    </div>
                    <button
                      type="button"
                      onClick={(e: React.MouseEvent<HTMLButtonElement>) => {
                        e.preventDefault();
                        removeDetailAt(idx);
                      }}
                      className="rounded-lg p-2 text-gray-500 transition hover:bg-white hover:text-rose-600"
                    >
                      <MinusCircle className="h-5 w-5" />
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
