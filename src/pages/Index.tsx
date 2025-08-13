
import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/components/auth/AuthProvider';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  BookOpen, 
  Users, 
  Star, 
  CheckCircle, 
  Globe, 
  Clock, 
  Play,
  Trophy,
  Heart,
  ArrowRight,
  Sparkles,
  Target,
  Award
} from 'lucide-react';

const Index = () => {
  const { user, loading, authReady } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (user && authReady && !loading) {
      navigate('/dashboard');
    }
  }, [user, loading, authReady, navigate]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-lg">Laden...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section - Revolutionair ontwerp */}
      <section className="relative overflow-hidden bg-gradient-to-br from-primary/5 via-secondary/10 to-accent/5">
        <div className="absolute inset-0 bg-grid-white/[0.02] bg-[size:50px_50px]" />
        <div className="relative max-w-7xl mx-auto px-4 py-24 sm:py-32">
          <div className="text-center space-y-8">
            <div className="flex justify-center mb-6">
              <Badge variant="secondary" className="px-4 py-2 text-sm font-medium">
                <Sparkles className="h-4 w-4 mr-2" />
                Nieuw: Interactieve Live Lessen
              </Badge>
            </div>
            
            <h1 className="text-4xl sm:text-6xl lg:text-7xl font-bold text-foreground tracking-tight">
              Ontdek de{' '}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-primary/60">
                Schoonheid
              </span>
              <br />
              van het Arabisch
            </h1>
            
            <p className="mx-auto max-w-3xl text-xl sm:text-2xl text-muted-foreground leading-relaxed">
              Verbind je met je wortels door de rijke Arabische taal te leren. 
              Onze platform biedt persoonlijke begeleiding, interactieve lessen 
              en een ondersteunende gemeenschap.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center pt-8">
              <Button 
                size="lg" 
                className="text-lg px-8 py-4 h-14 shadow-lg hover:shadow-xl transition-all duration-200"
                onClick={() => navigate('/auth')}
              >
                <Play className="mr-2 h-5 w-5" />
                Begin Je Reis
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
              <Button 
                size="lg" 
                variant="outline" 
                className="text-lg px-8 py-4 h-14 border-2"
                onClick={() => navigate('/visie')}
              >
                <Heart className="mr-2 h-5 w-5" />
                Onze Visie
              </Button>
            </div>

            {/* Trust Indicators */}
            <div className="pt-12 grid grid-cols-2 sm:grid-cols-4 gap-8 text-center">
              <div className="space-y-2">
                <div className="text-3xl font-bold text-primary">500+</div>
                <div className="text-sm text-muted-foreground">Actieve Leerlingen</div>
              </div>
              <div className="space-y-2">
                <div className="text-3xl font-bold text-primary">15+</div>
                <div className="text-sm text-muted-foreground">Ervaren Docenten</div>
              </div>
              <div className="space-y-2">
                <div className="text-3xl font-bold text-primary">1000+</div>
                <div className="text-sm text-muted-foreground">Voltooide Lessen</div>
              </div>
              <div className="space-y-2">
                <div className="text-3xl font-bold text-primary">4.9/5</div>
                <div className="text-sm text-muted-foreground">Tevredenheid</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Vision Section - Verbeterd */}
      <section className="py-20 bg-card/30">
        <div className="max-w-6xl mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-foreground mb-6">
              Onze Missie & Visie
            </h2>
            <div className="w-24 h-1 bg-primary mx-auto rounded-full"></div>
          </div>
          
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="space-y-6">
              <div className="flex items-start gap-4">
                <div className="flex-shrink-0 w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
                  <Target className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <h3 className="text-xl font-semibold mb-2">Onze Missie</h3>
                  <p className="text-muted-foreground leading-relaxed">
                    Een generatie jongeren begeleiden die zelfverzekerd schakelt tussen Europese steden 
                    en de diepe rijkdom van Arabische verhalen. Ons platform is een kompas naar culturele verbinding.
                  </p>
                </div>
              </div>
              
              <div className="flex items-start gap-4">
                <div className="flex-shrink-0 w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
                  <Award className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <h3 className="text-xl font-semibold mb-2">Kwaliteit Voorop</h3>
                  <p className="text-muted-foreground leading-relaxed">
                    We bieden kwalitatief Arabisch onderwijs dat verder gaat dan taal alleen – 
                    het is een brug naar historische ontdekkingen en islamitische identiteit.
                  </p>
                </div>
              </div>
            </div>
            
            <Card className="p-8 bg-gradient-to-br from-primary/5 to-secondary/10 border-primary/20">
              <CardContent className="p-0">
                <div className="text-center space-y-4">
                  <Trophy className="h-16 w-16 text-primary mx-auto" />
                  <h3 className="text-2xl font-bold">Waarom Kiezen Voor Ons?</h3>
                  <ul className="space-y-3 text-left">
                    <li className="flex items-center gap-3">
                      <CheckCircle className="h-5 w-5 text-primary flex-shrink-0" />
                      <span>Persoonlijke begeleiding van native speakers</span>
                    </li>
                    <li className="flex items-center gap-3">
                      <CheckCircle className="h-5 w-5 text-primary flex-shrink-0" />
                      <span>Flexibele online lessen en live sessies</span>
                    </li>
                    <li className="flex items-center gap-3">
                      <CheckCircle className="h-5 w-5 text-primary flex-shrink-0" />
                      <span>Interactieve oefeningen en voortgangstracking</span>
                    </li>
                    <li className="flex items-center gap-3">
                      <CheckCircle className="h-5 w-5 text-primary flex-shrink-0" />
                      <span>Ondersteunende leergemeenschap</span>
                    </li>
                  </ul>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Features Section - Modernized */}
      <section className="py-20 bg-background">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-foreground mb-6">
              Waarom Duizenden Studenten Voor Ons Kiezen
            </h2>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
              Ontdek de voordelen van ons innovatieve leerplatform
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[
              {
                icon: Users,
                title: "Ervaren Native Speakers",
                description: "Leer van gecertificeerde docenten die gepassioneerd zijn over het onderwijzen van Arabisch en hun cultuur.",
                color: "text-blue-500"
              },
              {
                icon: Clock,
                title: "Flexibele Schema's",
                description: "Plan je lessen wanneer het jou uitkomt met onze 24/7 toegankelijke platform en flexibele live sessies.",
                color: "text-green-500"
              },
              {
                icon: BookOpen,
                title: "Interactieve Methoden",
                description: "Geniet van multimedia lessen, gamification en praktische oefeningen die het leren tot een avontuur maken.",
                color: "text-purple-500"
              },
              {
                icon: CheckCircle,
                title: "Voortgang Tracking",
                description: "Volg je ontwikkeling met gedetailleerde rapporten, certificates en persoonlijke feedback van docenten.",
                color: "text-orange-500"
              },
              {
                icon: Globe,
                title: "Wereldwijde Toegang",
                description: "Leer vanuit elke locatie met onze cloud-based platform die werkt op alle apparaten.",
                color: "text-cyan-500"
              },
              {
                icon: Star,
                title: "Excellentie Garantie",
                description: "Hoogwaardige content, continue updates en een team dat zich inzet voor jouw succes.",
                color: "text-yellow-500"
              }
            ].map((feature, index) => (
              <Card key={index} className="group hover:shadow-lg transition-all duration-300 hover:-translate-y-1 border-l-4 border-l-transparent hover:border-l-primary">
                <CardHeader className="text-center pb-4">
                  <div className={`w-16 h-16 ${feature.color} mx-auto mb-4 p-3 bg-muted rounded-full flex items-center justify-center group-hover:scale-110 transition-transform duration-300`}>
                    <feature.icon className="h-8 w-8" />
                  </div>
                  <CardTitle className="text-xl group-hover:text-primary transition-colors">
                    {feature.title}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-center leading-relaxed">
                    {feature.description}
                  </CardDescription>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section - Enhanced */}
      <section className="py-20 bg-gradient-to-r from-primary/10 via-secondary/10 to-primary/10">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <div className="space-y-8">
            <h2 className="text-3xl sm:text-4xl font-bold text-foreground">
              Klaar Om Je Arabische Avontuur Te Beginnen?
            </h2>
            <p className="text-xl text-muted-foreground leading-relaxed">
              Sluit je aan bij een groeiende gemeenschap van gepassioneerde leerlingen 
              en ontdek de schoonheid van de Arabische taal en cultuur.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
              <Button 
                size="lg" 
                className="text-lg px-8 py-4 h-14 shadow-lg hover:shadow-xl transition-all duration-200"
                onClick={() => navigate('/auth')}
              >
                <BookOpen className="mr-2 h-5 w-5" />
                Start Vandaag
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
              <Button 
                size="lg" 
                variant="outline" 
                className="text-lg px-8 py-4 h-14 border-2"
                onClick={() => navigate('/visie')}
              >
                <Heart className="mr-2 h-5 w-5" />
                Meer Over Ons
              </Button>
            </div>

            <div className="pt-8 text-sm text-muted-foreground">
              <p>✨ Geen verborgen kosten • 🎯 Persoonlijke begeleiding • 🏆 Certificaten inbegrepen</p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer - Simplified */}
      <footer className="bg-card border-t border-border py-12">
        <div className="max-w-7xl mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div className="md:col-span-2">
              <div className="flex items-center gap-2 mb-4">
                <BookOpen className="h-6 w-6 text-primary" />
                <span className="text-xl font-bold">Leer Arabisch</span>
              </div>
              <p className="text-muted-foreground leading-relaxed mb-4">
                Ontdek de schoonheid van het Arabisch met onze innovatieve online leerplatform. 
                Van beginners tot gevorderden, wij begeleiden je op elke stap van je leerreis.
              </p>
            </div>
            
            <div>
              <h3 className="font-semibold mb-3">Platform</h3>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><button onClick={() => navigate('/visie')} className="hover:text-primary transition-colors">Onze Visie</button></li>
                <li><button onClick={() => navigate('/calendar')} className="hover:text-primary transition-colors">Kalender</button></li>
                <li><button onClick={() => navigate('/auth')} className="hover:text-primary transition-colors">Registreren</button></li>
              </ul>
            </div>
            
            <div>
              <h3 className="font-semibold mb-3">Juridisch</h3>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><button onClick={() => navigate('/privacy-policy')} className="hover:text-primary transition-colors">Privacy</button></li>
                <li><button onClick={() => navigate('/terms-of-service')} className="hover:text-primary transition-colors">Voorwaarden</button></li>
              </ul>
            </div>
          </div>
          
          <div className="border-t border-border mt-8 pt-8 text-center text-sm text-muted-foreground">
            <p>© 2024 Leer Arabisch Online. Met ❤️ gemaakt voor onze gemeenschap.</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Index;
