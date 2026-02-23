
-- Course lessons (videos)
create table if not exists public.course_lessons (
  id uuid default gen_random_uuid() primary key,
  course_id uuid not null references public.courses(id) on delete cascade,
  title text not null,
  description text,
  video_url text,
  video_type text default 'youtube',
  lesson_order int not null default 0,
  duration_minutes int,
  created_at timestamptz default now()
);

-- Track lesson completion per user
create table if not exists public.course_lesson_progress (
  id uuid default gen_random_uuid() primary key,
  lesson_id uuid not null references public.course_lessons(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  completed boolean default false,
  completed_at timestamptz,
  created_at timestamptz default now(),
  unique(lesson_id, user_id)
);

-- Course quizzes
create table if not exists public.course_quizzes (
  id uuid default gen_random_uuid() primary key,
  course_id uuid not null references public.courses(id) on delete cascade,
  title text not null,
  passing_score int default 70,
  created_at timestamptz default now()
);

-- Quiz questions
create table if not exists public.course_quiz_questions (
  id uuid default gen_random_uuid() primary key,
  quiz_id uuid not null references public.course_quizzes(id) on delete cascade,
  question text not null,
  question_type text not null default 'multiple_choice',
  options jsonb,
  question_order int default 0,
  points int default 1
);

-- Quiz attempts
create table if not exists public.course_quiz_attempts (
  id uuid default gen_random_uuid() primary key,
  quiz_id uuid not null references public.course_quizzes(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  answers jsonb not null default '[]'::jsonb,
  score int default 0,
  passed boolean default false,
  attempted_at timestamptz default now()
);

-- Avatar storage bucket
insert into storage.buckets (id, name, public) values ('avatars', 'avatars', true)
on conflict (id) do nothing;

create policy "avatar_upload" on storage.objects
  for insert with check (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text);

create policy "avatar_view" on storage.objects
  for select using (bucket_id = 'avatars');

create policy "avatar_update" on storage.objects
  for update using (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text);

create policy "avatar_delete" on storage.objects
  for delete using (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text);
