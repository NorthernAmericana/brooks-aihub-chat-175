type DmCampfireRoomProps = {
  room: {
    campfire: {
      id: string;
      name: string;
      path: string;
      lastActivityAt: Date;
    };
    access: {
      canRead: boolean;
    };
    members: Array<{
      id: string;
      email: string;
      role: string;
    }>;
    posts: Array<{
      id: string;
      title: string;
      body: string;
      createdAt: Date;
      authorEmail: string;
    }>;
  };
};

export function DmCampfireRoom({ room }: DmCampfireRoomProps) {
  return (
    <main className="min-h-dvh bg-transparent px-6 py-10 text-slate-100 [text-shadow:0_2px_12px_rgba(0,0,0,0.72)]">
      <div className="mx-auto w-full max-w-4xl space-y-6">
        <header className="space-y-2">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400">
            NAT: Commons · Private DM Campfire
          </p>
          <h1 className="text-3xl font-semibold">{room.campfire.name}</h1>
          <p className="text-xs text-slate-500 dark:text-slate-400">/commons/{room.campfire.path}</p>
        </header>

        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">Members</h2>
          <ul className="mt-3 space-y-2 text-sm text-slate-600 dark:text-slate-300">
            {room.members.map((member) => (
              <li
                className="flex items-center justify-between rounded-xl border border-slate-200 px-3 py-2 dark:border-slate-700"
                key={member.id}
              >
                <span>{member.email}</span>
                <span className="text-xs uppercase tracking-wide text-slate-500 dark:text-slate-400">
                  {member.role}
                </span>
              </li>
            ))}
          </ul>
        </section>

        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">Messages</h2>
          {room.posts.length > 0 ? (
            <ul className="mt-3 space-y-3">
              {room.posts.map((post) => (
                <li className="rounded-xl border border-slate-200 p-3 dark:border-slate-700" key={post.id}>
                  <p className="text-xs text-slate-500 dark:text-slate-400">{post.authorEmail}</p>
                  <p className="mt-1 whitespace-pre-wrap text-sm text-slate-800 dark:text-slate-200">
                    {post.body}
                  </p>
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">
              Chat UI coming next. This route now resolves for valid DM members.
            </p>
          )}
        </section>
      </div>
    </main>
  );
}
