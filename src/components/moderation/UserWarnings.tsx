import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { ModerationService } from "@/services/supportService";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { AlertTriangle } from "lucide-react";
import { format } from "date-fns";
import { nl } from "date-fns/locale";

export function UserWarnings() {
  const queryClient = useQueryClient();
  const [userId, setUserId] = useState("");
  const [reason, setReason] = useState("");
  const [severity, setSeverity] = useState<"minor" | "moderate" | "severe">("moderate");

  const issueMutation = useMutation({
    mutationFn: () => ModerationService.issueWarning(userId, reason, severity),
    onSuccess: () => {
      toast.success("Waarschuwing toegevoegd");
      setUserId("");
      setReason("");
      setSeverity("moderate");
      queryClient.invalidateQueries({ queryKey: ['user-warnings'] });
    },
    onError: () => {
      toast.error("Fout bij toevoegen waarschuwing");
    },
  });

  const { data: warnings } = useQuery({
    queryKey: ['user-warnings', userId],
    queryFn: () => userId ? ModerationService.getUserWarnings(userId) : Promise.resolve([]),
    enabled: !!userId,
  });

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Nieuwe Waarschuwing</CardTitle>
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
            <label className="text-sm font-medium">Ernst</label>
            <Select value={severity} onValueChange={(v: any) => setSeverity(v)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="minor">Licht</SelectItem>
                <SelectItem value="moderate">Gemiddeld</SelectItem>
                <SelectItem value="severe">Ernstig</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <label className="text-sm font-medium">Reden</label>
            <Textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Beschrijf waarom deze waarschuwing wordt gegeven..."
              className="min-h-[100px]"
            />
          </div>

          <Button 
            onClick={() => issueMutation.mutate()}
            disabled={!userId || !reason || issueMutation.isPending}
          >
            <AlertTriangle className="h-4 w-4 mr-2" />
            Waarschuwing Toevoegen
          </Button>
        </CardContent>
      </Card>

      {warnings && warnings.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Waarschuwingen voor deze gebruiker</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {warnings.map((warning) => (
                <div key={warning.id} className="border-l-4 border-yellow-500 pl-4 py-2">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="font-medium">{warning.severity}</p>
                      <p className="text-sm text-muted-foreground">{warning.reason}</p>
                    </div>
                    <span className="text-xs text-muted-foreground">
                      {format(new Date(warning.created_at), 'PPp', { locale: nl })}
                    </span>
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
