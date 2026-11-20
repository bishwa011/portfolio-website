-- Run this file in Supabase SQL Editor after creating a Supabase project.
-- This one-owner portfolio keeps its content in one JSONB document so the API
-- can save a complete, validated editor submission atomically.

create table if not exists public.portfolio_admins (
  user_id uuid primary key references auth.users (id) on delete cascade,
  created_at timestamptz not null default now()
);

create table if not exists public.portfolio_content (
  id smallint primary key check (id = 1),
  content jsonb not null,
  published boolean not null default false,
  updated_at timestamptz not null default now()
);

alter table public.portfolio_admins enable row level security;
alter table public.portfolio_content enable row level security;

revoke all on public.portfolio_admins from anon, authenticated;
revoke all on public.portfolio_content from anon, authenticated;
grant select on public.portfolio_admins to authenticated;
grant select on public.portfolio_content to anon, authenticated;
grant update (content, published, updated_at) on public.portfolio_content to authenticated;

drop policy if exists "Admins can read their own membership" on public.portfolio_admins;
create policy "Admins can read their own membership"
  on public.portfolio_admins for select to authenticated
  using (user_id = (select auth.uid()));

drop policy if exists "Anyone can read published portfolio content" on public.portfolio_content;
create policy "Anyone can read published portfolio content"
  on public.portfolio_content for select to anon, authenticated
  using (published = true);

drop policy if exists "Admins can read all portfolio content" on public.portfolio_content;
create policy "Admins can read all portfolio content"
  on public.portfolio_content for select to authenticated
  using (exists (
    select 1 from public.portfolio_admins
    where user_id = (select auth.uid())
  ));

drop policy if exists "Admins can update portfolio content" on public.portfolio_content;
create policy "Admins can update portfolio content"
  on public.portfolio_content for update to authenticated
  using (exists (
    select 1 from public.portfolio_admins
    where user_id = (select auth.uid())
  ))
  with check (exists (
    select 1 from public.portfolio_admins
    where user_id = (select auth.uid())
  ));

-- The seed is the existing, user-approved portfolio information.
insert into public.portfolio_content (id, content, published)
values (
  1,
  '{
    "profile": {
      "name": "Bishwa Prakash Subedi",
      "tagline": "I study how ideas move through online spaces—and build practical tools to make sense of the data behind them.",
      "location": "Little Rock, Arkansas",
      "degree": "M.S. student in Information Science at UA Little Rock",
      "affiliation": "Graduate Research Assistant at the COSMOS Research Center",
      "about": [
        "I’m a master’s student in Information Science at the University of Arkansas at Little Rock and a Graduate Research Assistant at the COSMOS Research Center.",
        "My research explores online narratives, social media behavior, and how information travels through digital spaces. I work with AI methods to study large text and visual datasets, and I’m also learning to turn ideas into useful software.",
        "Outside a specific research question, I’m curious about the connections between people, content, and recommendation systems—and about making complex data easier to explore and understand."
      ],
      "photoUrl": "",
      "resumeUrl": "",
      "email": "",
      "links": {
        "github": "https://github.com/bishwa011",
        "linkedin": "",
        "scholar": "",
        "orcid": ""
      }
    },
    "research": [
      {"id":"protest-narratives","kind":"direction","title":"Competing narratives in moments of protest","description":"Studying symbolic communication and competing narratives during the 2025 Indonesia protests using YouTube and Instagram data.","areas":["Social media","Online narratives","Computational social science"]},
      {"id":"recommendation-networks","kind":"direction","title":"Recommendation networks and content traps","description":"Examining focal structures and recommendation networks in YouTube to understand how content pathways take shape.","areas":["Network analysis","Recommender systems"]},
      {"id":"instagram-engagement","kind":"direction","title":"Predicting Instagram engagement","description":"Exploring image features, caption representations, multimodal alignment, and visual typicality in engagement prediction.","areas":["Multimodal AI","Computer vision"]},
      {"id":"toxicity-detection","kind":"direction","title":"Context-aware toxicity detection","description":"Applying language models to understand how context can support the detection of toxic content.","areas":["NLP","Language models"]}
    ],
    "publications": [],
    "projects": [
      {"id":"text-hashtag-analyzer","title":"Text & Hashtag Analyzer","description":"A browser-based tool that counts words, explores text and hashtag statistics, creates a simple extractive summary, and rewrites supported phrases using local rules.","status":"completed","year":"2026","technologies":["HTML","CSS","JavaScript","Local processing"],"repositoryUrl":"https://github.com/bishwa011/text-hashtag-analyzer","demoUrl":"https://bishwa011.github.io/text-hashtag-analyzer/"}
    ],
    "skills": [
      {"id":"programming","category":"Programming & development","items":["HTML, CSS, and vanilla JavaScript through hands-on web projects."]},
      {"id":"ai","category":"Machine learning & AI","items":["Artificial intelligence","Machine learning","Natural language processing","Large language models","Multimodal and vision-language models"]},
      {"id":"data","category":"Data analysis & visualization","items":["Data science","Data visualization"]},
      {"id":"methods","category":"Research methods","items":["Clustering","Embeddings","Graph analysis","Diffusion modeling","Social network analysis","Information diffusion"]}
    ],
    "learning": {
      "intro":"I’m building my web development and software engineering fundamentals one project at a time. This portfolio is part of that process: a static site today, with room to grow as I learn.",
      "currentFocus":"Semantic HTML, responsive CSS, vanilla JavaScript, Git, and GitHub Pages.",
      "nextExperiments":"Small Python utilities, AI-powered applications, and new web features."
    }
  }'::jsonb,
  true
)
on conflict (id) do nothing;

-- After creating your Supabase Auth user, add only that user's UUID here:
-- insert into public.portfolio_admins (user_id) values ('YOUR_AUTH_USER_UUID');
