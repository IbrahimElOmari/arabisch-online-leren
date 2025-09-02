
import { useParams } from 'react-router-dom';
import Navigation from '@/components/Navigation';
import { CourseDetailPage } from '@/components/course/CourseDetailPage';
import { useRTLLayout } from '@/hooks/useRTLLayout';
import { useTranslation } from '@/contexts/TranslationContext';

const CourseDetail = () => {
  const { id } = useParams<{ id: string }>();
  const { getTextAlign, isRTL } = useRTLLayout();
  const { t } = useTranslation();
  
  if (!id) {
    return <div className={`${getTextAlign('center')} py-8`} dir={isRTL ? 'rtl' : 'ltr'}>
      <span className={isRTL ? 'arabic-text' : ''}>{t('course.notFound')}</span>
    </div>;
  }

  return (
    <div className="min-h-screen bg-background" dir={isRTL ? 'rtl' : 'ltr'}>
      <Navigation />
      <CourseDetailPage courseId={id} />
    </div>
  );
};

export default CourseDetail;
