
'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/use-auth';
import type { UserProfileData } from '@/types';
import { collection, query, orderBy, limit, getDocs, where } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Loader2, Trophy, Award, ShieldAlert } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useRouter } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';

export default function LeaderboardPage() {
  const { userProfile, loading: authLoading } = useAuth();
  const router = useRouter();
  const { toast } = useToast();
  
  const [leaderboard, setLeaderboard] = useState<UserProfileData[]>([]);
  const [loadingData, setLoadingData] = useState(true);

  const canViewPage = userProfile && userProfile.role !== 'student' && userProfile.role !== 'test';

  useEffect(() => {
    if (!authLoading) {
      if (!canViewPage) {
        toast({ title: "Access Denied", description: "The leaderboard is not available for students.", variant: "destructive"});
        router.push('/dashboard');
        return;
      }

      const fetchLeaderboard = async () => {
        setLoadingData(true);
        try {
          const usersRef = collection(db, 'users');
          const q = query(
            usersRef,
            where('role', 'in', ['organizer', 'event_representative', 'overall_head', 'admin']),
            orderBy('credibilityScore', 'desc'),
            limit(50)
          );
          const querySnapshot = await getDocs(q);
          const leaders = querySnapshot.docs.map(doc => doc.data() as UserProfileData);
          setLeaderboard(leaders);
        } catch (error) {
          console.error("Error fetching leaderboard data:", error);
          toast({ title: "Error", description: "Could not fetch leaderboard data.", variant: "destructive" });
        } finally {
          setLoadingData(false);
        }
      };
      
      fetchLeaderboard();
    }
  }, [userProfile, authLoading, canViewPage, router, toast]);

  const topThree = leaderboard.slice(0, 3);
  const restOfBoard = leaderboard.slice(3);

  const userRank = leaderboard.findIndex(u => u.uid === userProfile?.uid) + 1;

  if (authLoading || loadingData) {
    return (
      <div className="flex h-full w-full items-center justify-center">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }

  if (!canViewPage) {
    return (
      <div className="flex flex-col h-full w-full items-center justify-center text-center p-4">
        <ShieldAlert className="h-16 w-16 text-destructive mb-4" />
        <h1 className="text-2xl font-bold text-destructive">Access Denied</h1>
        <p className="text-muted-foreground">The leaderboard is only available for staff members.</p>
        <Button onClick={() => router.push('/dashboard')} className="mt-4">Go to Dashboard</Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center p-4 md:p-6 space-y-8 bg-background/50 rounded-lg">
      <div className="text-center">
        <Trophy className="mx-auto h-16 w-16 text-yellow-400 drop-shadow-lg" />
        <h1 className="text-4xl font-bold text-primary tracking-tight">Leaderboard</h1>
        <p className="text-muted-foreground">Top performing staff members based on credibility score.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-8 items-end w-full max-w-4xl">
        {/* 2nd Place */}
        <div className="flex justify-center md:order-1">
          {topThree.length > 1 && (
            <Card className="relative w-full max-w-xs text-center p-4 border-2 border-slate-400 shadow-lg bg-card/80 backdrop-blur-sm transform hover:scale-105 transition-transform duration-300">
              <div className="absolute top-2 right-2 text-2xl font-bold text-slate-400">#2</div>
              <Avatar className="h-24 w-24 mx-auto mb-2 border-4 border-slate-300">
                <AvatarImage src={topThree[1].photoURL || undefined} />
                <AvatarFallback className="text-3xl">{(topThree[1].fullName || 'U')[0]}</AvatarFallback>
              </Avatar>
              <h3 className="text-lg font-semibold text-foreground">{topThree[1].fullName}</h3>
              <p className="text-sm text-muted-foreground capitalize">{topThree[1].role?.replace(/_/g, ' ')}</p>
              <p className="text-2xl font-bold text-accent mt-1">{topThree[1].credibilityScore}</p>
            </Card>
          )}
        </div>
        {/* 1st Place */}
        <div className="flex justify-center md:order-2">
          {topThree.length > 0 && (
            <Card className="relative w-full max-w-xs text-center p-6 border-4 border-yellow-400 shadow-xl bg-card/90 backdrop-blur-sm scale-110 transform hover:scale-115 transition-transform duration-300 z-10">
              <div className="absolute top-2 right-2 text-3xl font-bold text-yellow-400">#1</div>
              <Avatar className="h-28 w-28 mx-auto mb-3 border-4 border-yellow-300">
                <AvatarImage src={topThree[0].photoURL || undefined} />
                <AvatarFallback className="text-4xl">{(topThree[0].fullName || 'U')[0]}</AvatarFallback>
              </Avatar>
              <h3 className="text-xl font-bold text-foreground">{topThree[0].fullName}</h3>
              <p className="text-md text-muted-foreground capitalize">{topThree[0].role?.replace(/_/g, ' ')}</p>
              <p className="text-3xl font-bold text-accent mt-1">{topThree[0].credibilityScore}</p>
            </Card>
          )}
        </div>
        {/* 3rd Place */}
        <div className="flex justify-center md:order-3">
          {topThree.length > 2 && (
            <Card className="relative w-full max-w-xs text-center p-4 border-2 border-orange-500 shadow-lg bg-card/80 backdrop-blur-sm transform hover:scale-105 transition-transform duration-300">
              <div className="absolute top-2 right-2 text-xl font-bold text-orange-500">#3</div>
              <Avatar className="h-20 w-20 mx-auto mb-2 border-4 border-orange-400">
                <AvatarImage src={topThree[2].photoURL || undefined} />
                <AvatarFallback className="text-2xl">{(topThree[2].fullName || 'U')[0]}</AvatarFallback>
              </Avatar>
              <h3 className="text-md font-semibold text-foreground">{topThree[2].fullName}</h3>
              <p className="text-sm text-muted-foreground capitalize">{topThree[2].role?.replace(/_/g, ' ')}</p>
              <p className="text-xl font-bold text-accent mt-1">{topThree[2].credibilityScore}</p>
            </Card>
          )}
        </div>
      </div>

      <Card className="w-full max-w-4xl shadow-lg">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full">
              <tbody>
                {restOfBoard.map((user, index) => (
                  <tr key={user.uid} className={cn("border-b last:border-none hover:bg-muted/50", user.uid === userProfile?.uid && 'bg-primary/10')}>
                    <td className="p-3 text-center font-bold text-lg w-16">{index + 4}</td>
                    <td className="p-3 flex items-center gap-3">
                      <Avatar className="h-10 w-10">
                        <AvatarImage src={user.photoURL || undefined} />
                        <AvatarFallback>{(user.fullName || 'U')[0]}</AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-semibold">{user.fullName}</p>
                        <p className="text-xs text-muted-foreground capitalize">{user.role?.replace(/_/g, ' ')}</p>
                      </div>
                    </td>
                    <td className="p-3 text-right font-bold text-lg text-accent w-24">{user.credibilityScore}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
      
      {userRank > 0 && userProfile && (
         <div className="sticky bottom-4 w-full flex justify-center z-20">
            <Card className="w-full max-w-4xl shadow-2xl bg-accent text-accent-foreground p-3 animate-fade-in-up">
                <div className="flex justify-between items-center">
                    <div className="flex items-center gap-3">
                        <div className="text-lg font-bold">#{userRank}</div>
                        <Avatar className="h-10 w-10">
                            <AvatarImage src={userProfile.photoURL || undefined} />
                            <AvatarFallback>{(userProfile.fullName || 'U')[0]}</AvatarFallback>
                        </Avatar>
                        <div>
                            <p className="font-bold">{userProfile.fullName} (You)</p>
                            <p className="text-xs opacity-80 capitalize">{userProfile.role?.replace(/_/g, ' ')}</p>
                        </div>
                    </div>
                    <div className="text-lg font-bold flex items-center gap-1">
                        <Award className="h-5 w-5" /> {userProfile.credibilityScore}
                    </div>
                </div>
            </Card>
         </div>
      )}
    </div>
  );
}
