import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Shield, 
  AlertTriangle, 
  Users, 
  Clock, 
  Eye,
  Download,
  Trash2,
  CheckCircle,
  XCircle,
  Activity
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface SecurityEvent {
  id: string;
  user_id: string;
  actie: string;
  severity: string;
  details: any;
  created_at: string;
  event_category: string;
}

interface UserSession {
  id: string;
  user_id: string;
  ip_address: string | null;
  user_agent: string | null;
  is_active: boolean;
  last_activity: string;
  created_at: string;
}

interface RateLimit {
  id: string;
  identifier: string;
  action_type: string;
  attempt_count: number;
  blocked_until: string | null;
  last_attempt: string;
}

export const SecurityDashboard = () => {
  const [securityEvents, setSecurityEvents] = useState<SecurityEvent[]>([]);
  const [userSessions, setUserSessions] = useState<UserSession[]>([]);
  const [rateLimits, setRateLimits] = useState<RateLimit[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    loadSecurityData();
  }, []);

  const loadSecurityData = async () => {
    try {
      setLoading(true);

      // Load security events
      const { data: events, error: eventsError } = await supabase
        .from('audit_log')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(50);

      if (eventsError) throw eventsError;

      // Load user sessions
      const { data: sessions, error: sessionsError } = await supabase
        .from('user_security_sessions')
        .select('*')
        .order('last_activity', { ascending: false })
        .limit(20);

      if (sessionsError) throw sessionsError;

      // Load rate limits
      const { data: limits, error: limitsError } = await supabase
        .from('auth_rate_limits')
        .select('*')
        .order('last_attempt', { ascending: false })
        .limit(20);

      if (limitsError) throw limitsError;

      setSecurityEvents((events || []).map(e => ({ ...e, event_category: 'GENERAL' })));
      setUserSessions((sessions || []).map(s => ({ ...s, ip_address: String(s.ip_address || 'unknown'), user_agent: String(s.user_agent || 'unknown') })));
      setRateLimits(limits || []);

    } catch (error: any) {
      toast({
        title: 'Fout',
        description: 'Kon beveiligingsgegevens niet laden: ' + error.message,
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const terminateSession = async (sessionId: string) => {
    try {
      const { error } = await supabase
        .from('user_security_sessions')
        .update({ is_active: false })
        .eq('id', sessionId);

      if (error) throw error;

      toast({
        title: 'Succes',
        description: 'Sessie beëindigd'
      });

      loadSecurityData();
    } catch (error: any) {
      toast({
        title: 'Fout',
        description: 'Kon sessie niet beëindigen: ' + error.message,
        variant: 'destructive'
      });
    }
  };

  const unblockRateLimit = async (limitId: string) => {
    try {
      const { error } = await supabase
        .from('auth_rate_limits')
        .update({ blocked_until: null, attempt_count: 0 })
        .eq('id', limitId);

      if (error) throw error;

      toast({
        title: 'Succes',
        description: 'Rate limit opgeheven'
      });

      loadSecurityData();
    } catch (error: any) {
      toast({
        title: 'Fout',
        description: 'Kon rate limit niet opheffen: ' + error.message,
        variant: 'destructive'
      });
    }
  };

  const exportSecurityData = async () => {
    try {
      const { data, error } = await supabase
        .from('security_events')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `security-events-${new Date().toISOString().split('T')[0]}.json`;
      a.click();
      URL.revokeObjectURL(url);

      toast({
        title: 'Succes',
        description: 'Beveiligingsdata geëxporteerd'
      });
    } catch (error: any) {
      toast({
        title: 'Fout',
        description: 'Kon data niet exporteren: ' + error.message,
        variant: 'destructive'
      });
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'destructive';
      case 'error': return 'destructive';
      case 'warning': return 'secondary';
      case 'info': return 'outline';
      default: return 'outline';
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'PRIVILEGE_CHANGE': return <Shield className="h-4 w-4" />;
      case 'AUTH_SECURITY': return <AlertTriangle className="h-4 w-4" />;
      case 'DATA_ACCESS': return <Eye className="h-4 w-4" />;
      case 'ADMIN_ACTION': return <Users className="h-4 w-4" />;
      default: return <Activity className="h-4 w-4" />;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg">Beveiligingsgegevens laden...</div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Beveiliging & Monitoring</h1>
        <Button onClick={exportSecurityData} variant="outline">
          <Download className="h-4 w-4 mr-2" />
          Export Data
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Shield className="h-5 w-5 text-green-500" />
              <div>
                <div className="text-sm text-muted-foreground">Actieve Sessies</div>
                <div className="text-2xl font-bold">{userSessions.filter(s => s.is_active).length}</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-yellow-500" />
              <div>
                <div className="text-sm text-muted-foreground">Security Events</div>
                <div className="text-2xl font-bold">{securityEvents.length}</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-red-500" />
              <div>
                <div className="text-sm text-muted-foreground">Geblokkeerde IPs</div>
                <div className="text-2xl font-bold">{rateLimits.filter(r => r.blocked_until).length}</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Activity className="h-5 w-5 text-blue-500" />
              <div>
                <div className="text-sm text-muted-foreground">Totaal Events</div>
                <div className="text-2xl font-bold">{securityEvents.length}</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="events" className="w-full">
        <TabsList>
          <TabsTrigger value="events">Security Events</TabsTrigger>
          <TabsTrigger value="sessions">Actieve Sessies</TabsTrigger>
          <TabsTrigger value="ratelimits">Rate Limits</TabsTrigger>
        </TabsList>

        <TabsContent value="events">
          <Card>
            <CardHeader>
              <CardTitle>Beveiligingsgebeurtenissen</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {securityEvents.map((event) => (
                  <div key={event.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center gap-3">
                      {getCategoryIcon(event.event_category)}
                      <div>
                        <div className="font-medium">{event.actie}</div>
                        <div className="text-sm text-muted-foreground">
                          {new Date(event.created_at).toLocaleString()}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant={getSeverityColor(event.severity)}>
                        {event.severity}
                      </Badge>
                      <Badge variant="outline">
                        {event.event_category}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="sessions">
          <Card>
            <CardHeader>
              <CardTitle>Gebruikerssessies</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {userSessions.map((session) => (
                  <div key={session.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center gap-3">
                      {session.is_active ? (
                        <CheckCircle className="h-5 w-5 text-green-500" />
                      ) : (
                        <XCircle className="h-5 w-5 text-red-500" />
                      )}
                      <div>
                        <div className="font-medium">IP: {session.ip_address}</div>
                        <div className="text-sm text-muted-foreground">
                          Laatste activiteit: {new Date(session.last_activity).toLocaleString()}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant={session.is_active ? "default" : "secondary"}>
                        {session.is_active ? "Actief" : "Inactief"}
                      </Badge>
                      {session.is_active && (
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => terminateSession(session.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="ratelimits">
          <Card>
            <CardHeader>
              <CardTitle>Rate Limiting</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {rateLimits.map((limit) => (
                  <div key={limit.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center gap-3">
                      <AlertTriangle className="h-5 w-5 text-yellow-500" />
                      <div>
                        <div className="font-medium">{limit.identifier}</div>
                        <div className="text-sm text-muted-foreground">
                          {limit.action_type} - {limit.attempt_count} pogingen
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant={limit.blocked_until ? "destructive" : "secondary"}>
                        {limit.blocked_until ? "Geblokkeerd" : "Actief"}
                      </Badge>
                      {limit.blocked_until && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => unblockRateLimit(limit.id)}
                        >
                          Opheffen
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};