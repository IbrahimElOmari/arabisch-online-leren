import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Keyboard, Languages, Space, Delete } from 'lucide-react';
import { useRTLLayout } from '@/hooks/useRTLLayout';

interface ArabicVirtualKeyboardProps {
  onKeyPress: (key: string) => void;
  onDelete: () => void;
  onSpace: () => void;
  className?: string;
}

// Arabic keyboard layout
const arabicLayout = {
  row1: ['ض', 'ص', 'ث', 'ق', 'ف', 'غ', 'ع', 'ه', 'خ', 'ح', 'ج', 'د'],
  row2: ['ش', 'س', 'ي', 'ب', 'ل', 'ا', 'ت', 'ن', 'م', 'ك', 'ط'],
  row3: ['ئ', 'ء', 'ؤ', 'ر', 'لا', 'ى', 'ة', 'و', 'ز', 'ظ'],
  numbers: ['١', '٢', '٣', '٤', '٥', '٦', '٧', '٨', '٩', '٠'],
  diacritics: ['َ', 'ِ', 'ُ', 'ً', 'ٍ', 'ٌ', 'ْ', 'ّ', 'ٰ', 'ٱ']
};

const englishLayout = {
  row1: ['q', 'w', 'e', 'r', 't', 'y', 'u', 'i', 'o', 'p'],
  row2: ['a', 's', 'd', 'f', 'g', 'h', 'j', 'k', 'l'],
  row3: ['z', 'x', 'c', 'v', 'b', 'n', 'm'],
  numbers: ['1', '2', '3', '4', '5', '6', '7', '8', '9', '0']
};

export const ArabicVirtualKeyboard = ({ 
  onKeyPress, 
  onDelete, 
  onSpace, 
  className = "" 
}: ArabicVirtualKeyboardProps) => {
  const { isRTL, getFlexDirection, getTextAlign } = useRTLLayout();
  
  const [isArabic, setIsArabic] = useState(true);
  const [showDiacritics, setShowDiacritics] = useState(false);
  const [capsLock, setCapsLock] = useState(false);

  const currentLayout = isArabic ? arabicLayout : englishLayout;

  const handleKeyPress = (key: string) => {
    let processedKey = key;
    
    if (!isArabic && capsLock) {
      processedKey = key.toUpperCase();
    }
    
    onKeyPress(processedKey);
  };

  const toggleLanguage = () => {
    setIsArabic(!isArabic);
    setShowDiacritics(false);
  };

  const toggleCapsLock = () => {
    setCapsLock(!capsLock);
  };

  return (
    <Card className={className}>
      <CardHeader className="pb-3">
        <div className={`flex items-center justify-between ${getFlexDirection()}`}>
          <CardTitle className={`flex items-center gap-2 text-sm ${getFlexDirection()}`}>
            <Keyboard className="h-4 w-4" />
            <span className={isRTL ? 'arabic-text' : ''}>
              {isRTL ? 'لوحة المفاتيح' : 'Virtueel Toetsenbord'}
            </span>
          </CardTitle>
          
          <div className={`flex items-center gap-2 ${getFlexDirection()}`}>
            <Badge variant={isArabic ? 'default' : 'secondary'}>
              {isArabic ? 'العربية' : 'EN'}
            </Badge>
            
            <Button
              variant="outline"
              size="sm"
              onClick={toggleLanguage}
              className={`flex items-center gap-1 ${getFlexDirection()}`}
            >
              <Languages className="h-3 w-3" />
              <span className="text-xs">
                {isArabic ? 'EN' : 'عر'}
              </span>
            </Button>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-2">
        {/* Numbers Row */}
        <div className={`flex gap-1 justify-center ${getFlexDirection()}`}>
          {currentLayout.numbers.map((key) => (
            <Button
              key={key}
              variant="outline"
              size="sm"
              onClick={() => handleKeyPress(key)}
              className="h-8 w-8 p-0 text-sm"
            >
              {key}
            </Button>
          ))}
        </div>

        {/* First Row */}
        <div className={`flex gap-1 justify-center ${getFlexDirection()}`}>
          {currentLayout.row1.map((key) => (
            <Button
              key={key}
              variant="outline"
              size="sm"
              onClick={() => handleKeyPress(key)}
              className="h-8 w-8 p-0 text-sm font-arabic"
            >
              {!isArabic && capsLock ? key.toUpperCase() : key}
            </Button>
          ))}
        </div>

        {/* Second Row */}
        <div className={`flex gap-1 justify-center ${getFlexDirection()}`}>
          {currentLayout.row2.map((key) => (
            <Button
              key={key}
              variant="outline"
              size="sm"
              onClick={() => handleKeyPress(key)}
              className="h-8 w-8 p-0 text-sm font-arabic"
            >
              {!isArabic && capsLock ? key.toUpperCase() : key}
            </Button>
          ))}
        </div>

        {/* Third Row */}
        <div className={`flex gap-1 justify-center items-center ${getFlexDirection()}`}>
          {!isArabic && (
            <Button
              variant={capsLock ? 'default' : 'outline'}
              size="sm"
              onClick={toggleCapsLock}
              className="h-8 px-2 text-xs"
            >
              Caps
            </Button>
          )}
          
          {currentLayout.row3.map((key) => (
            <Button
              key={key}
              variant="outline"
              size="sm"
              onClick={() => handleKeyPress(key)}
              className="h-8 w-8 p-0 text-sm font-arabic"
            >
              {!isArabic && capsLock ? key.toUpperCase() : key}
            </Button>
          ))}
        </div>

        {/* Diacritics Row (Arabic only) */}
        {isArabic && (
          <div className="space-y-2">
            <Button
              variant={showDiacritics ? 'default' : 'outline'}
              size="sm"
              onClick={() => setShowDiacritics(!showDiacritics)}
              className="w-full h-6 text-xs"
            >
              {isRTL ? 'التشكيل' : 'Diacritics'} {showDiacritics ? '▼' : '▶'}
            </Button>
            
            {showDiacritics && (
              <div className={`flex gap-1 justify-center flex-wrap ${getFlexDirection()}`}>
                {arabicLayout.diacritics.map((diacritic) => (
                  <Button
                    key={diacritic}
                    variant="outline"
                    size="sm"
                    onClick={() => handleKeyPress(diacritic)}
                    className="h-6 w-6 p-0 text-xs font-arabic"
                  >
                    {diacritic}
                  </Button>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Action Keys */}
        <div className={`flex gap-1 justify-center ${getFlexDirection()}`}>
          <Button
            variant="outline"
            size="sm"
            onClick={onSpace}
            className="h-8 flex-1 max-w-32"
          >
            <Space className="h-3 w-3" />
          </Button>
          
          <Button
            variant="outline"
            size="sm"
            onClick={onDelete}
            className="h-8 px-3"
          >
            <Delete className="h-3 w-3" />
          </Button>
        </div>

        {/* Special Arabic Keys */}
        {isArabic && (
          <div className={`flex gap-1 justify-center ${getFlexDirection()}`}>
            {['؟', '؛', '،', '٪', '×', '÷'].map((key) => (
              <Button
                key={key}
                variant="outline"
                size="sm"
                onClick={() => handleKeyPress(key)}
                className="h-6 w-6 p-0 text-xs font-arabic"
              >
                {key}
              </Button>
            ))}
          </div>
        )}

        {/* Keyboard Tips */}
        <div className="text-xs text-muted-foreground text-center mt-3">
          <p className={isRTL ? 'arabic-text' : ''}>
            {isArabic 
              ? (isRTL ? 'استخدم التشكيل لإضافة الحركات' : 'Gebruik diacritics voor vocalisatie')
              : (isRTL ? 'استخدم Caps للأحرف الكبيرة' : 'Gebruik Caps voor hoofdletters')
            }
          </p>
        </div>
      </CardContent>
    </Card>
  );
};