# n8n workflows

Exports of the workflows the app runs on (n8n 2.41). Credentials are referenced
by name only; no secrets are stored in these files.

| Workflow | Trigger | What it does |
|---|---|---|
| `find-linkedin-profiles.json` | Webhook `POST /webhook/find-leads` | Searches for people at a company (Firecrawl), saves them to `linkedin_leads`, replies to the site, then fetches full profiles (Apify) in the background and stores each person's current LinkedIn URL. Replies `{"status": "no_results"}` when the search finds nobody |
| `score-resume-matches.json` | Webhook `POST /webhook/score-resume` | Uploads the resume to storage, extracts its text, scores every lead that has a full profile with Gemini (leads are identified by database ID, so the model never has to copy URLs), saves the scores |
| `supabase-keep-alive.json` | Schedule, every 2 days | Pings Supabase so the free project isn't paused for inactivity |

## Importing

1. In n8n: **Create workflow**, then paste the file's contents onto the canvas (or **Import from file**).
2. Create these credentials and select them on the nodes that need them:

   | Credential | Type | Used by |
   |---|---|---|
   | Postgres account | Postgres (Supabase pooler connection) | All three workflows |
   | Firecrawl account | Firecrawl API | Find LinkedIn Profiles |
   | Apify account | Apify API | Find LinkedIn Profiles |
   | Google Gemini(PaLM) Api account | Google Gemini | Score Resume Matches |
   | Supabase Storage | Header Auth: `apikey` = Supabase secret key | Score Resume Matches (resume upload) |
   | Proxy Secret | Header Auth: `X-Proxy-Secret` = same value as the Edge Function's `N8N_PROXY_SECRET` | Both webhook nodes |

3. Replace the Supabase project address `eqipaeameimazivwwrrm.supabase.co` with your own in
   **Upload Resume to Storage** and **Save Resume** (Score Resume Matches) and in the keep-alive's
   HTTP node.
4. In `supabase-keep-alive.json`, replace `YOUR_SUPABASE_ANON_KEY` with the project's anon key.
5. The Apify and Firecrawl nodes are community nodes: install `@apify/n8n-nodes-apify` and
   `@mendable/n8n-nodes-firecrawl` under **Settings → Community nodes**.
6. Publish the workflows. The webhooks only accept requests carrying the proxy secret, so the
   website reaches them through the `n8n-proxy` Supabase Edge Function.

## Notes

- **Score Leads (Gemini)** retries up to 5 times, 2 s apart: Gemini 2.5 Flash-Lite occasionally
  returns an empty reply. Only the agent's retry setting takes effect; n8n ignores retry settings
  on the attached model node.
- **Find LinkedIn Profiles** replies before Apify runs (7–35 s), so the site shows contacts within
  about a second and waits for full profiles before allowing a resume upload.
