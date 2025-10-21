
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/components/auth/AuthProviderQuery';
import { useUserRole } from '@/hooks/useUserRole';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { 
  User, 
  KeyRound, 
  LogOut, 
  ChevronDown,
  UserCog
} from 'lucide-react';
import { ProfileModal } from './ProfileModal';
import { ForgotPasswordModal } from '@/components/auth/ForgotPasswordModal';
import { useRTLLayout } from '@/hooks/useRTLLayout';
import { useTranslation } from '@/contexts/TranslationContext';

export const UserDropdown = () => {
  const { user, profile, signOut } = useAuth();
  const { role } = useUserRole();
  const navigate = useNavigate();
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const { getFlexDirection, getTextAlign, isRTL } = useRTLLayout();
  const { t } = useTranslation();

  if (!user || !profile) return null;

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" className={`${getFlexDirection()} items-center gap-2 h-auto p-2`}>
            <Avatar className="h-8 w-8">
              <AvatarFallback className="text-xs">
                {getInitials(profile.full_name)}
              </AvatarFallback>
            </Avatar>
            <div className={`hidden sm:flex flex-col ${getTextAlign('left')}`}>
              <span className="text-sm font-medium">{profile.full_name}</span>
              <span className="text-xs text-muted-foreground capitalize">
                {role || profile.role}
              </span>
            </div>
            <ChevronDown className="h-4 w-4 text-muted-foreground" />
          </Button>
        </DropdownMenuTrigger>
        
        <DropdownMenuContent className="w-56 bg-popover border shadow-md" align={isRTL ? "start" : "end"}>
          <DropdownMenuLabel>
            <div className={`flex flex-col space-y-1 ${getTextAlign('left')}`}>
              <p className="text-sm font-medium">{profile.full_name}</p>
              <p className="text-xs text-muted-foreground">{user.email}</p>
            </div>
          </DropdownMenuLabel>
          
          <DropdownMenuSeparator />
          
          <DropdownMenuItem 
            onClick={() => setShowProfileModal(true)}
            className={`${getFlexDirection()} items-center gap-2 cursor-pointer`}
          >
            <User className="h-4 w-4" />
            <span className={isRTL ? 'arabic-text' : ''}>{t('user.view_profile')}</span>
          </DropdownMenuItem>
          
          <DropdownMenuItem 
            onClick={() => setShowPasswordModal(true)}
            className={`${getFlexDirection()} items-center gap-2 cursor-pointer`}
          >
            <KeyRound className="h-4 w-4" />
            <span className={isRTL ? 'arabic-text' : ''}>{t('user.change_password')}</span>
          </DropdownMenuItem>
          
          <DropdownMenuItem 
            onClick={() => navigate('/dashboard')}
            className={`${getFlexDirection()} items-center gap-2 cursor-pointer`}
          >
            <UserCog className="h-4 w-4" />
            <span className={isRTL ? 'arabic-text' : ''}>{t('nav.dashboard')}</span>
          </DropdownMenuItem>
          
          <DropdownMenuSeparator />
          
          <DropdownMenuItem 
            onClick={handleSignOut}
            className={`${getFlexDirection()} items-center gap-2 cursor-pointer text-destructive hover:text-destructive`}
          >
            <LogOut className="h-4 w-4" />
            <span className={isRTL ? 'arabic-text' : ''}>{t('user.logout')}</span>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <ProfileModal 
        isOpen={showProfileModal} 
        onClose={() => setShowProfileModal(false)} 
      />
      
      <ForgotPasswordModal 
        isOpen={showPasswordModal} 
        onClose={() => setShowPasswordModal(false)} 
      />
    </>
  );
};
