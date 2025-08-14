
import * as React from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Clock, Users, Star, Search, Filter, BookOpen, Play, User } from "lucide-react"

interface Course {
  id: string
  title: string
  description: string
  level: string
  duration: string
  students: number
  rating: number
  instructor: string
  image: string
  price: number
  tags: string[]
}

const sampleCourses: Course[] = [
  {
    id: "1",
    title: "Arabisch voor Beginners",
    description: "Leer de basis van het Arabisch, inclusief alfabet, uitspraak en eenvoudige zinnen.",
    level: "Beginner",
    duration: "8 weken",
    students: 124,
    rating: 4.8,
    instructor: "Ahmed Hassan",
    image: "/placeholder.svg",
    price: 199,
    tags: ["Alfabet", "Uitspraak", "Basis"]
  },
  {
    id: "2", 
    title: "Gevorderd Arabisch",
    description: "Verdiep je kennis met complexe grammatica en uitgebreide woordenschat.",
    level: "Gevorderd",
    duration: "12 weken",
    students: 89,
    rating: 4.9,
    instructor: "Fatima Al-Zahra",
    image: "/placeholder.svg",
    price: 299,
    tags: ["Grammatica", "Woordenschat", "Conversatie"]
  },
  {
    id: "3",
    title: "Zakelijk Arabisch",
    description: "Leer professioneel Arabisch voor zakelijke communicatie en onderhandelingen.",
    level: "Intermediate",
    duration: "10 weken", 
    students: 67,
    rating: 4.7,
    instructor: "Omar Mahmoud",
    image: "/placeholder.svg",
    price: 249,
    tags: ["Zakelijk", "Communicatie", "Professional"]
  }
]

export function CourseCatalog() {
  const [searchTerm, setSearchTerm] = React.useState("")
  const [levelFilter, setLevelFilter] = React.useState("all")
  const [sortBy, setSortBy] = React.useState("popular")

  const filteredCourses = sampleCourses.filter(course => {
    const matchesSearch = course.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         course.description.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesLevel = levelFilter === "all" || course.level.toLowerCase() === levelFilter.toLowerCase()
    
    return matchesSearch && matchesLevel
  })

  const sortedCourses = [...filteredCourses].sort((a, b) => {
    switch (sortBy) {
      case "rating":
        return b.rating - a.rating
      case "price-low":
        return a.price - b.price
      case "price-high":
        return b.price - a.price
      case "duration":
        return parseInt(a.duration) - parseInt(b.duration)
      default: // popular
        return b.students - a.students
    }
  })

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center space-y-4">
        <h1 className="text-4xl font-bold tracking-tight">Ontdek Onze Cursussen</h1>
        <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
          Kies uit ons uitgebreide aanbod van Arabische taalcursussen, 
          van beginner tot gevorderd niveau.
        </p>
      </div>

      {/* Filters */}
      <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
        <div className="flex flex-col sm:flex-row gap-4 flex-1">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Zoek cursussen..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>

          <Select value={levelFilter} onValueChange={setLevelFilter}>
            <SelectTrigger className="w-full sm:w-48">
              <Filter className="mr-2 h-4 w-4" />
              <SelectValue placeholder="Niveau" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Alle niveaus</SelectItem>
              <SelectItem value="beginner">Beginner</SelectItem>
              <SelectItem value="intermediate">Intermediate</SelectItem>
              <SelectItem value="gevorderd">Gevorderd</SelectItem>
            </SelectContent>
          </Select>

          <Select value={sortBy} onValueChange={setSortBy}>
            <SelectTrigger className="w-full sm:w-48">
              <SelectValue placeholder="Sorteer op" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="popular">Populair</SelectItem>
              <SelectItem value="rating">Hoogste beoordeling</SelectItem>
              <SelectItem value="price-low">Prijs: laag naar hoog</SelectItem>
              <SelectItem value="price-high">Prijs: hoog naar laag</SelectItem>
              <SelectItem value="duration">Duur</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Course Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {sortedCourses.map((course) => (
          <Card key={course.id} className="group hover:shadow-lg transition-all duration-300 border-0 shadow-md hover:shadow-xl hover:-translate-y-1">
            <div className="relative overflow-hidden rounded-t-lg">
              <img
                src={course.image}
                alt={course.title}
                className="w-full h-48 object-cover group-hover:scale-105 transition-transform duration-300"
              />
              <div className="absolute top-4 left-4">
                <Badge variant="secondary" className="bg-background/90 text-foreground">
                  {course.level}
                </Badge>
              </div>
              <div className="absolute top-4 right-4">
                <Badge variant="default" className="bg-primary text-primary-foreground">
                  €{course.price}
                </Badge>
              </div>
            </div>

            <CardHeader className="pb-4">
              <CardTitle className="line-clamp-2 group-hover:text-primary transition-colors">
                {course.title}
              </CardTitle>
              <p className="text-sm text-muted-foreground line-clamp-3">
                {course.description}
              </p>
            </CardHeader>

            <CardContent className="space-y-4">
              <div className="flex items-center justify-between text-sm text-muted-foreground">
                <div className="flex items-center gap-1">
                  <Clock className="h-4 w-4" />
                  {course.duration}
                </div>
                <div className="flex items-center gap-1">
                  <Users className="h-4 w-4" />
                  {course.students} studenten
                </div>
                <div className="flex items-center gap-1">
                  <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                  {course.rating}
                </div>
              </div>

              <div className="flex items-center gap-2 text-sm">
                <User className="h-4 w-4 text-muted-foreground" />
                <span className="text-muted-foreground">door</span>
                <span className="font-medium">{course.instructor}</span>
              </div>

              <div className="flex flex-wrap gap-1">
                {course.tags.map((tag) => (
                  <Badge key={tag} variant="outline" className="text-xs">
                    {tag}
                  </Badge>
                ))}
              </div>

              <div className="flex gap-2 pt-2">
                <Button className="flex-1" size="sm">
                  <BookOpen className="mr-2 h-4 w-4" />
                  Inschrijven
                </Button>
                <Button variant="outline" size="sm">
                  <Play className="h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Empty State */}
      {sortedCourses.length === 0 && (
        <div className="text-center py-12">
          <BookOpen className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
          <h3 className="text-lg font-medium mb-2">Geen cursussen gevonden</h3>
          <p className="text-muted-foreground">
            Probeer je zoekopdracht of filters aan te passen.
          </p>
        </div>
      )}
    </div>
  )
}
