import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { TestTube, Activity, Settings, Monitor } from 'lucide-react';
import { useRTL } from '@/contexts/RTLContext';
import { useTranslation } from '@/contexts/TranslationContext';
import { RTLTestRunner } from './RTLTestRunner';
import { RTLPerformanceMonitor } from './RTLPerformanceMonitor';
import { RTLTestSuite } from './RTLTestSuite';

export const RTLDashboard = () => {
  const { isRTL, toggleRTL } = useRTL();
  const { language, setLanguage } = useTranslation();
  const [activeTab, setActiveTab] = useState('testing');

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">RTL Development Dashboard</h1>
          <p className="text-muted-foreground">
            Comprehensive testing and monitoring for RTL implementation
          </p>
        </div>
        
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="flex items-center gap-1">
            Direction: {isRTL ? 'RTL' : 'LTR'}
          </Badge>
          <Badge variant="outline" className="flex items-center gap-1">
            Language: {language.toUpperCase()}
          </Badge>
          <Button onClick={toggleRTL} size="sm">
            Toggle Direction
          </Button>
          <Button onClick={() => setLanguage(language === 'ar' ? 'nl' : 'ar')} size="sm" variant="outline">
            Toggle Language
          </Button>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="testing" className="flex items-center gap-2">
            <TestTube className="w-4 h-4" />
            Testing Suite
          </TabsTrigger>
          <TabsTrigger value="performance" className="flex items-center gap-2">
            <Activity className="w-4 h-4" />
            Performance
          </TabsTrigger>
          <TabsTrigger value="components" className="flex items-center gap-2">
            <Monitor className="w-4 h-4" />
            Components
          </TabsTrigger>
          <TabsTrigger value="settings" className="flex items-center gap-2">
            <Settings className="w-4 h-4" />
            Settings
          </TabsTrigger>
        </TabsList>

        <TabsContent value="testing" className="space-y-4">
          <RTLTestRunner />
        </TabsContent>

        <TabsContent value="performance" className="space-y-4">
          <RTLPerformanceMonitor />
        </TabsContent>

        <TabsContent value="components" className="space-y-4">
          <RTLTestSuite />
        </TabsContent>

        <TabsContent value="settings" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>RTL Development Settings</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <h4 className="font-medium">Current Configuration</h4>
                  <div className="text-sm space-y-1">
                    <div>Direction: <Badge>{isRTL ? 'RTL' : 'LTR'}</Badge></div>
                    <div>Language: <Badge>{language}</Badge></div>
                    <div>Environment: <Badge>{process.env.NODE_ENV}</Badge></div>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <h4 className="font-medium">Browser Support</h4>
                  <div className="text-sm space-y-1">
                    <div>CSS Direction: <Badge variant={CSS.supports('direction', 'rtl') ? 'default' : 'destructive'}>
                      {CSS.supports('direction', 'rtl') ? 'Supported' : 'Not Supported'}
                    </Badge></div>
                    <div>Logical Properties: <Badge variant={CSS.supports('margin-inline-start', '1rem') ? 'default' : 'secondary'}>
                      {CSS.supports('margin-inline-start', '1rem') ? 'Supported' : 'Partial'}
                    </Badge></div>
                  </div>
                </div>
              </div>

              <div className="pt-4 border-t">
                <h4 className="font-medium mb-2">Quick Actions</h4>
                <div className="flex gap-2">
                  <Button onClick={toggleRTL} size="sm">
                    Switch to {isRTL ? 'LTR' : 'RTL'}
                  </Button>
                  <Button onClick={() => setLanguage(language === 'ar' ? 'nl' : 'ar')} size="sm" variant="outline">
                    Switch to {language === 'ar' ? 'Dutch' : 'Arabic'}
                  </Button>
                  <Button 
                    onClick={() => window.location.reload()} 
                    size="sm" 
                    variant="destructive"
                  >
                    Reload Page
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};