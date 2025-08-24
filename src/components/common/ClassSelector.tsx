
import React from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface ClassSelectorProps {
  classes: Array<{
    id: string;
    class_id: string;
    klassen: {
      id: string;
      name: string;
    };
  }>;
  selectedClass: string;
  onClassChange: (classId: string) => void;
  loading?: boolean;
}

/**
 * Reusable class selector component with consistent styling and behavior
 */
export const ClassSelector = React.memo(({ 
  classes, 
  selectedClass, 
  onClassChange, 
  loading = false 
}: ClassSelectorProps) => {
  if (classes.length <= 1) {
    return null;
  }

  return (
    <div className="max-w-xs">
      <label className="text-sm font-medium mb-2 block">Selecteer klas:</label>
      <Select 
        value={selectedClass} 
        onValueChange={onClassChange}
        disabled={loading}
      >
        <SelectTrigger>
          <SelectValue placeholder="Kies een klas" />
        </SelectTrigger>
        <SelectContent>
          {classes.map((enrollment) => (
            <SelectItem key={enrollment.id} value={enrollment.class_id}>
              {enrollment.klassen.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
});

ClassSelector.displayName = 'ClassSelector';
