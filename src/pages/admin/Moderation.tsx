import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { UserWarnings } from "@/components/moderation/UserWarnings";
import { BanManagement } from "@/components/moderation/BanManagement";
import { ReputationOverview } from "@/components/moderation/ReputationOverview";

export default function Moderation() {
  return (
    <div className="container mx-auto py-8">
      <h1 className="text-3xl font-bold mb-6">Community Moderatie</h1>
      
      <Tabs defaultValue="warnings" className="w-full">
        <TabsList>
          <TabsTrigger value="warnings">Waarschuwingen</TabsTrigger>
          <TabsTrigger value="bans">Bans</TabsTrigger>
          <TabsTrigger value="reputation">Reputatie</TabsTrigger>
        </TabsList>
        
        <TabsContent value="warnings">
          <UserWarnings />
        </TabsContent>
        
        <TabsContent value="bans">
          <BanManagement />
        </TabsContent>
        
        <TabsContent value="reputation">
          <ReputationOverview />
        </TabsContent>
      </Tabs>
    </div>
  );
}
