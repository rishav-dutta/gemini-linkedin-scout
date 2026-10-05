/*
  # Make uploaded resumes private

  - The resumes bucket was public, so any uploaded resume could be downloaded
    by anyone who guessed its file name. n8n uploads with a secret key, which
    still has access when the bucket is private.
  - Anyone holding the public anon key could insert rows into user_resumes.
    n8n connects as the table owner and does not need this policy.
*/

update storage.buckets set public = false where id = 'resumes';

drop policy if exists "Allow n8n to insert resumes" on public.user_resumes;
