
import * as React from "react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import { Menu, X, Home, Calendar, Eye, MessageSquare, BookOpen, User, Shield } from "lucide-react"
import { useNavigate } from "react-router-dom"
import { useAuth } from '@/components/auth/AuthProviderQuery'
import { RTLToggle } from '@/components/ui/RTLToggle'

export function MobileNav() {
  const [open, setOpen] = React.useState(false)
  const navigate = useNavigate()
  const { user, profile } = useAuth()

  const handleNavigation = (path: string) => {
    navigate(path)
    setOpen(false)
  }

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="ghost" size="sm" className="md:hidden">
          <Menu className="h-5 w-5" />
          <span className="sr-only">Toggle menu</span>
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="w-80 p-0">
        <div className="flex flex-col h-full">
          <div className="flex items-center justify-between p-4 border-b">
            <div className="flex items-center gap-2">
              <BookOpen className="h-6 w-6 text-primary" />
              <span className="font-bold text-lg">Leer Arabisch</span>
            </div>
            <div className="flex items-center gap-2">
              <RTLToggle />
              <Button variant="ghost" size="sm" onClick={() => setOpen(false)}>
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>

          <div className="flex-1 py-4">
            <nav className="space-y-2 px-4">
              <Button
                variant="ghost"
                className="w-full justify-start"
                onClick={() => handleNavigation('/')}
              >
                <Home className="mr-3 h-4 w-4" />
                Home
              </Button>

              {user && (
                <>
                  <Button
                    variant="ghost"
                    className="w-full justify-start"
                    onClick={() => handleNavigation('/dashboard')}
                  >
                    <User className="mr-3 h-4 w-4" />
                    Dashboard
                  </Button>

                  <Button
                    variant="ghost"
                    className="w-full justify-start"
                    onClick={() => handleNavigation('/calendar')}
                  >
                    <Calendar className="mr-3 h-4 w-4" />
                    Kalender
                  </Button>

                  <Button
                    variant="ghost"
                    className="w-full justify-start"
                    onClick={() => handleNavigation('/forum')}
                  >
                    <MessageSquare className="mr-3 h-4 w-4" />
                    Forum
                  </Button>

                  {profile && ['admin', 'leerkracht'].includes(profile.role) && (
                    <div className="pt-2 border-t">
                      <p className="text-xs font-medium text-muted-foreground mb-2 px-3">Beheer</p>
                      <Button
                        variant="ghost"
                        className="w-full justify-start"
                        onClick={() => handleNavigation('/forum-moderation')}
                      >
                        <MessageSquare className="mr-3 h-4 w-4" />
                        Forum Moderatie
                      </Button>
                      <Button
                        variant="ghost"
                        className="w-full justify-start"
                        onClick={() => handleNavigation('/security')}
                      >
                        <Shield className="mr-3 h-4 w-4" />
                        Beveiliging
                      </Button>
                    </div>
                  )}
                </>
              )}

              <Button
                variant="ghost"
                className="w-full justify-start"
                onClick={() => handleNavigation('/visie')}
              >
                <Eye className="mr-3 h-4 w-4" />
                Visie
              </Button>
            </nav>
          </div>

          {user && profile && (
            <div className="border-t p-4">
              <div className="text-sm">
                <p className="font-medium">{profile.full_name}</p>
                <p className="text-muted-foreground capitalize">{profile.role}</p>
              </div>
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  )
}
