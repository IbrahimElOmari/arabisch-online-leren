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
      fetchPendingUsers();
    }
  }, [profile]);

  const fetchPendingUsers = async () => {
    try {
      const { data, error } = await supabase
        .from('pending_users')
        .select('*');

      if (error) {
        console.error('Error fetching pending users:', error);
        toast({
          title: 'Error',
          description: 'Failed to fetch pending users.',
          variant: 'destructive',
        });
        return;
      }

      setPendingUsers(data || []);
    } catch (error) {
      console.error('Error fetching pending users:', error);
      toast({
        title: 'Error',
        description: 'Failed to fetch pending users.',
        variant: 'destructive',
      });
    }
  };

  const approveUser = async (user: PendingUser) => {
    try {
      // 1. Create user in Supabase auth
      const { data: authData, error: authError } = await supabase.auth.admin.createUser({
        email: user.email,
        password: generatePassword(), // Implement a password generation function
        user_metadata: {
          full_name: user.full_name,
          role: user.role,
          parent_email: user.parent_email,
        },
      });

      if (authError) {
        console.error('Error creating user in auth:', authError);
        toast({
          title: 'Error',
          description: 'Failed to create user in authentication system.',
          variant: 'destructive',
        });
        return;
      }

      const newUserId = authData.user?.id;

      // 2. Create profile in 'profiles' table
      const { error: profileError } = await supabase
        .from('profiles')
        .insert([
          {
            id: newUserId,
            full_name: user.full_name,
            role: user.role,
            parent_email: user.parent_email,
          },
        ]);

      if (profileError) {
        console.error('Error creating profile:', profileError);
        // Optionally, delete the user from auth if profile creation fails
        await supabase.auth.admin.deleteUser(newUserId!);
        toast({
          title: 'Error',
          description: 'Failed to create user profile.',
          variant: 'destructive',
        });
        return;
      }

      // 3. Delete from pending_users
      const { error: deleteError } = await supabase
        .from('pending_users')
        .delete()
        .eq('id', user.id);

      if (deleteError) {
        console.error('Error deleting pending user:', deleteError);
        toast({
          title: 'Error',
          description: 'Failed to delete pending user.',
          variant: 'destructive',
        });
        return;
      }

      // Refresh list
      fetchPendingUsers();
      toast({
        title: 'Success',
        description: `User ${user.full_name} approved and created.`,
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
      const { error } = await supabase
        .from('pending_users')
        .delete()
        .eq('id', user.id);

      if (error) {
        console.error('Error deleting pending user:', error);
        toast({
          title: 'Error',
          description: 'Failed to reject user.',
          variant: 'destructive',
        });
        return;
      }

      fetchPendingUsers();
      toast({
        title: 'Success',
        description: `User ${user.full_name} rejected.`,
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

  const generatePassword = () => {
    const length = 12;
    const charset = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*()_+";
    let retVal = "";
    for (let i = 0, n = charset.length; i < length; ++i) {
      retVal += charset.charAt(Math.floor(Math.random() * n));
    }
    return retVal;
  }

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
        <p>No pending users.</p>
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
                    <X className="h-4 w-4 mr-2" />
                    Reject
                  </Button>
                  <Button size="sm" onClick={() => approveUser(user)}>
                    <Check className="h-4 w-4 mr-2" />
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
