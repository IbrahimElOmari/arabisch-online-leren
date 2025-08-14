
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Clock, Users, Star, BookOpen, Search, Filter } from 'lucide-react';

interface Course {
  id: string;
  title: string;
  description: string;
  instructor: {
    name: string;
    avatar: string;
  };
  duration: string;
  students: number;
  rating: number;
  price: number;
  level: 'Beginner' | 'Intermediate' | 'Advanced';
  category: string;
  image: string;
}

interface CourseCatalogProps {
  courses?: Course[];
  showFilters?: boolean;
}

const mockCourses: Course[] = [
  {
    id: 'arabic-beginners-1',
    title: 'Arabisch voor Beginners - Niveau 1',
    description: 'Leer de basis van het Arabisch met onze gestructureerde aanpak. Perfect voor absolute beginners.',
    instructor: {
      name: 'Fatima Al-Zahra',
      avatar: '/placeholder.svg'
    },
    duration: '12 weken',
    students: 156,
    rating: 4.8,
    price: 299,
    level: 'Beginner',
    category: 'Taal',
    image: '/placeholder.svg'
  },
  {
    id: 'arabic-intermediate-1',
    title: 'Arabisch Conversatie - Niveau 2',
    description: 'Ontwikkel je spreekvaardigheden en vergroot je woordenschat in het Arabisch.',
    instructor: {
      name: 'Ahmed Hassan',
      avatar: '/placeholder.svg'
    },
    duration: '10 weken',
    students: 89,
    rating: 4.9,
    price: 349,
    level: 'Intermediate',
    category: 'Conversatie',
    image: '/placeholder.svg'
  },
  {
    id: 'quran-reading-1',
    title: 'Koran Lezen voor Beginners',
    description: 'Leer de juiste uitspraak en regels voor het lezen van de Koran.',
    instructor: {
      name: 'Omar Al-Masri',
      avatar: '/placeholder.svg'
    },
    duration: '8 weken',
    students: 234,
    rating: 4.7,
    price: 199,
    level: 'Beginner',
    category: 'Religieus',
    image: '/placeholder.svg'
  },
  {
    id: 'arabic-grammar-1',
    title: 'Arabische Grammatica Masterclass',
    description: 'Diepgaande studie van de Arabische grammatica voor gevorderde leerlingen.',
    instructor: {
      name: 'Dr. Layla Mahmoud',
      avatar: '/placeholder.svg'
    },
    duration: '16 weken',
    students: 67,
    rating: 4.9,
    price: 449,
    level: 'Advanced',
    category: 'Grammatica',
    image: '/placeholder.svg'
  }
];

export const CourseCatalog = ({ courses = mockCourses, showFilters = true }: CourseCatalogProps) => {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedLevel, setSelectedLevel] = useState<string>('all');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [sortBy, setSortBy] = useState<string>('rating');

  const filteredCourses = courses
    .filter(course => 
      course.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      course.description.toLowerCase().includes(searchTerm.toLowerCase())
    )
    .filter(course => selectedLevel === 'all' || course.level === selectedLevel)
    .filter(course => selectedCategory === 'all' || course.category === selectedCategory)
    .sort((a, b) => {
      switch (sortBy) {
        case 'rating':
          return b.rating - a.rating;
        case 'students':
          return b.students - a.students;
        case 'price-low':
          return a.price - b.price;
        case 'price-high':
          return b.price - a.price;
        default:
          return 0;
      }
    });

  const categories = Array.from(new Set(courses.map(course => course.category)));

  const handleCourseClick = (courseId: string) => {
    navigate(`/course/${courseId}`);
  };

  return (
    <div className="w-full">
      {/* Filters */}
      {showFilters && (
        <div className="mb-8 space-y-4">
          <div className="flex flex-col md:flex-row gap-4">
            {/* Search */}
            <div className="relative flex-1">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Zoek cursussen..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>

            {/* Level Filter */}
            <Select value={selectedLevel} onValueChange={setSelectedLevel}>
              <SelectTrigger className="w-full md:w-48">
                <SelectValue placeholder="Niveau" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Alle Niveaus</SelectItem>
                <SelectItem value="Beginner">Beginner</SelectItem>
                <SelectItem value="Intermediate">Intermediate</SelectItem>
                <SelectItem value="Advanced">Gevorderd</SelectItem>
              </SelectContent>
            </Select>

            {/* Category Filter */}
            <Select value={selectedCategory} onValueChange={setSelectedCategory}>
              <SelectTrigger className="w-full md:w-48">
                <SelectValue placeholder="Categorie" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Alle Categorieën</SelectItem>
                {categories.map(category => (
                  <SelectItem key={category} value={category}>
                    {category}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Sort */}
            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="w-full md:w-48">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="rating">Hoogste Beoordeling</SelectItem>
                <SelectItem value="students">Meeste Studenten</SelectItem>
                <SelectItem value="price-low">Prijs: Laag naar Hoog</SelectItem>
                <SelectItem value="price-high">Prijs: Hoog naar Laag</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              {filteredCourses.length} cursus{filteredCourses.length !== 1 ? 'sen' : ''} gevonden
            </p>
            <Button variant="outline" size="sm" className="gap-2">
              <Filter className="h-4 w-4" />
              Meer Filters
            </Button>
          </div>
        </div>
      )}

      {/* Course Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {filteredCourses.map((course) => (
          <Card
            key={course.id}
            className="group cursor-pointer transition-all duration-300 hover:shadow-lg hover:scale-[1.02] overflow-hidden"
            onClick={() => handleCourseClick(course.id)}
          >
            {/* Course Image */}
            <div className="aspect-video bg-gradient-to-br from-primary/20 to-secondary/20 flex items-center justify-center">
              <BookOpen className="h-12 w-12 text-primary/60" />
            </div>

            <CardHeader className="pb-3">
              <div className="flex items-start justify-between mb-2">
                <Badge variant="secondary">{course.level}</Badge>
                <div className="flex items-center gap-1">
                  <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                  <span className="text-xs text-muted-foreground">{course.rating}</span>
                </div>
              </div>
              <CardTitle className="text-lg leading-tight group-hover:text-primary transition-colors">
                {course.title}
              </CardTitle>
            </CardHeader>

            <CardContent className="pb-4">
              <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
                {course.description}
              </p>

              {/* Instructor */}
              <div className="flex items-center gap-2 mb-4">
                <Avatar className="h-6 w-6">
                  <AvatarImage src={course.instructor.avatar} />
                  <AvatarFallback className="text-xs">
                    {course.instructor.name.charAt(0)}
                  </AvatarFallback>
                </Avatar>
                <span className="text-xs text-muted-foreground">
                  {course.instructor.name}
                </span>
              </div>

              {/* Course Stats */}
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <div className="flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  <span>{course.duration}</span>
                </div>
                <div className="flex items-center gap-1">
                  <Users className="h-3 w-3" />
                  <span>{course.students}</span>
                </div>
              </div>
            </CardContent>

            <CardFooter className="pt-0">
              <div className="flex items-center justify-between w-full">
                <div className="text-lg font-bold text-primary">
                  €{course.price}
                </div>
                <Button size="sm" className="group-hover:bg-primary/90 transition-colors">
                  Bekijk Cursus
                </Button>
              </div>
            </CardFooter>
          </Card>
        ))}
      </div>

      {/* No Results */}
      {filteredCourses.length === 0 && (
        <div className="text-center py-12">
          <BookOpen className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-medium mb-2">Geen cursussen gevonden</h3>
          <p className="text-muted-foreground">
            Probeer je zoekopdracht aan te passen of filters te wijzigen.
          </p>
        </div>
      )}
    </div>
  );
};
