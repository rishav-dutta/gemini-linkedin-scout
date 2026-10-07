import { AlertCircle, ArrowLeft } from 'lucide-react';
import { useState } from 'react';

export function ErrorBanner({ message }: { message: string }) {
  return (
    <div
      role="alert"
      className="flex items-start gap-2 rounded-lg bg-danger-soft px-4 py-3 text-sm text-danger text-left"
    >
      <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
      <span>{message}</span>
    </div>
  );
}

export function LoadError({ onRetry }: { onRetry: () => void }) {
  return (
    <div className="col-span-full text-center py-10">
      <p className="text-muted mb-3">Could not load contacts.</p>
      <button onClick={onRetry} className="text-accent hover:text-accent-hover text-sm font-medium">
        Try again
      </button>
    </div>
  );
}

export function BackButton({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="inline-flex items-center gap-1.5 text-muted hover:text-ink transition-colors text-sm"
    >
      <ArrowLeft className="w-4 h-4" />
      {label}
    </button>
  );
}

export function Spinner({ className = 'w-8 h-8' }: { className?: string }) {
  return <div className={`${className} rounded-full border-2 border-rule border-t-accent animate-spin`} />;
}

// Profile photo, or the person's initials when there's no photo or it fails to load
export function Avatar({ name, src, className = 'w-12 h-12 text-sm' }: { name: string; src: string | null; className?: string }) {
  const [failed, setFailed] = useState(false);
  const initials = name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join('');

  return (
    <div className={`${className} rounded-full shrink-0 overflow-hidden bg-accent-soft text-accent font-semibold flex items-center justify-center`}>
      {src && !failed ? (
        <img
          src={src}
          alt={name}
          className="w-full h-full object-cover"
          referrerPolicy="no-referrer"
          onError={() => setFailed(true)}
        />
      ) : (
        <span aria-hidden="true">{initials}</span>
      )}
    </div>
  );
}

export function Page({ children }: { children: React.ReactNode }) {
  return <div className="min-h-dvh bg-paper text-ink px-4 py-5 sm:px-6 sm:py-8">{children}</div>;
}
