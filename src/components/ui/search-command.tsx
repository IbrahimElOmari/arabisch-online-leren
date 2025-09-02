import * as React from "react"
import { Search, BookOpen, Calendar, MessageSquare, User, Home } from "lucide-react"
import { useNavigate } from "react-router-dom"
import { useRTLLayout } from "@/hooks/useRTLLayout"
import { useTranslation } from "@/contexts/TranslationContext"
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command"
import { Button } from "@/components/ui/button"
import { useAuth } from "@/components/auth/AuthProviderQuery"

const getSearchItems = (t: (key: string) => string) => [
  {
    title: t('nav.home'),
    path: "/",
    icon: Home,
    group: t('common.pages')
  },
  {
    title: t('nav.dashboard'),
    path: "/dashboard",
    icon: User,
    group: t('common.pages'),
    requiresAuth: true
  },
  {
    title: t('nav.calendar'),
    path: "/calendar",
    icon: Calendar,
    group: t('common.pages')
  },
  {
    title: t('nav.forum'),
    path: "/forum",
    icon: MessageSquare,
    group: t('common.pages'),
    requiresAuth: true
  },
  {
    title: t('nav.vision'),
    path: "/visie",
    icon: BookOpen,
    group: t('common.pages')
  }
]

export function SearchCommand() {
  const [open, setOpen] = React.useState(false)
  const navigate = useNavigate()
  const { user } = useAuth()
  const { getFlexDirection, getIconSpacing, getRightPosition, isRTL } = useRTLLayout()
  const { t } = useTranslation()
  const searchItems = getSearchItems(t)

  React.useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault()
        setOpen((open) => !open)
      }
    }
    document.addEventListener("keydown", down)
    return () => document.removeEventListener("keydown", down)
  }, [])

  const handleSelect = (path: string) => {
    navigate(path)
    setOpen(false)
  }

  const filteredItems = searchItems.filter(item => 
    !item.requiresAuth || user
  )

  return (
    <>
      <Button
        variant="outline"
        className={`relative h-9 w-9 p-0 md:h-10 md:w-60 md:justify-start md:px-3 md:py-2 ${getFlexDirection()}`}
        onClick={() => setOpen(true)}
      >
        <Search className={`h-4 w-4 ${getIconSpacing()}`} />
        <span className={`hidden md:inline-flex ${isRTL ? 'arabic-text' : ''}`}>{t('nav.search')}</span>
        <kbd className={`pointer-events-none absolute ${getRightPosition('1.5')} top-2 hidden h-6 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium opacity-100 md:flex`}>
          <span className="text-xs">⌘</span>K
        </kbd>
      </Button>
      
      <CommandDialog open={open} onOpenChange={setOpen}>
        <CommandInput 
          placeholder={t('nav.search_placeholder')} 
          className={isRTL ? 'arabic-text' : ''}
        />
        <CommandList>
          <CommandEmpty className={isRTL ? 'arabic-text' : ''}>{t('common.no_results')}</CommandEmpty>
          {Object.entries(
            filteredItems.reduce((acc, item) => {
              if (!acc[item.group]) acc[item.group] = []
              acc[item.group].push(item)
              return acc
            }, {} as Record<string, typeof filteredItems>)
          ).map(([group, items]) => (
            <CommandGroup key={group} heading={group}>
              {items.map((item) => (
                <CommandItem
                  key={item.path}
                  value={item.title}
                  onSelect={() => handleSelect(item.path)}
                  className={getFlexDirection()}
                >
                  <item.icon className={`h-4 w-4 ${getIconSpacing()}`} />
                  <span className={isRTL ? 'arabic-text' : ''}>{item.title}</span>
                </CommandItem>
              ))}
            </CommandGroup>
          ))}
        </CommandList>
      </CommandDialog>
    </>
  )
}
