import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/components/auth/AuthProvider';
import { Button } from '@/components/ui/button';
import { NotificationBell } from '@/components/ui/NotificationBell';
import { Shield } from 'lucide-react';

const Navigation = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  return (
    <nav className="bg-card border-b border-border sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center space-x-8">
            <button 
              onClick={() => navigate('/')}
              className="text-xl font-bold text-foreground hover:text-primary transition-colors"
            >
              Leer Arabisch
            </button>
            <div className="hidden md:flex space-x-6">
              <button 
                onClick={() => navigate('/')}
                className="text-muted-foreground hover:text-foreground transition-colors"
              >
                Home
              </button>
              {!user ? (
                <button 
                  className="text-muted-foreground hover:text-foreground transition-colors"
                  onClick={() => navigate('/auth')}
                >
                  Inloggen
                </button>
              ) : (
                <button 
                  className="text-muted-foreground hover:text-foreground transition-colors"
                  onClick={() => navigate('/dashboard')}
                >
                  Dashboard
                </button>
              )}
              <button 
                className="text-muted-foreground hover:text-foreground transition-colors"
                onClick={() => navigate('/calendar')}
              >
                Kalender
              </button>
              {user && (
                <button 
                  className="text-muted-foreground hover:text-foreground transition-colors"
                  onClick={() => navigate('/forum')}
                >
                  Forum
                </button>
              )}
              <button 
                className="text-muted-foreground hover:text-foreground transition-colors"
                onClick={() => navigate('/visie')}
              >
                Visie
              </button>
              {user && ['admin', 'leerkracht'].includes((user as any).profile?.role) && (
                <>
                  <button 
                    className="text-muted-foreground hover:text-foreground transition-colors"
                    onClick={() => navigate('/forum-moderation')}
                  >
                    Forum Moderatie
                  </button>
                  <button 
                    className="text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1"
                    onClick={() => navigate('/security')}
                  >
                    <Shield className="h-4 w-4" />
                    Beveiliging
                  </button>
                </>
              )}
            </div>
          </div>
          {user && (
            <div className="flex items-center space-x-4">
              <NotificationBell />
              <span className="text-sm text-muted-foreground">
                Welkom, {user.email}
              </span>
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => navigate('/dashboard')}
              >
                Dashboard
              </Button>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Navigation;