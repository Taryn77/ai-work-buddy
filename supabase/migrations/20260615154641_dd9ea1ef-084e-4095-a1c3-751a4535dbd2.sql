
CREATE TABLE public.generations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  kind TEXT NOT NULL CHECK (kind IN ('email','summary','plan','research')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT ON public.generations TO anon, authenticated;
GRANT ALL ON public.generations TO service_role;
ALTER TABLE public.generations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can read generations" ON public.generations FOR SELECT USING (true);
CREATE POLICY "Anyone can insert generations" ON public.generations FOR INSERT WITH CHECK (true);

CREATE TABLE public.chat_messages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  role TEXT NOT NULL CHECK (role IN ('user','assistant')),
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, DELETE ON public.chat_messages TO anon, authenticated;
GRANT ALL ON public.chat_messages TO service_role;
ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can read chat" ON public.chat_messages FOR SELECT USING (true);
CREATE POLICY "Anyone can insert chat" ON public.chat_messages FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can delete chat" ON public.chat_messages FOR DELETE USING (true);

CREATE INDEX idx_generations_created_at ON public.generations(created_at DESC);
CREATE INDEX idx_chat_messages_created_at ON public.chat_messages(created_at);
