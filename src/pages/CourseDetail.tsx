
import { useParams } from 'react-router-dom';
import { Navigation } from '@/components/Navigation';
import { CourseDetailPage } from '@/components/course/CourseDetailPage';

const CourseDetail = () => {
  const { id } = useParams<{ id: string }>();
  
  if (!id) {
    return <div>Course niet gevonden</div>;
  }

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <CourseDetailPage courseId={id} />
    </div>
  );
};

export default CourseDetail;
