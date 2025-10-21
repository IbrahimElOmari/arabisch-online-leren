
import { ArrowRight, BookOpen, Users, Star, Award, Play, CheckCircle, Globe, Heart, Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CourseCatalog } from '@/components/ui/course-catalog';
import { useNavigate } from 'react-router-dom';
import { useRTLLayout } from '@/hooks/useRTLLayout';
import { useAccessibilityRTL } from '@/hooks/useAccessibilityRTL';
import { useRTLAnimations } from '@/hooks/useRTLAnimations';
import { useTranslation } from '@/contexts/TranslationContext';

const Index = () => {
  const navigate = useNavigate();
  const { getTextAlign, getFlexDirection, isRTL } = useRTLLayout();
  const { getFlexDirection: getAccessibilityFlexDirection, getTextAlign: getAccessibilityTextAlign } = useAccessibilityRTL();
  const { getSlideInAnimation, getStaggerDelay } = useRTLAnimations();
  const { t } = useTranslation();

  const features = [
    {
      icon: BookOpen,
      title: "Interactieve Lessen",
      description: "Leer Arabisch met onze moderne, interactieve lesmethoden die aangepast zijn aan jouw tempo."
    },
    {
      icon: Users,
      title: "Expert Instructeurs", 
      description: "Onze ervaren native speakers begeleiden je stap voor stap naar vloeiend Arabisch."
    },
    {
      icon: Award,
      title: "Gecertificeerde Cursussen",
      description: "Ontvang erkende certificaten die je vooruitgang en kennis officieel bevestigen."
    },
    {
      icon: Globe,
      title: "Culturele Context",
      description: "Ontdek niet alleen de taal, maar ook de rijke cultuur en tradities van de Arabische wereld."
    }
  ];

  const testimonials = [
    {
      name: "Sarah van der Berg",
      role: "Student",
      content: "Dankzij deze platform heb ik in 6 maanden basis Arabisch geleerd. De lessen zijn duidelijk en boeiend!",
      rating: 5
    },
    {
      name: "Ahmed Khalil", 
      role: "Zakenman",
      content: "Perfect voor professionals. De zakelijke Arabische cursus heeft mijn carrière een boost gegeven.",
      rating: 5
    },
    {
      name: "Lisa Janssen",
      role: "Reiziger", 
      content: "Fantastische voorbereiding voor mijn reis naar Marokko. Ik kon me al snel verstaanbaar maken!",
      rating: 4
    }
  ];

  const stats = [
    { number: "2,500+", label: "Tevreden Studenten" },
    { number: "15+", label: "Expert Instructeurs" }, 
    { number: "98%", label: "Slaagpercentage" },
    { number: "24/7", label: "Online Toegang" }
  ];

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-br from-primary/10 via-background to-secondary/10">
        <div className="absolute inset-0 bg-[url('/arabic-pattern-bg.png')] opacity-5"></div>
        <div className="relative max-w-7xl mx-auto px-4 py-20 lg:py-32">
          <div className={`grid lg:grid-cols-2 gap-12 items-center ${getFlexDirection('row')}`}>
            <div className="space-y-8" style={getStaggerDelay(0)}>
              <div className="space-y-6">
                <Badge variant="outline" className={`w-fit px-4 py-2 text-sm font-medium ${getSlideInAnimation('left')}`}>
                  <Star className={`h-4 w-4 fill-yellow-400 text-yellow-400 ${getIconSpacing('2')}`} />
                  {t('hero.topPlatform') || '#1 Platform voor Arabisch Leren'}
                </Badge>
                
                <h1 className={`text-5xl lg:text-7xl font-bold tracking-tight ${getTextAlign()}`}>
                  <span className="bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
                    {isRTL ? 'أهلاً وسهلاً' : 'أهلاً وسهلاً'}
                  </span>
                  <br />
                  <span className="text-foreground">{t('hero.learnArabic') || 'Leer Arabisch'}</span>
                </h1>
                
                <p className={`text-xl text-muted-foreground leading-relaxed max-w-lg ${getTextAlign()}`}>
                  {t('hero.description') || 'Ontdek de schoonheid van de Arabische taal met onze innovatieve, interactieve lesmethoden. Van beginner tot gevorderd - wij begeleiden je reis naar vloeiend Arabisch.'}
                </p>
              </div>

              <div className={`flex flex-col sm:flex-row gap-4 ${getFlexDirection('row')}`}>
                <Button 
                  size="lg" 
                  className="text-lg px-8 py-6 group"
                  onClick={() => navigate('/auth')}
                  aria-label={getAriaLabel('startJourney', 'Begin je Arabische leerreis')}
                >
                  {t('hero.startJourney') || 'Begin Je Reis'}
                  <ArrowRight className={`h-5 w-5 group-hover:translate-x-1 transition-transform ${getIconSpacing('2')}`} />
                </Button>
                
                <Button 
                  variant="outline" 
                  size="lg" 
                  className="text-lg px-8 py-6 group"
                  onClick={() => navigate('/visie')}
                >
                  <Play className="me-2 h-5 w-5 group-hover:scale-110 transition-transform" />
                  Bekijk Demo
                </Button>
              </div>

              {/* Trust Indicators */}
              <div className="flex items-center gap-6 pt-8">
                <div className="flex items-center gap-2">
                  <div className="flex -space-x-2">
                    {[1, 2, 3, 4].map((i) => (
                      <div key={i} className="w-8 h-8 rounded-full bg-primary/20 border-2 border-background"></div>
                    ))}
                  </div>
                  <span className="text-sm text-muted-foreground">2,500+ studenten</span>
                </div>
                
                <div className="flex items-center gap-1">
                  {[1, 2, 3, 4, 5].map((i) => (
                    <Star key={i} className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                  ))}
                  <span className="text-sm text-muted-foreground ms-1">4.9/5 sterren</span>
                </div>
              </div>
            </div>

            <div className="relative">
              <div className="relative z-10 bg-card border rounded-2xl p-8 shadow-2xl">
                <div className="space-y-6">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-semibold">Gratis Proefles</h3>
                    <Badge className="bg-gradient-to-r from-green-500 to-green-600 text-white">
                      Live Nu
                    </Badge>
                  </div>
                  
                  <div className="space-y-4">
                    <div className="flex items-center gap-3">
                      <CheckCircle className="h-5 w-5 text-green-500" />
                      <span className="text-sm">Arabisch alfabet in 30 min</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <CheckCircle className="h-5 w-5 text-green-500" />
                      <span className="text-sm">Basis uitspraak oefeningen</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <CheckCircle className="h-5 w-5 text-green-500" />
                      <span className="text-sm">Eerste woorden & zinnen</span>
                    </div>
                  </div>

                  <Button className="w-full" onClick={() => navigate('/auth')}>
                    Doe Gratis Mee
                    <Heart className="ms-2 h-4 w-4" />
                  </Button>
                  
                  <p className="text-xs text-center text-muted-foreground">
                    Geen verplichtingen • Cancel op elk moment
                  </p>
                </div>
              </div>
              
              {/* Decorative elements */}
              <div className="absolute -top-4 -right-4 w-24 h-24 bg-primary/20 rounded-full blur-xl"></div>
              <div className="absolute -bottom-4 -left-4 w-32 h-32 bg-secondary/20 rounded-full blur-xl"></div>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16 bg-muted/30">
        <div className="max-w-7xl mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {stats.map((stat, index) => (
              <div key={index} className="text-center space-y-2">
                <div className="text-3xl lg:text-4xl font-bold text-primary">
                  {stat.number}
                </div>
                <div className="text-sm lg:text-base text-muted-foreground">
                  {stat.label}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center space-y-4 mb-16">
            <Badge variant="outline" className="px-4 py-2">
              <Zap className="me-2 h-4 w-4" />
              Waarom Kiezen Voor Ons
            </Badge>
            <h2 className="text-4xl lg:text-5xl font-bold tracking-tight">
              De Beste Manier Om <span className="text-primary">Arabisch Te Leren</span>
            </h2>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
              Onze bewezen methode combineert moderne technologie met traditionele 
              lesmethoden voor optimale resultaten.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature, index) => (
              <Card key={index} className="group hover:shadow-lg transition-all duration-300 border-0 shadow-md">
                <CardHeader className="text-center space-y-4">
                  <div className="mx-auto w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                    <feature.icon className="h-8 w-8 text-primary" />
                  </div>
                  <CardTitle className="text-xl">{feature.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-center text-muted-foreground leading-relaxed">
                    {feature.description}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Course Catalog Section */}
      <section className="py-20 bg-muted/30">
        <div className="max-w-7xl mx-auto px-4">
          <CourseCatalog />
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center space-y-4 mb-16">
            <h2 className="text-4xl lg:text-5xl font-bold tracking-tight">
              Wat Onze <span className="text-primary">Studenten Zeggen</span>
            </h2>
            <p className="text-xl text-muted-foreground">
              Ontdek waarom duizenden studenten voor ons platform hebben gekozen
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {testimonials.map((testimonial, index) => (
              <Card key={index} className="hover:shadow-lg transition-shadow duration-300">
                <CardHeader>
                  <div className="flex items-center gap-1 mb-4">
                    {Array.from({ length: testimonial.rating }).map((_, i) => (
                      <Star key={i} className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                    ))}
                  </div>
                  <CardTitle className="text-lg">{testimonial.name}</CardTitle>
                  <p className="text-sm text-muted-foreground">{testimonial.role}</p>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground italic leading-relaxed">
                    "{testimonial.content}"
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-r from-primary to-primary/80">
        <div className="max-w-4xl mx-auto px-4 text-center space-y-8">
          <h2 className="text-4xl lg:text-5xl font-bold text-primary-foreground">
            Klaar Om Te Beginnen?
          </h2>
          <p className="text-xl text-primary-foreground/90 leading-relaxed">
            Sluit je aan bij duizenden studenten die al hun Arabische taaldoelen hebben bereikt. 
            Begin vandaag nog met je gratis proefles!
          </p>
          
          <div className={`${getFlexDirection('row')} justify-between items-start`}>
            <Button 
              size="lg" 
              variant="secondary"
              className="text-lg px-8 py-6 group"
              onClick={() => navigate('/auth')}
            >
              Start Gratis Proefles
              <ArrowRight className="ms-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
            </Button>
            
            <Button 
              size="lg" 
              variant="outline"
              className="text-lg px-8 py-6 border-primary-foreground/20 text-primary-foreground hover:bg-primary-foreground/10"
              onClick={() => navigate('/visie')}
            >
              Meer Informatie
            </Button>
          </div>

          <p className="text-sm text-primary-foreground/70">
            30 dagen geld-terug-garantie • Geen verborgen kosten
          </p>
        </div>
      </section>
    </div>
  );
};

export default Index;
