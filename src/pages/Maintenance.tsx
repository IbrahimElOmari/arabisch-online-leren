import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertTriangle } from 'lucide-react';

export default function Maintenance() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <AlertTriangle className="h-12 w-12 text-destructive" />
          </div>
          <CardTitle className="text-xl">Onderhoud</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 text-center">
          <p className="text-muted-foreground">
            De applicatie is momenteel niet beschikbaar vanwege ontbrekende configuratie.
          </p>
          <p className="text-sm text-muted-foreground">
            Neem contact op met de beheerder om dit probleem op te lossen.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}