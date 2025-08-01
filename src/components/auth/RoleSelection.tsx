import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

export interface RoleOption {
  role: string;
  fullName: string;
}

interface RoleSelectionProps {
  availableRoles: RoleOption[];
  selectedRole: RoleOption | null;
  onRoleChange: (role: RoleOption | null) => void;
  onContinue: () => void;
  onBack: () => void;
}

export const RoleSelection = ({ 
  availableRoles, 
  selectedRole, 
  onRoleChange, 
  onContinue, 
  onBack 
}: RoleSelectionProps) => {
  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label>Beschikbare rollen</Label>
        <Select onValueChange={(value) => {
          const role = availableRoles.find(r => `${r.role}-${r.fullName}` === value);
          onRoleChange(role || null);
        }}>
          <SelectTrigger>
            <SelectValue placeholder="Selecteer een rol" />
          </SelectTrigger>
          <SelectContent>
            {availableRoles.map((roleItem, index) => (
              <SelectItem key={index} value={`${roleItem.role}-${roleItem.fullName}`}>
                {roleItem.fullName} ({roleItem.role})
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      
      <Button 
        onClick={onContinue} 
        className="w-full" 
        disabled={!selectedRole}
      >
        Doorgaan
      </Button>
      
      <Button 
        variant="outline" 
        onClick={onBack} 
        className="w-full"
      >
        Terug
      </Button>
    </div>
  );
};