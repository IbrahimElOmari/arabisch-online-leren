import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { KnowledgeBaseService } from "@/services/supportService";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Loader2, Search, BookOpen } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useNavigate } from "react-router-dom";

export function KnowledgeBase() {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");
  
  const { data: articles, isLoading } = useQuery({
    queryKey: ['kb-articles', searchQuery],
    queryFn: () => searchQuery 
      ? KnowledgeBaseService.searchArticles(searchQuery)
      : KnowledgeBaseService.getPublishedArticles(),
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="relative">
        <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Zoek in de knowledge base..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10"
        />
      </div>

      {!articles || articles.length === 0 ? (
        <Card>
          <CardContent className="py-8 text-center">
            <BookOpen className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <p className="text-muted-foreground">
              {searchQuery ? "Geen artikelen gevonden." : "Geen artikelen beschikbaar."}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {articles.map((article) => (
            <Card 
              key={article.id} 
              className="cursor-pointer hover:shadow-md transition-shadow"
              onClick={() => navigate(`/support/kb/${article.slug}`)}
            >
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="space-y-1 flex-1">
                    <CardTitle className="text-lg">{article.title}</CardTitle>
                    {article.excerpt && (
                      <CardDescription className="line-clamp-2">
                        {article.excerpt}
                      </CardDescription>
                    )}
                  </div>
                  <Badge variant="outline">{article.category}</Badge>
                </div>
              </CardHeader>
              {article.tags && article.tags.length > 0 && (
                <CardContent>
                  <div className="flex flex-wrap gap-2">
                    {article.tags.map((tag) => (
                      <Badge key={tag} variant="secondary" className="text-xs">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                </CardContent>
              )}
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
