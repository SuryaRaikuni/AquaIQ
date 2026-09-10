import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { redirect } from 'next/navigation';
import { formatLiters } from '@/lib/utils';
import { ProfileTabs } from '@/components/profile/ProfileTabs';

export default async function ProfilePage() {
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect('/auth/login');

  const userId = (session.user as { id: string }).id;

  const [footprintProfiles, irrigationProfiles] = await Promise.all([
    prisma.savedProfile.findMany({
      where:   { userId, type: 'footprint' },
      orderBy: { createdAt: 'desc' },
    }),
    prisma.savedProfile.findMany({
      where:   { userId, type: 'irrigation' },
      orderBy: { createdAt: 'desc' },
    }),
  ]);

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="mb-8">
        <h1 className="text-2xl font-bold">My Profile</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Signed in as <span className="font-medium text-foreground">{session.user.email}</span>
        </p>
      </div>

      <ProfileTabs
        footprintProfiles={footprintProfiles.map((p) => ({
          id:        p.id,
          label:     p.label,
          createdAt: p.createdAt.toISOString(),
          data:      p.data as Record<string, unknown>,
        }))}
        irrigationProfiles={irrigationProfiles.map((p) => ({
          id:        p.id,
          label:     p.label,
          createdAt: p.createdAt.toISOString(),
          data:      p.data as Record<string, unknown>,
        }))}
      />
    </div>
  );
}
