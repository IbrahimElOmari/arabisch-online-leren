import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Database, RefreshCw, CheckCircle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

const AdminSeeder = () => {
  const [loading, setLoading] = useState(false);
  const [completed, setCompleted] = useState(false);
  const { toast } = useToast();

  const handleSeed = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('seed-database');

      if (error) throw error;

      toast({
        title: "Database Seeding Voltooid",
        description: `Admin en leerkracht accounts zijn aangemaakt. Check de console voor details.`,
      });

      setCompleted(true);
      if (process.env.NODE_ENV === 'development') {
        console.log('Seeding result:', data);
      }
      
    } catch (error) {
      if (process.env.NODE_ENV === 'development') {
        console.error('Seeding error:', error);
      }
      toast({
        title: "Seeding Mislukt",
        description: error.message || "Er is een fout opgetreden bij het seeden van de database.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="max-w-md mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Database className="h-5 w-5" />
          Database Seeding
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="text-sm text-muted-foreground space-y-2">
          <p>Deze actie zal de database vullen met:</p>
          <ul className="list-disc ps-4 space-y-1">
            <li>Admin gebruiker (admin@arabischonline.nl)</li>
            <li>Dummy leerkracht (leerkracht@arabischonline.nl)</li>
            <li>Twee initiële klassen met 4 niveaus elk</li>
            <li>Voorbeeldvragen voor niveau 1</li>
          </ul>
        </div>
        
        {completed && (
          <div className="flex items-center gap-2 text-green-600 text-sm">
            <CheckCircle className="h-4 w-4" />
            Database seeding voltooid!
          </div>
        )}
        
        <Button 
          onClick={handleSeed} 
          disabled={loading || completed}
          className="w-full"
        >
          {loading ? (
            <>
              <RefreshCw className="h-4 w-4 me-2 animate-spin" />
              Bezig met seeding...
            </>
          ) : completed ? (
            'Voltooid'
          ) : (
            'Start Database Seeding'
          )}
        </Button>
      </CardContent>
    </Card>
  );
};

export default AdminSeeder;