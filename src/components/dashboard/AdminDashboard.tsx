import React, { useState } from 'react';
import { useAuth } from '@/components/auth/AuthProviderQuery';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useRTLLayout } from '@/hooks/useRTLLayout';
import { useUserRole } from '@/hooks/useUserRole';
import { 
  Users, 
  BookOpen, 
  MessageSquare, 
  Settings,
  UserPlus,
  GraduationCap,
  Shield,
  TrendingUp
} from 'lucide-react';
import { ClassManagementModal } from '@/components/admin/ClassManagementModal';
import TaskQuestionManagementNew from '@/components/management/TaskQuestionManagementNew';

const AdminDashboard = () => {
  const { profile } = useAuth();
  const { isAdmin } = useUserRole();
  const [showClassModal, setShowClassModal] = useState(false);
  const { 
    isRTL, 
    getFlexDirection, 
    getTextAlign, 
    getMarginStart, 
    getMarginEnd 
  } = useRTLLayout();

  if (!profile || !isAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Shield className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
          <h2 className={`text-lg font-semibold mb-2 ${isRTL ? 'arabic-text' : ''}`}>
            {isRTL ? 'الوصول مرفوض' : 'Toegang geweigerd'}
          </h2>
          <p className={`text-muted-foreground ${isRTL ? 'arabic-text' : ''}`}>
            {isRTL ? 'ليس لديك صلاحية للوصول إلى لوحة الإدارة.' : 'Je hebt geen toegang tot het admin dashboard.'}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-8">
      <div className={`flex justify-between items-center ${getFlexDirection()}`}>
        <div>
          <h1 className={`text-3xl font-bold ${getTextAlign()} ${isRTL ? 'arabic-text' : ''}`}>
            {isRTL ? 'لوحة الإدارة' : 'Admin Dashboard'}
          </h1>
          <p className={`text-muted-foreground mt-1 ${getTextAlign()} ${isRTL ? 'arabic-text' : ''}`}>
            {isRTL ? `أهلاً وسهلاً بعودتك، ${profile.full_name}` : `Welkom terug, ${profile.full_name}`}
          </p>
        </div>
        <Badge variant="secondary" className={`px-3 py-1 ${isRTL ? 'arabic-text' : ''}`}>
          {isRTL ? 'مدير' : 'Administrator'}
        </Badge>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className={`flex flex-row items-center justify-between space-y-0 pb-2 ${getFlexDirection()}`}>
            <CardTitle className={`text-sm font-medium ${isRTL ? 'arabic-text' : ''}`}>
              {isRTL ? 'إجمالي المستخدمين' : 'Totaal Gebruikers'}
            </CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${getTextAlign()}`}>1,234</div>
            <p className={`text-xs text-muted-foreground ${getTextAlign()} ${isRTL ? 'arabic-text' : ''}`}>
              {isRTL ? '+20% من الشهر السابق' : '+20% vanaf vorige maand'}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className={`flex flex-row items-center justify-between space-y-0 pb-2 ${getFlexDirection()}`}>
            <CardTitle className={`text-sm font-medium ${isRTL ? 'arabic-text' : ''}`}>
              {isRTL ? 'الصفوف النشطة' : 'Actieve Klassen'}
            </CardTitle>
            <GraduationCap className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${getTextAlign()}`}>12</div>
            <p className={`text-xs text-muted-foreground ${getTextAlign()} ${isRTL ? 'arabic-text' : ''}`}>
              {isRTL ? '3 جديدة هذا الأسبوع' : '3 nieuwe deze week'}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className={`flex flex-row items-center justify-between space-y-0 pb-2 ${getFlexDirection()}`}>
            <CardTitle className={`text-sm font-medium ${isRTL ? 'arabic-text' : ''}`}>
              {isRTL ? 'منشورات المنتدى' : 'Forum Posts'}
            </CardTitle>
            <MessageSquare className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${getTextAlign()}`}>89</div>
            <p className={`text-xs text-muted-foreground ${getTextAlign()} ${isRTL ? 'arabic-text' : ''}`}>
              {isRTL ? '+12 اليوم' : '+12 vandaag'}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className={`flex flex-row items-center justify-between space-y-0 pb-2 ${getFlexDirection()}`}>
            <CardTitle className={`text-sm font-medium ${isRTL ? 'arabic-text' : ''}`}>
              {isRTL ? 'نسبة النمو' : 'Groeipercentage'}
            </CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${getTextAlign()}`}>+12.5%</div>
            <p className={`text-xs text-muted-foreground ${getTextAlign()} ${isRTL ? 'arabic-text' : ''}`}>
              {isRTL ? 'هذا الشهر' : 'Deze maand'}
            </p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="classes" className="space-y-4" dir={isRTL ? 'rtl' : 'ltr'}>
        <TabsList>
          <TabsTrigger value="classes" className={isRTL ? 'arabic-text' : ''}>
            {isRTL ? 'إدارة الصفوف' : 'Klasbeheer'}
          </TabsTrigger>
          <TabsTrigger value="tasks" className={isRTL ? 'arabic-text' : ''}>
            {isRTL ? 'المهام والأسئلة' : 'Taken & Vragen'}
          </TabsTrigger>
          <TabsTrigger value="users" className={isRTL ? 'arabic-text' : ''}>
            {isRTL ? 'المستخدمون' : 'Gebruikers'}
          </TabsTrigger>
          <TabsTrigger value="overview" className={isRTL ? 'arabic-text' : ''}>
            {isRTL ? 'نظرة عامة' : 'Overzicht'}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="classes" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className={isRTL ? 'arabic-text' : ''}>
                {isRTL ? 'إدارة الصفوف' : 'Klasbeheer'}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Button 
                onClick={() => setShowClassModal(true)}
                className={`w-full justify-start ${getFlexDirection()}`}
                variant="outline"
              >
                <BookOpen className={`h-4 w-4 ${getMarginEnd('2')}`} />
                <span className={isRTL ? 'arabic-text' : ''}>
                  {isRTL ? 'إنشاء صف جديد' : 'Nieuwe Klas Aanmaken'}
                </span>
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="tasks" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className={isRTL ? 'arabic-text' : ''}>
                {isRTL ? 'إدارة المهام والأسئلة' : 'Taken & Vragen Beheer'}
              </CardTitle>
              <p className={`text-sm text-muted-foreground ${isRTL ? 'arabic-text' : ''}`}>
                {isRTL ? 'كمدير لديك صلاحية الوصول إلى جميع المهام والأسئلة في جميع الصفوف' : 'Als admin heb je toegang tot alle taken en vragen van alle klassen'}
              </p>
            </CardHeader>
            <CardContent>
              <TaskQuestionManagementNew />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="users">
          <Card>
            <CardHeader>
              <CardTitle className={isRTL ? 'arabic-text' : ''}>
                {isRTL ? 'إدارة المستخدمين' : 'Gebruikersbeheer'}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className={`text-muted-foreground ${isRTL ? 'arabic-text' : ''}`}>
                {isRTL ? 'وظائف إدارة المستخدمين ستكون متاحة قريباً...' : 'Gebruikersbeheer functionaliteit komt binnenkort...'}
              </p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className={isRTL ? 'arabic-text' : ''}>
                  {isRTL ? 'إجراءات سريعة' : 'Snelle Acties'}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <Button 
                  onClick={() => setShowClassModal(true)}
                  className={`w-full justify-start ${getFlexDirection()}`}
                  variant="outline"
                >
                  <BookOpen className={`h-4 w-4 ${getMarginEnd('2')}`} />
                  <span className={isRTL ? 'arabic-text' : ''}>
                    {isRTL ? 'إنشاء صف جديد' : 'Nieuwe Klas Aanmaken'}
                  </span>
                </Button>
                <Button className={`w-full justify-start ${getFlexDirection()}`} variant="outline">
                  <Settings className={`h-4 w-4 ${getMarginEnd('2')}`} />
                  <span className={isRTL ? 'arabic-text' : ''}>
                    {isRTL ? 'إعدادات النظام' : 'Systeem Instellingen'}
                  </span>
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className={isRTL ? 'arabic-text' : ''}>
                  {isRTL ? 'النشاط الأخير' : 'Recente Activiteit'}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className={`space-y-2 text-sm ${getTextAlign()}`}>
                  <p className={isRTL ? 'arabic-text' : ''}>
                    {isRTL ? '• مستخدم جديد مسجل: أحمد محمد' : '• Nieuwe gebruiker geregistreerd: Ahmed M.'}
                  </p>
                  <p className={isRTL ? 'arabic-text' : ''}>
                    {isRTL ? '• صف "العربية الأساسية" محدث' : '• Klas "Arabisch Basis" bijgewerkt'}
                  </p>
                  <p className={isRTL ? 'arabic-text' : ''}>
                    {isRTL ? '• منشور منتدى خاضع للإشراف' : '• Forum post gemodereerd'}
                  </p>
                  <p className={isRTL ? 'arabic-text' : ''}>
                    {isRTL ? '• نسخ احتياطي للنظام مكتمل' : '• Systeem backup voltooid'}
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      <ClassManagementModal 
        isOpen={showClassModal}
        onClose={() => setShowClassModal(false)}
      />
    </div>
  );
};

export default AdminDashboard;
