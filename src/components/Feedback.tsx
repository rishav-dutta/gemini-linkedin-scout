import { AlertCircle, ArrowLeft } from 'lucide-react';

export function ErrorBanner({ message }: { message: string }) {
  return (
    <div
      role="alert"
      className="flex items-start gap-2 rounded-xl border border-red-400/30 bg-red-500/10 px-4 py-3 text-sm text-red-300 text-left"
    >
      <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
      <span>{message}</span>
    </div>
  );
}

export function LoadError({ onRetry }: { onRetry: () => void }) {
  return (
    <div className="col-span-full text-center py-10">
      <p className="text-gray-500 mb-3">Could not load contacts.</p>
      <button
        onClick={onRetry}
        className="text-cyan-400 hover:text-cyan-300 transition-colors text-sm font-medium"
      >
        Try again
      </button>
    </div>
  );
}

export function BackButton({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="inline-flex items-center gap-2 text-gray-400 hover:text-cyan-300 transition-colors text-sm font-medium"
    >
      <ArrowLeft className="w-4 h-4" />
      {label}
    </button>
  );
}
