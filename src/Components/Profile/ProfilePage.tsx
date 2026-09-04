import { useEffect, useMemo, useState } from 'react';
import { useDispatch } from 'react-redux';
import { Save, RefreshCw, UserRound, KeyRound, Clock, Search } from 'lucide-react';
import ApiService from '../../services/api-service';
import Loading from '../Shared/Loading';
import { showSnackbar } from '../../features/snackbar/snackbarSlice';
import type { ProfileView, SetProfileInput } from '../../types';

const USERNAME_HINT = '3–32 chars; letters, numbers, underscore';
const BIO_HINT = 'Up to 160 characters';

export default function ProfilePage() {
  const dispatch = useDispatch();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [profile, setProfile] = useState<ProfileView | null>(null);

  const [form, setForm] = useState<SetProfileInput>({ username: '', bio: '' });

  const [lookupPubKey, setLookupPubKey] = useState('');
  const [lookupResult, setLookupResult] = useState<ProfileView | null>(null);
  const [lookupLoading, setLookupLoading] = useState(false);

  const remainingBioChars = useMemo(() => {
    const len = (form.bio ?? '').length;
    return Math.max(0, 160 - len);
  }, [form.bio]);

  const loadMyProfile = async () => {
    setLoading(true);
    try {
      const p = await ApiService.getInstance().getMyProfile();
      setProfile(p);
      setForm({ username: p.username ?? '', bio: p.bio ?? '' });
    } catch (e) {
      setProfile(null);
      dispatch(
        showSnackbar({
          message: e instanceof Error ? e.message : 'Failed to load your profile',
          severity: 'error',
        }),
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadMyProfile();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const onSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSaving(true);

    const input: SetProfileInput = {
      username: (form.username ?? '').trim(),
      bio: (form.bio ?? '').trim(),
    };

    try {
      const res = await ApiService.getInstance().setProfile(input);
      const msg = res.created ? 'Profile created' : res.updated ? 'Profile updated' : 'Saved';
      dispatch(showSnackbar({ message: msg, severity: 'success' }));
      await loadMyProfile();
    } catch (e2) {
      dispatch(
        showSnackbar({
          message: e2 instanceof Error ? e2.message : 'Failed to save profile',
          severity: 'error',
        }),
      );
    } finally {
      setSaving(false);
    }
  };

  const onLookup = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLookupLoading(true);
    setLookupResult(null);
    try {
      const pk = lookupPubKey.trim();
      if (!pk) throw new Error('pubKey is required.');
      const p = await ApiService.getInstance().getProfileByPubKey({ pubKey: pk });
      setLookupResult(p);
    } catch (e2) {
      dispatch(
        showSnackbar({
          message: e2 instanceof Error ? e2.message : 'Lookup failed',
          severity: 'error',
        }),
      );
    } finally {
      setLookupLoading(false);
    }
  };

  if (loading) return <Loading text="Loading your profile..." />;

  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Profile</h1>
        <p className="mt-1 text-sm text-gray-600">
          Save a username and short bio on the HotPocket contract.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Form */}
        <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
          <div className="mb-5 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900">Edit profile</h2>
            <button
              type="button"
              onClick={(e: React.MouseEvent<HTMLButtonElement>) => {
                e.preventDefault();
                void loadMyProfile();
              }}
              className="inline-flex items-center gap-2 rounded-xl border border-gray-200 px-3 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-50"
            >
              <RefreshCw className="h-4 w-4" />
              Refresh
            </button>
          </div>

          <form onSubmit={onSubmit} className="space-y-5">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-700">Username</label>
              <input
                value={form.username}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  setForm((prev: SetProfileInput) => ({ ...prev, username: e.target.value }))
                }
                placeholder="e.g. alice_01"
                className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm text-gray-900 outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
              />
              <p className="mt-1 text-xs text-gray-500">{USERNAME_HINT}</p>
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-700">Bio</label>
              <textarea
                value={form.bio}
                onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                  setForm((prev: SetProfileInput) => ({ ...prev, bio: e.target.value }))
                }
                rows={4}
                placeholder="Say something short about yourself..."
                className="w-full resize-none rounded-xl border border-gray-200 px-4 py-2.5 text-sm text-gray-900 outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
              />
              <div className="mt-1 flex items-center justify-between text-xs text-gray-500">
                <span>{BIO_HINT}</span>
                <span>{remainingBioChars} remaining</span>
              </div>
            </div>

            <button
              type="submit"
              disabled={saving}
              className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              <Save className="h-4 w-4" />
              {saving ? 'Saving...' : 'Save profile'}
            </button>

            <div className="rounded-xl bg-amber-50 px-4 py-3 text-sm text-amber-900">
              <p className="font-medium">Contract validation rules</p>
              <ul className="mt-1 list-disc pl-5 text-xs text-amber-900/80">
                <li>Username is required; 3–32 characters; letters, numbers, underscore only.</li>
                <li>Bio may be empty; max length 160.</li>
              </ul>
            </div>
          </form>
        </div>

        {/* Current profile display */}
        <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-gray-900">Saved profile</h2>

          {!profile ? (
            <div className="mt-6 rounded-2xl border-2 border-dashed border-gray-200 bg-gray-50 p-10 text-center">
              <UserRound className="mx-auto h-10 w-10 text-gray-400" />
              <p className="mt-3 text-sm font-semibold text-gray-800">No profile found</p>
              <p className="mt-1 text-sm text-gray-600">Save your profile to create one.</p>
            </div>
          ) : (
            <div className="mt-5 space-y-4">
              <div className="rounded-xl bg-gray-50 p-4">
                <p className="text-xs font-medium uppercase tracking-wide text-gray-400">Username</p>
                <p className="mt-1 text-lg font-semibold text-gray-900">{profile.username}</p>
              </div>

              <div className="rounded-xl bg-gray-50 p-4">
                <p className="text-xs font-medium uppercase tracking-wide text-gray-400">Bio</p>
                <p className="mt-1 whitespace-pre-wrap text-sm text-gray-800">{profile.bio}</p>
              </div>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div className="rounded-xl border border-gray-100 p-4">
                  <div className="flex items-center gap-2 text-gray-500">
                    <KeyRound className="h-4 w-4" />
                    <p className="text-xs font-medium uppercase tracking-wide">PubKey</p>
                  </div>
                  <p className="mt-2 break-all text-sm text-gray-800">{profile.pubKey}</p>
                </div>
                <div className="rounded-xl border border-gray-100 p-4">
                  <div className="flex items-center gap-2 text-gray-500">
                    <Clock className="h-4 w-4" />
                    <p className="text-xs font-medium uppercase tracking-wide">Updated</p>
                  </div>
                  <p className="mt-2 text-sm text-gray-800">{profile.updatedOn}</p>
                </div>
              </div>
            </div>
          )}

          {/* Lookup */}
          <div className="mt-8 border-t border-gray-100 pt-6">
            <h3 className="text-sm font-semibold text-gray-900">Lookup profile by pubKey</h3>
            <form onSubmit={onLookup} className="mt-3 flex flex-col gap-3 sm:flex-row">
              <input
                value={lookupPubKey}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setLookupPubKey(e.target.value)}
                placeholder="Enter a user pubKey"
                className="w-full flex-1 rounded-xl border border-gray-200 px-4 py-2.5 text-sm outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
              />
              <button
                type="submit"
                disabled={lookupLoading}
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-gray-900 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-gray-800 disabled:opacity-60"
              >
                <Search className="h-4 w-4" />
                {lookupLoading ? 'Searching...' : 'Search'}
              </button>
            </form>

            {lookupResult && (
              <div className="mt-4 rounded-xl bg-indigo-50 p-4">
                <p className="text-sm font-semibold text-indigo-900">{lookupResult.username}</p>
                <p className="mt-1 text-sm text-indigo-900/80">{lookupResult.bio}</p>
                <p className="mt-2 text-xs text-indigo-900/70">Updated: {lookupResult.updatedOn}</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
