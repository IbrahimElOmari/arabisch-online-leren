import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useParams } from "react-router-dom";
import { SupportService } from "@/services/supportService";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, Send } from "lucide-react";
import { format } from "date-fns";
import { nl } from "date-fns/locale";
import { useState } from "react";
import { toast } from "sonner";
import { Separator } from "@/components/ui/separator";

export function TicketDetail() {
  const { ticketId } = useParams<{ ticketId: string }>();
  const queryClient = useQueryClient();
  const [message, setMessage] = useState("");

  const { data: ticket, isLoading: ticketLoading } = useQuery({
    queryKey: ['support-ticket', ticketId],
    queryFn: () => SupportService.getTicket(ticketId!),
    enabled: !!ticketId,
  });

  const { data: messages, isLoading: messagesLoading } = useQuery({
    queryKey: ['support-messages', ticketId],
    queryFn: () => SupportService.getTicketMessages(ticketId!),
    enabled: !!ticketId,
  });

  const sendMessageMutation = useMutation({
    mutationFn: (message: string) => 
      SupportService.sendMessage({
        ticket_id: ticketId!,
        message,
      }),
    onSuccess: () => {
      setMessage("");
      toast.success("Bericht verzonden");
      queryClient.invalidateQueries({ queryKey: ['support-messages', ticketId] });
    },
    onError: () => {
      toast.error("Fout bij verzenden bericht");
    },
  });

  const handleSendMessage = () => {
    if (message.trim()) {
      sendMessageMutation.mutate(message);
    }
  };

  if (ticketLoading || messagesLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (!ticket) {
    return (
      <Card>
        <CardContent className="py-8 text-center">
          <p className="text-muted-foreground">Ticket niet gevonden</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-start justify-between">
            <div className="space-y-1">
              <CardTitle className="text-2xl">{ticket.subject}</CardTitle>
              <p className="text-sm text-muted-foreground">
                {ticket.ticket_number} · {format(new Date(ticket.created_at), 'PPP', { locale: nl })}
              </p>
            </div>
            <div className="flex gap-2">
              <Badge>{ticket.priority}</Badge>
              <Badge>{ticket.status}</Badge>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <p className="text-sm whitespace-pre-wrap">{ticket.description}</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Berichten</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {messages && messages.length > 0 ? (
            messages.map((msg, index) => (
              <div key={msg.id}>
                {index > 0 && <Separator className="my-4" />}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-sm">
                      Gebruiker
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {format(new Date(msg.created_at), 'PPp', { locale: nl })}
                    </span>
                  </div>
                  <p className="text-sm whitespace-pre-wrap">{msg.message}</p>
                </div>
              </div>
            ))
          ) : (
            <p className="text-sm text-muted-foreground text-center py-4">
              Nog geen berichten
            </p>
          )}

          <Separator className="my-4" />

          <div className="space-y-2">
            <Textarea
              placeholder="Type je bericht..."
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              className="min-h-[100px]"
            />
            <Button 
              onClick={handleSendMessage}
              disabled={!message.trim() || sendMessageMutation.isPending}
            >
              <Send className="h-4 w-4 mr-2" />
              Verzenden
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
