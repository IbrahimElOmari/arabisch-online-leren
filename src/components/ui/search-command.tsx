
import * as React from "react"
import { Search, BookOpen, Calendar, MessageSquare, User, Home } from "lucide-react"
import { useNavigate } from "react-router-dom"
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command"
import { Button } from "@/components/ui/button"
import { useAuth } from "@/components/auth/AuthProvider"

const searchItems = [
  {
    title: "Home",
    path: "/",
    icon: Home,
    group: "Pagina's"
  },
  {
    title: "Dashboard",
    path: "/dashboard",
    icon: User,
    group: "Pagina's",
    requiresAuth: true
  },
  {
    title: "Kalender",
    path: "/calendar",
    icon: Calendar,
    group: "Pagina's"
  },
  {
    title: "Forum",
    path: "/forum",
    icon: MessageSquare,
    group: "Pagina's",
    requiresAuth: true
  },
  {
    title: "Visie",
    path: "/visie",
    icon: BookOpen,
    group: "Pagina's"
  }
]

export function SearchCommand() {
  const [open, setOpen] = React.useState(false)
  const navigate = useNavigate()
  const { user } = useAuth()

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
        className="relative h-9 w-9 p-0 md:h-10 md:w-60 md:justify-start md:px-3 md:py-2"
        onClick={() => setOpen(true)}
      >
        <Search className="h-4 w-4 md:mr-2" />
        <span className="hidden md:inline-flex">Zoeken...</span>
        <kbd className="pointer-events-none absolute right-1.5 top-2 hidden h-6 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium opacity-100 md:flex">
          <span className="text-xs">⌘</span>K
        </kbd>
      </Button>
      
      <CommandDialog open={open} onOpenChange={setOpen}>
        <CommandInput placeholder="Zoek naar pagina's, functies..." />
        <CommandList>
          <CommandEmpty>Geen resultaten gevonden.</CommandEmpty>
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
                >
                  <item.icon className="mr-2 h-4 w-4" />
                  <span>{item.title}</span>
                </CommandItem>
              ))}
            </CommandGroup>
          ))}
        </CommandList>
      </CommandDialog>
    </>
  )
}
