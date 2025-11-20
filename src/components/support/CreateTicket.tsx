import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { SupportService, createTicketSchema } from "@/services/supportService";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import { z } from "zod";

export function CreateTicket() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  
  const form = useForm<z.infer<typeof createTicketSchema>>({
    resolver: zodResolver(createTicketSchema),
    defaultValues: {
      subject: "",
      description: "",
      category: "other",
      priority: "medium",
    },
  });

  const createMutation = useMutation({
    mutationFn: SupportService.createTicket,
    onSuccess: (ticket) => {
      toast.success("Ticket aangemaakt!");
      queryClient.invalidateQueries({ queryKey: ['support-tickets'] });
      navigate(`/support/ticket/${ticket.id}`);
    },
    onError: () => {
      toast.error("Fout bij aanmaken ticket");
    },
  });

  const onSubmit = (values: z.infer<typeof createTicketSchema>) => {
    createMutation.mutate(values);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Nieuw Support Ticket</CardTitle>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="subject"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Onderwerp</FormLabel>
                  <FormControl>
                    <Input placeholder="Korte beschrijving van het probleem" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="category"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Categorie</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecteer een categorie" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="technical">Technisch</SelectItem>
                      <SelectItem value="billing">Facturatie</SelectItem>
                      <SelectItem value="content">Inhoud</SelectItem>
                      <SelectItem value="account">Account</SelectItem>
                      <SelectItem value="other">Anders</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="priority"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Prioriteit</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecteer prioriteit" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="low">Laag</SelectItem>
                      <SelectItem value="medium">Gemiddeld</SelectItem>
                      <SelectItem value="high">Hoog</SelectItem>
                      <SelectItem value="urgent">Urgent</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Beschrijving</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Beschrijf je probleem zo gedetailleerd mogelijk..."
                      className="min-h-[200px]"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <Button type="submit" disabled={createMutation.isPending}>
              {createMutation.isPending ? "Bezig..." : "Ticket Aanmaken"}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
