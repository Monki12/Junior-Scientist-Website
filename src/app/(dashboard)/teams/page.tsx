
'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Users2 } from 'lucide-react';

export default function MyTeamsPage() {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-3 text-2xl text-primary">
            <Users2 className="h-7 w-7"/>
            My Teams
          </CardTitle>
          <CardDescription>
            This page will display all the teams (task boards) you are a member of, allowing you to switch between them or join new ones.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-10 text-muted-foreground border-2 border-dashed rounded-lg">
            <h3 className="text-lg font-semibold text-foreground mb-2">Feature Under Construction</h3>
            <p>The UI for browsing and managing your team memberships will be built here.</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
