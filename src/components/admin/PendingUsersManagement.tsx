
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Trash2, Check, X } from 'lucide-react';
import { useAuth } from '@/components/auth/AuthProviderQuery';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

interface PendingUser {
  id: string;
  email: string;
  full_name: string;
  role: string;
  parent_email?: string;
}

const PendingUsersManagement = () => {
  const [pendingUsers, setPendingUsers] = useState<PendingUser[]>([]);
  const { profile } = useAuth();

  useEffect(() => {
    if (profile?.role === 'admin') {
      // For now, show empty state since pending_users table doesn't exist in current schema
      setPendingUsers([]);
    }
  }, [profile]);

  const generatePassword = () => {
    const length = 12;
    const charset = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*()_+";
    let retVal = "";
    for (let i = 0, n = charset.length; i < length; ++i) {
      retVal += charset.charAt(Math.floor(Math.random() * n));
    }
    return retVal;
  };

  const approveUser = async (user: PendingUser) => {
    try {
      // This functionality requires the pending_users table to be created in Supabase
      toast({
        title: 'Feature Not Available',
        description: 'Pending users management requires additional database setup.',
        variant: 'destructive',
      });
    } catch (error) {
      console.error('Error approving user:', error);
      toast({
        title: 'Error',
        description: 'Failed to approve user.',
        variant: 'destructive',
      });
    }
  };

  const rejectUser = async (user: PendingUser) => {
    try {
      // This functionality requires the pending_users table to be created in Supabase
      toast({
        title: 'Feature Not Available',
        description: 'Pending users management requires additional database setup.',
        variant: 'destructive',
      });
    } catch (error) {
      console.error('Error rejecting user:', error);
      toast({
        title: 'Error',
        description: 'Failed to reject user.',
        variant: 'destructive',
      });
    }
  };

  if (profile?.role !== 'admin') {
    return (
      <div className="text-center py-8">
        <p className="text-muted-foreground">Access Denied - Admin rights required</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6">
      <h1 className="text-2xl font-bold mb-4">Pending User Approvals</h1>
      {pendingUsers.length === 0 ? (
        <Card>
          <CardContent className="text-center py-8">
            <p className="text-muted-foreground">No pending users at this time.</p>
            <p className="text-sm text-muted-foreground mt-2">
              This feature requires additional database setup to manage user approval workflows.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {pendingUsers.map((user) => (
            <Card key={user.id}>
              <CardHeader>
                <CardTitle>{user.full_name}</CardTitle>
              </CardHeader>
              <CardContent>
                <p>Email: {user.email}</p>
                <p>Role: <Badge>{user.role}</Badge></p>
                {user.parent_email && <p>Parent Email: {user.parent_email}</p>}
                <div className="flex justify-end gap-2 mt-4">
                  <Button variant="ghost" size="sm" onClick={() => rejectUser(user)}>
                    <X className="h-4 w-4 me-2" />
                    Reject
                  </Button>
                  <Button size="sm" onClick={() => approveUser(user)}>
                    <Check className="h-4 w-4 me-2" />
                    Approve
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default PendingUsersManagement;
