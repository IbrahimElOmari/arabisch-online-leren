import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { ModerationService } from "@/services/supportService";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { Ban, CheckCircle } from "lucide-react";
import { format } from "date-fns";
import { nl } from "date-fns/locale";
import { Badge } from "@/components/ui/badge";

export function BanManagement() {
  const queryClient = useQueryClient();
  const [userId, setUserId] = useState("");
  const [reason, setReason] = useState("");
  const [banType, setBanType] = useState<"temporary" | "permanent">("temporary");
  const [bannedUntil, setBannedUntil] = useState("");

  const { data: bans } = useQuery({
    queryKey: ['active-bans'],
    queryFn: () => ModerationService.getActiveBans(),
  });

  const banMutation = useMutation({
    mutationFn: () => ModerationService.banUser(userId, reason, banType, bannedUntil || undefined),
    onSuccess: () => {
      toast.success("Gebruiker gebanned");
      setUserId("");
      setReason("");
      setBanType("temporary");
      setBannedUntil("");
      queryClient.invalidateQueries({ queryKey: ['active-bans'] });
    },
    onError: () => {
      toast.error("Fout bij bannen gebruiker");
    },
  });

  const liftMutation = useMutation({
    mutationFn: ({ banId, liftReason }: { banId: string; liftReason: string }) =>
      ModerationService.liftBan(banId, liftReason),
    onSuccess: () => {
      toast.success("Ban opgeheven");
      queryClient.invalidateQueries({ queryKey: ['active-bans'] });
    },
    onError: () => {
      toast.error("Fout bij opheffen ban");
    },
  });

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Gebruiker Bannen</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="text-sm font-medium">Gebruiker ID</label>
            <Input
              value={userId}
              onChange={(e) => setUserId(e.target.value)}
              placeholder="UUID van de gebruiker"
            />
          </div>

          <div>
            <label className="text-sm font-medium">Type</label>
            <Select value={banType} onValueChange={(v: any) => setBanType(v)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="temporary">Tijdelijk</SelectItem>
                <SelectItem value="permanent">Permanent</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {banType === "temporary" && (
            <div>
              <label className="text-sm font-medium">Gebanned tot</label>
              <Input
                type="datetime-local"
                value={bannedUntil}
                onChange={(e) => setBannedUntil(e.target.value)}
              />
            </div>
          )}

          <div>
            <label className="text-sm font-medium">Reden</label>
            <Textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Beschrijf waarom deze gebruiker wordt gebanned..."
              className="min-h-[100px]"
            />
          </div>

          <Button 
            onClick={() => banMutation.mutate()}
            disabled={!userId || !reason || banMutation.isPending}
            variant="destructive"
          >
            <Ban className="h-4 w-4 me-2" />
            Gebruiker Bannen
          </Button>
        </CardContent>
      </Card>

      {bans && bans.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Actieve Bans</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {bans.map((ban) => (
                <div key={ban.id} className="border-l-4 border-red-500 pl-4 py-2">
                  <div className="flex items-start justify-between">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <p className="font-medium">Gebruiker</p>
                        <Badge variant={ban.ban_type === 'permanent' ? 'destructive' : 'default'}>
                          {ban.ban_type}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">{ban.reason}</p>
                      {ban.banned_until && (
                        <p className="text-xs text-muted-foreground">
                          Tot: {format(new Date(ban.banned_until), 'PPp', { locale: nl })}
                        </p>
                      )}
                    </div>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        const liftReason = prompt("Reden voor opheffen ban:");
                        if (liftReason) {
                          liftMutation.mutate({ banId: ban.id, liftReason });
                        }
                      }}
                    >
                      <CheckCircle className="h-4 w-4 mr-2" />
                      Ophef Ban
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
