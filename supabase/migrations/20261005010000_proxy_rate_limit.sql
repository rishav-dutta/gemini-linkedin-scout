/*
  # Rate-limit log for the n8n-proxy Edge Function

  One row per accepted request, keyed by a SHA-256 hash of the caller's IP
  (the raw IP is never stored). The Edge Function counts recent rows to
  enforce per-visitor and daily limits, and deletes rows older than two days.

  RLS is enabled with no policies, so only the service role (used by the
  Edge Function) can read or write this table.
*/

create table if not exists public.proxy_requests (
  id bigint generated always as identity primary key,
  action text not null,
  ip_hash text not null,
  created_at timestamptz not null default now()
);

create index if not exists proxy_requests_action_ip_created_idx
  on public.proxy_requests (action, ip_hash, created_at desc);

create index if not exists proxy_requests_created_idx
  on public.proxy_requests (created_at);

alter table public.proxy_requests enable row level security;
