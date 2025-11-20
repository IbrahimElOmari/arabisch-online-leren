import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { TicketList } from "@/components/support/TicketList";
import { KnowledgeBase } from "@/components/support/KnowledgeBase";
import { CreateTicket } from "@/components/support/CreateTicket";

export default function Support() {
  return (
    <div className="container mx-auto py-8">
      <h1 className="text-3xl font-bold mb-6">Support</h1>
      
      <Tabs defaultValue="tickets" className="w-full">
        <TabsList>
          <TabsTrigger value="tickets">Mijn Tickets</TabsTrigger>
          <TabsTrigger value="knowledge">Knowledge Base</TabsTrigger>
          <TabsTrigger value="new">Nieuw Ticket</TabsTrigger>
        </TabsList>
        
        <TabsContent value="tickets">
          <TicketList />
        </TabsContent>
        
        <TabsContent value="knowledge">
          <KnowledgeBase />
        </TabsContent>
        
        <TabsContent value="new">
          <CreateTicket />
        </TabsContent>
      </Tabs>
    </div>
  );
}
