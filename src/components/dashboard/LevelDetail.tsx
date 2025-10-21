import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  BookOpen, 
  Archive, 
  MessageSquare, 
  Calendar, 
  BarChart3, 
  Video,
  Radio,
  FileText,
  CheckCircle2,
  Clock
} from 'lucide-react';
import { TaskSystem } from '@/components/tasks/TaskSystem';
import { LevelQuestions } from '@/components/tasks/LevelQuestions';

interface LevelDetailProps {
  levelId: string;
  levelName: string;
  className: string;
  onBack: () => void;
}

export const LevelDetail = ({ levelId, levelName, className, onBack }: LevelDetailProps) => {
  const [activeTab, setActiveTab] = useState('preparation');

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="outline" onClick={onBack}>
          ← Terug naar niveaus
        </Button>
        <div>
          <h2 className="text-2xl font-bold text-foreground">{levelName}</h2>
          <p className="text-muted-foreground">{className}</p>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="preparation" className="flex items-center gap-2">
            <BookOpen className="h-4 w-4" />
            <span className="hidden sm:inline">Voorbereiding</span>
          </TabsTrigger>
          <TabsTrigger value="archive" className="flex items-center gap-2">
            <Archive className="h-4 w-4" />
            <span className="hidden sm:inline">Archief</span>
          </TabsTrigger>
          <TabsTrigger value="forum" className="flex items-center gap-2">
            <MessageSquare className="h-4 w-4" />
            <span className="hidden sm:inline">Forum</span>
          </TabsTrigger>
          <TabsTrigger value="calendar" className="flex items-center gap-2">
            <Calendar className="h-4 w-4" />
            <span className="hidden sm:inline">Kalender</span>
          </TabsTrigger>
          <TabsTrigger value="evaluation" className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4" />
            <span className="hidden sm:inline">Evaluatie</span>
          </TabsTrigger>
          <TabsTrigger value="tasks" className="flex items-center gap-2">
            <FileText className="h-4 w-4" />
            <span className="hidden sm:inline">Taken & Vragen</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="preparation" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Video className="h-5 w-5" />
                Voorbereidende Video
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="aspect-video bg-muted rounded-lg flex items-center justify-center mb-4">
                <p className="text-muted-foreground">YouTube video wordt hier geladen</p>
              </div>
              <Badge variant="outline" className="mb-2">Les 1 - Introductie</Badge>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Interactieve Vragen
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <h4 className="font-medium">Vraag 1: Open vraag</h4>
                <textarea 
                  className="w-full p-3 border border-input rounded-md resize-none"
                  rows={3}
                  placeholder="Typ hier je antwoord..."
                />
              </div>

              <div className="space-y-3">
                <h4 className="font-medium">Vraag 2: Enkelvoudige keuze</h4>
                <div className="space-y-2">
                  <label className="flex items-center gap-2">
                    <input type="radio" name="single" value="a" />
                    <span>Optie A</span>
                  </label>
                  <label className="flex items-center gap-2">
                    <input type="radio" name="single" value="b" />
                    <span>Optie B</span>
                  </label>
                  <label className="flex items-center gap-2">
                    <input type="radio" name="single" value="c" />
                    <span>Optie C</span>
                  </label>
                </div>
              </div>

              <div className="space-y-3">
                <h4 className="font-medium">Vraag 3: Meervoudige keuze</h4>
                <div className="space-y-2">
                  <label className="flex items-center gap-2">
                    <input type="checkbox" />
                    <span>Optie 1</span>
                  </label>
                  <label className="flex items-center gap-2">
                    <input type="checkbox" />
                    <span>Optie 2</span>
                  </label>
                  <label className="flex items-center gap-2">
                    <input type="checkbox" />
                    <span>Optie 3</span>
                  </label>
                </div>
              </div>

              <div className="space-y-3">
                <h4 className="font-medium flex items-center gap-2">
                  <Radio className="h-4 w-4" />
                  Vraag 4: Gebaseerd op audio
                </h4>
                <div className="bg-muted p-4 rounded-lg">
                  <audio controls className="w-full">
                    <source src="#" type="audio/mpeg" />
                    Je browser ondersteunt geen audio element.
                  </audio>
                </div>
                <textarea 
                  className="w-full p-3 border border-input rounded-md resize-none"
                  rows={2}
                  placeholder="Wat hoorde je in het audiofragment?"
                />
              </div>

              <Button className="w-full">
                <CheckCircle2 className="h-4 w-4 me-2" />
                Antwoorden Indienen
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="tasks" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Taken voor {levelName}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <TaskSystem levelId={levelId} levelName={levelName} />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Radio className="h-5 w-5" />
                Vragen voor {levelName}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <LevelQuestions levelId={levelId} />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="archive" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Archive className="h-5 w-5" />
                Lessen Archief - {levelName}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {[1, 2, 3, 4].map((lessonNum) => (
                  <div key={lessonNum} className="flex items-center justify-between p-3 border border-border rounded-lg">
                    <div className="flex items-center gap-3">
                      <Video className="h-5 w-5 text-primary" />
                      <div>
                        <h4 className="font-medium">Les {lessonNum}</h4>
                        <p className="text-sm text-muted-foreground">Geüpload op 15 maart 2024</p>
                      </div>
                    </div>
                    <Button variant="outline" size="sm">Bekijken</Button>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="forum" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MessageSquare className="h-5 w-5" />
                Klas Forum
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="p-4 border border-border rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center text-primary-foreground text-sm font-medium">
                      A
                    </div>
                    <div>
                      <p className="font-medium">Ahmed</p>
                      <p className="text-xs text-muted-foreground">2 uur geleden</p>
                    </div>
                  </div>
                  <p className="text-sm">Heeft iemand hulp nodig bij de uitspraak van de letter ض?</p>
                </div>
                
                <div className="p-4 border border-border rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-8 h-8 bg-secondary rounded-full flex items-center justify-center text-secondary-foreground text-sm font-medium">
                      F
                    </div>
                    <div>
                      <p className="font-medium">Fatima (Leerkracht)</p>
                      <p className="text-xs text-muted-foreground">1 dag geleden</p>
                    </div>
                  </div>
                  <p className="text-sm">Vergeet niet om jullie voorbereiding af te ronden voor de live les van morgen!</p>
                </div>
              </div>
              
              <div className="mt-4">
                <textarea 
                  className="w-full p-3 border border-input rounded-md resize-none"
                  rows={3}
                  placeholder="Schrijf een bericht..."
                />
                <Button className="mt-2">Bericht Plaatsen</Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="calendar" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Persoonlijke Kalender
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center gap-3 p-3 border border-border rounded-lg">
                  <Clock className="h-5 w-5 text-blue-500" />
                  <div>
                    <p className="font-medium">Live Les - {levelName}</p>
                    <p className="text-sm text-muted-foreground">Morgen, 19:00 - 20:00</p>
                  </div>
                  <Badge>Aankomend</Badge>
                </div>
                
                <div className="flex items-center gap-3 p-3 border border-border rounded-lg">
                  <FileText className="h-5 w-5 text-orange-500" />
                  <div>
                    <p className="font-medium">Voorbereiding Deadline</p>
                    <p className="text-sm text-muted-foreground">Over 3 dagen</p>
                  </div>
                  <Badge variant="outline">Deadline</Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="evaluation" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5" />
                Permanente Evaluatie - {levelName}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <div className="text-center p-4 border border-border rounded-lg">
                  <div className="text-2xl font-bold text-green-600">85%</div>
                  <p className="text-sm text-muted-foreground">Gemiddelde Score</p>
                </div>
                <div className="text-center p-4 border border-border rounded-lg">
                  <div className="text-2xl font-bold text-blue-600">12/15</div>
                  <p className="text-sm text-muted-foreground">Voltooide Lessen</p>
                </div>
                <div className="text-center p-4 border border-border rounded-lg">
                  <div className="text-2xl font-bold text-purple-600">92%</div>
                  <p className="text-sm text-muted-foreground">Aanwezigheid</p>
                </div>
              </div>
              
              <div className="space-y-3">
                <h4 className="font-medium">Voortgang per vaardigheid</h4>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Luistervaardigheid</span>
                    <span>90%</span>
                  </div>
                  <div className="w-full bg-muted rounded-full h-2">
                    <div className="bg-blue-600 h-2 rounded-full" style={{width: '90%'}}></div>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Spreekvaardigheid</span>
                    <span>75%</span>
                  </div>
                  <div className="w-full bg-muted rounded-full h-2">
                    <div className="bg-green-600 h-2 rounded-full" style={{width: '75%'}}></div>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Leesvaardigheid</span>
                    <span>88%</span>
                  </div>
                  <div className="w-full bg-muted rounded-full h-2">
                    <div className="bg-purple-600 h-2 rounded-full" style={{width: '88%'}}></div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};