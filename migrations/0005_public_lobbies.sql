CREATE TABLE IF NOT EXISTS public_lobbies (
 code TEXT PRIMARY KEY,
 name TEXT NOT NULL,
 players INTEGER NOT NULL DEFAULT 0,
 day INTEGER NOT NULL DEFAULT 1,
 phase TEXT NOT NULL DEFAULT 'ready',
 updated_at INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS public_lobbies_updated ON public_lobbies(updated_at);
CREATE TABLE IF NOT EXISTS custom_voices (
 id TEXT PRIMARY KEY,
 user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
 provider TEXT NOT NULL,
 name TEXT NOT NULL,
 created_at INTEGER NOT NULL
);
