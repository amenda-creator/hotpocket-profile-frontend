import { useDispatch, useSelector } from 'react-redux';
import { CircleAlert, CircleCheck, Info, X } from 'lucide-react';
import type { RootState } from '../../app/store';
import { hideSnackbar, type SnackbarSeverity } from '../../features/snackbar/snackbarSlice';

const ICONS: Record<SnackbarSeverity, typeof Info> = {
  success: CircleCheck,
  error: CircleAlert,
  info: Info,
};

const COLORS: Record<SnackbarSeverity, string> = {
  success: 'bg-emerald-600',
  error: 'bg-rose-600',
  info: 'bg-indigo-600',
};

export default function Snackbar() {
  const dispatch = useDispatch();
  const { open, message, severity } = useSelector((state: RootState) => state.snackbar);

  if (!open) return null;

  // Ensure the index is typed correctly even if RootState is not strongly typed in the store.
  const severityKey: SnackbarSeverity = (severity ?? 'info') as SnackbarSeverity;

  const Icon = ICONS[severityKey];

  return (
    <div
      className={`fixed bottom-6 right-6 z-50 flex max-w-[90vw] items-center gap-3 rounded-lg px-4 py-3 text-white shadow-lg ${
        COLORS[severityKey]
      }`}
    >
      <Icon className="h-5 w-5 shrink-0" />
      <span className="text-sm">{message}</span>
      <button
        onClick={() => dispatch(hideSnackbar())}
        className="ml-2 rounded p-1 hover:bg-white/10"
        aria-label="Dismiss"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  );
}
