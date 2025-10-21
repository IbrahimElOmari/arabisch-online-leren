
import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Calendar, Clock, User, Video, MessageCircle, Star } from 'lucide-react';

interface Mentor {
  id: string;
  name: string;
  avatar?: string;
  expertise: string[];
  rating: number;
  totalSessions: number;
  languages: string[];
  availability: {
    day: string;
    time: string;
    available: boolean;
  }[];
}

interface MentorSystemProps {
  mentors: Mentor[];
  onBookSession: (mentorId: string, timeSlot: string) => void;
}

export const MentorSystem = ({ mentors, onBookSession }: MentorSystemProps) => {
  const [, setSelectedMentor] = useState<Mentor | null>(null);

  const formatRating = (rating: number) => {
    return '★'.repeat(Math.floor(rating)) + '☆'.repeat(5 - Math.floor(rating));
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            Beschikbare Mentoren
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {mentors.map((mentor) => (
              <Card key={mentor.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-4">
                  <div className="flex items-center gap-3 mb-3">
                    <Avatar>
                      <AvatarImage src={mentor.avatar} />
                      <AvatarFallback>{mentor.name.charAt(0)}</AvatarFallback>
                    </Avatar>
                    <div>
                      <h3 className="font-medium">{mentor.name}</h3>
                      <div className="flex items-center gap-1 text-sm text-muted-foreground">
                        <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                        <span>{mentor.rating.toFixed(1)}</span>
                        <span>({mentor.totalSessions} sessies)</span>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2 mb-4">
                    <div className="flex flex-wrap gap-1">
                      {mentor.expertise.slice(0, 3).map((skill) => (
                        <Badge key={skill} variant="secondary" className="text-xs">
                          {skill}
                        </Badge>
                      ))}
                      {mentor.expertise.length > 3 && (
                        <Badge variant="outline" className="text-xs">
                          +{mentor.expertise.length - 3}
                        </Badge>
                      )}
                    </div>
                    
                    <div className="flex flex-wrap gap-1">
                      {mentor.languages.map((lang) => (
                        <Badge key={lang} variant="outline" className="text-xs">
                          {lang}
                        </Badge>
                      ))}
                    </div>
                  </div>

                  <Dialog>
                    <DialogTrigger asChild>
                      <Button 
                        className="w-full" 
                        size="sm"
                        onClick={() => setSelectedMentor(mentor)}
                      >
                        <Calendar className="h-4 w-4 me-2" />
                        Sessie Boeken
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-md">
                      <DialogHeader>
                        <DialogTitle>Sessie boeken met {mentor.name}</DialogTitle>
                      </DialogHeader>
                      <div className="space-y-4">
                        <div className="flex items-center gap-3">
                          <Avatar>
                            <AvatarImage src={mentor.avatar} />
                            <AvatarFallback>{mentor.name.charAt(0)}</AvatarFallback>
                          </Avatar>
                          <div>
                            <h4 className="font-medium">{mentor.name}</h4>
                            <p className="text-sm text-muted-foreground">
                              {formatRating(mentor.rating)} ({mentor.totalSessions} sessies)
                            </p>
                          </div>
                        </div>

                        <div>
                          <h5 className="font-medium mb-2">Beschikbare tijden:</h5>
                          <div className="space-y-2">
                            {mentor.availability
                              .filter(slot => slot.available)
                              .map((slot, index) => (
                                <Button
                                  key={index}
                                  variant="outline"
                                  className="w-full justify-start"
                                  onClick={() => onBookSession(mentor.id, `${slot.day} ${slot.time}`)}
                                >
                                  <Clock className="h-4 w-4 me-2" />
                                  {slot.day} om {slot.time}
                                </Button>
                              ))}
                          </div>
                        </div>

                        <div className="flex gap-2">
                          <Button variant="outline" className="flex-1">
                            <MessageCircle className="h-4 w-4 me-2" />
                            Chat
                          </Button>
                          <Button variant="outline" className="flex-1">
                            <Video className="h-4 w-4 me-2" />
                            Video Call
                          </Button>
                        </div>
                      </div>
                    </DialogContent>
                  </Dialog>
                </CardContent>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
