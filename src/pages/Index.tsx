import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/components/auth/AuthProvider';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { BookOpen, Users, Star, CheckCircle, Globe, Clock } from 'lucide-react';

const Index = () => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (user && !loading) {
      navigate('/dashboard');
    }
  }, [user, loading, navigate]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-lg">Laden...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-primary/10 via-secondary/20 to-accent/10 py-20">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <h1 className="text-5xl md:text-6xl font-bold text-foreground mb-6">
            Leer de Arabische Taal Online
          </h1>
          <p className="text-xl md:text-2xl text-muted-foreground mb-8 max-w-3xl mx-auto">
            Ontdek de schoonheid van het Arabisch met onze interactieve online lessen, 
            ervaren leerkrachten en een ondersteunende leergemeenschap.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button 
              size="lg" 
              className="text-lg px-8 py-4"
              onClick={() => navigate('/auth')}
            >
              Registreren
            </Button>
            <Button 
              size="lg" 
              variant="outline" 
              className="text-lg px-8 py-4"
              onClick={() => navigate('/auth')}
            >
              Inloggen
            </Button>
          </div>
        </div>
      </section>

      {/* Vision Section */}
      <section className="py-16 bg-card/50">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold text-foreground mb-6">Onze Visie</h2>
          <div className="space-y-4 text-lg text-muted-foreground leading-relaxed">
            <p>
              Stel je voor: een generatie jongeren die zelfverzekerd schakelt tussen de bruisende Europese steden en de diepe rijkdom van Arabische verhalen. Ons platform is een online kompas dat jongeren en gezinnen begeleidt om trots hun wortels te ontdekken.
            </p>
            <p>
              We bieden kwalitatief Arabisch onderwijs dat verder gaat dan taal alleen – het is een brug naar culturele verbinding, historische ontdekkingen en het verdiepen van een islamitische identiteit.
            </p>
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="py-16 bg-background">
        <div className="max-w-7xl mx-auto px-4">
          <h2 className="text-3xl font-bold text-center text-foreground mb-12">
            Waarom Kiezen Voor Ons Platform?
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            <Card className="text-center">
              <CardHeader>
                <Users className="h-12 w-12 text-primary mx-auto mb-4" />
                <CardTitle>Ervaren Leerkrachten</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription>
                  Leer van native speakers en ervaren docenten die gepassioneerd zijn over het onderwijzen van Arabisch.
                </CardDescription>
              </CardContent>
            </Card>

            <Card className="text-center">
              <CardHeader>
                <Clock className="h-12 w-12 text-primary mx-auto mb-4" />
                <CardTitle>Flexibele Schema's</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription>
                  Plan je lessen wanneer het jou uitkomt met onze flexibele online platform en live sessies.
                </CardDescription>
              </CardContent>
            </Card>

            <Card className="text-center">
              <CardHeader>
                <BookOpen className="h-12 w-12 text-primary mx-auto mb-4" />
                <CardTitle>Interactieve Lessen</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription>
                  Geniet van video lessen, live sessies en interactieve oefeningen die het leren leuk maken.
                </CardDescription>
              </CardContent>
            </Card>

            <Card className="text-center">
              <CardHeader>
                <CheckCircle className="h-12 w-12 text-primary mx-auto mb-4" />
                <CardTitle>Voortgang Tracking</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription>
                  Volg je vooruitgang met gedetailleerde rapporten en aanwezigheidsregistratie.
                </CardDescription>
              </CardContent>
            </Card>

            <Card className="text-center">
              <CardHeader>
                <Globe className="h-12 w-12 text-primary mx-auto mb-4" />
                <CardTitle>Online Toegankelijkheid</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription>
                  Leer vanuit het comfort van je eigen huis met onze volledig online platform.
                </CardDescription>
              </CardContent>
            </Card>

            <Card className="text-center">
              <CardHeader>
                <Star className="h-12 w-12 text-primary mx-auto mb-4" />
                <CardTitle>Kwaliteitsgarantie</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription>
                  Hoogwaardige content en begeleiding om je Arabische taalvaardigheden te perfectioneren.
                </CardDescription>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 bg-primary/5">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold text-foreground mb-6">
            Klaar om je Arabische reis te beginnen?
          </h2>
          <p className="text-lg text-muted-foreground mb-8">
            Sluit je aan bij duizenden studenten die al hun Arabische vaardigheden verbeteren met ons platform.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button 
              size="lg" 
              className="text-lg px-8 py-4"
              onClick={() => navigate('/auth')}
            >
              Nu Beginnen
            </Button>
            <Button 
              size="lg" 
              variant="outline" 
              className="text-lg px-8 py-4"
              onClick={() => navigate('/auth')}
            >
              Meer Informatie
            </Button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-card border-t border-border py-8">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <p className="text-muted-foreground">
            © 2024 Leer Arabisch Online. Alle rechten voorbehouden.
          </p>
        </div>
      </footer>
    </div>
  );
};

export default Index;
