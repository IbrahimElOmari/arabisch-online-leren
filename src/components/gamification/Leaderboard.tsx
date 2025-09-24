import React, { useState } from 'react';
import { Trophy, Medal, Award, Crown, TrendingUp, Users } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { type LeaderboardEntry } from '@/services/gamificationService';
import { EnhancedSkeleton } from '@/components/ui/enhanced-loading-states';
import { cn } from '@/lib/utils';
import { useRTLLayout } from '@/hooks/useRTLLayout';

interface LeaderboardProps {
  entries: LeaderboardEntry[];
  currentUserId?: string;
  isLoading?: boolean;
  period?: 'week' | 'month' | 'all';
  onPeriodChange?: (period: 'week' | 'month' | 'all') => void;
  showUserPosition?: boolean;
  className?: string;
}

export function Leaderboard({
  entries = [],
  currentUserId,
  isLoading = false,
  period = 'all',
  onPeriodChange,
  showUserPosition = true,
  className
}: LeaderboardProps) {
  const { isRTL } = useRTLLayout();

  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 1:
        return <Crown className="h-5 w-5 text-yellow-500" />;
      case 2:
        return <Trophy className="h-5 w-5 text-gray-400" />;
      case 3:
        return <Medal className="h-5 w-5 text-amber-600" />;
      default:
        return <span className="text-sm font-bold text-muted-foreground">#{rank}</span>;
    }
  };

  const getRankColors = (rank: number) => {
    switch (rank) {
      case 1:
        return {
          bg: 'bg-gradient-to-r from-yellow-100 to-yellow-50',
          border: 'border-yellow-200',
          text: 'text-yellow-800'
        };
      case 2:
        return {
          bg: 'bg-gradient-to-r from-gray-100 to-gray-50',
          border: 'border-gray-200',
          text: 'text-gray-800'
        };
      case 3:
        return {
          bg: 'bg-gradient-to-r from-amber-100 to-amber-50',
          border: 'border-amber-200',
          text: 'text-amber-800'
        };
      default:
        return {
          bg: 'bg-background',
          border: 'border-border',
          text: 'text-foreground'
        };
    }
  };

  const currentUserEntry = entries.find(entry => entry.user_id === currentUserId);
  const topEntries = entries.slice(0, 10);

  const formatPoints = (points: number) => {
    if (points >= 1000) {
      return `${(points / 1000).toFixed(1)}k`;
    }
    return points.toString();
  };

  const periods = [
    { value: 'week' as const, label: 'Deze week' },
    { value: 'month' as const, label: 'Deze maand' },
    { value: 'all' as const, label: 'Alles' }
  ];

  if (isLoading) {
    return (
      <Card className={cn("w-full", className)}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Trophy className="h-5 w-5" />
            <EnhancedSkeleton className="h-5 w-24" />
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="flex items-center gap-3 p-3">
                <EnhancedSkeleton className="h-8 w-8 rounded-full" />
                <EnhancedSkeleton className="h-8 w-8 rounded-full" />
                <div className="flex-1">
                  <EnhancedSkeleton className="h-4 w-32 mb-1" />
                  <EnhancedSkeleton className="h-3 w-20" />
                </div>
                <EnhancedSkeleton className="h-6 w-16" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (entries.length === 0) {
    return (
      <Card className={cn("w-full", className)}>
        <CardHeader>
          <CardTitle className={cn("flex items-center gap-2", isRTL && "arabic-text")}>
            <Trophy className="h-5 w-5" />
            Ranglijst
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p className={cn(isRTL && "arabic-text")}>
              Nog geen ranglijst beschikbaar. Begin met het behalen van punten!
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={cn("w-full", className)} dir={isRTL ? 'rtl' : 'ltr'}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className={cn("flex items-center gap-2", isRTL && "arabic-text")}>
            <Trophy className="h-5 w-5" />
            Ranglijst
          </CardTitle>
          
          {onPeriodChange && (
            <div className="flex items-center gap-1">
              {periods.map((p) => (
                <Button
                  key={p.value}
                  variant={period === p.value ? "default" : "ghost"}
                  size="sm"
                  onClick={() => onPeriodChange(p.value)}
                >
                  {p.label}
                </Button>
              ))}
            </div>
          )}
        </div>
      </CardHeader>
      
      <CardContent>
        <ScrollArea className="h-96">
          <div className="space-y-2">
            {/* Top 3 Podium */}
            {entries.length >= 3 && (
              <div className="mb-6 p-4 bg-muted/30 rounded-lg">
                <h4 className={cn("text-sm font-medium mb-4 text-center", isRTL && "arabic-text")}>
                  🏆 Top 3
                </h4>
                <div className="flex items-end justify-center gap-4">
                  {/* 2nd Place */}
                  {entries[1] && (
                    <div className="text-center">
                      <div className="w-12 h-12 bg-gradient-to-t from-gray-300 to-gray-100 rounded-t-lg flex items-end justify-center pb-1">
                        <span className="text-xs font-bold text-gray-700">2</span>
                      </div>
                      <Avatar className="mx-auto -mt-2 mb-2 w-8 h-8 border-2 border-gray-300">
                        <AvatarFallback className="text-xs">
                          {entries[1].full_name.charAt(0)}
                        </AvatarFallback>
                      </Avatar>
                      <p className={cn("text-xs font-medium truncate max-w-16", isRTL && "arabic-text")}>
                        {entries[1].full_name}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {formatPoints(entries[1].total_points)}
                      </p>
                    </div>
                  )}
                  
                  {/* 1st Place */}
                  {entries[0] && (
                    <div className="text-center">
                      <div className="w-12 h-16 bg-gradient-to-t from-yellow-400 to-yellow-200 rounded-t-lg flex items-end justify-center pb-1">
                        <Crown className="h-4 w-4 text-yellow-700" />
                      </div>
                      <Avatar className="mx-auto -mt-2 mb-2 w-10 h-10 border-2 border-yellow-400">
                        <AvatarFallback className="text-sm font-bold">
                          {entries[0].full_name.charAt(0)}
                        </AvatarFallback>
                      </Avatar>
                      <p className={cn("text-sm font-bold truncate max-w-20", isRTL && "arabic-text")}>
                        {entries[0].full_name}
                      </p>
                      <p className="text-sm text-yellow-600 font-semibold">
                        {formatPoints(entries[0].total_points)}
                      </p>
                    </div>
                  )}
                  
                  {/* 3rd Place */}
                  {entries[2] && (
                    <div className="text-center">
                      <div className="w-12 h-10 bg-gradient-to-t from-amber-500 to-amber-300 rounded-t-lg flex items-end justify-center pb-1">
                        <span className="text-xs font-bold text-amber-800">3</span>
                      </div>
                      <Avatar className="mx-auto -mt-2 mb-2 w-8 h-8 border-2 border-amber-400">
                        <AvatarFallback className="text-xs">
                          {entries[2].full_name.charAt(0)}
                        </AvatarFallback>
                      </Avatar>
                      <p className={cn("text-xs font-medium truncate max-w-16", isRTL && "arabic-text")}>
                        {entries[2].full_name}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {formatPoints(entries[2].total_points)}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Full Leaderboard */}
            {topEntries.map((entry) => {
              const colors = getRankColors(entry.rank);
              const isCurrentUser = entry.user_id === currentUserId;
              
              return (
                <div
                  key={entry.user_id}
                  className={cn(
                    "flex items-center gap-3 p-3 rounded-lg border transition-colors",
                    colors.bg,
                    colors.border,
                    isCurrentUser && "ring-2 ring-primary ring-offset-2",
                    "hover:shadow-sm"
                  )}
                >
                  {/* Rank */}
                  <div className="flex items-center justify-center w-8 h-8">
                    {getRankIcon(entry.rank)}
                  </div>
                  
                  {/* User Info */}
                  <Avatar className="w-8 h-8">
                    <AvatarFallback className="text-sm">
                      {entry.full_name.charAt(0)}
                    </AvatarFallback>
                  </Avatar>
                  
                  <div className="flex-1 min-w-0">
                    <p className={cn(
                      "font-medium truncate",
                      colors.text,
                      isCurrentUser && "font-bold",
                      isRTL && "arabic-text"
                    )}>
                      {entry.full_name}
                      {isCurrentUser && (
                        <Badge variant="secondary" className="ms-2 text-xs">
                          Jij
                        </Badge>
                      )}
                    </p>
                    
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <span>{entry.badge_count} badges</span>
                      <span>•</span>
                      <span>{entry.level_completions} niveaus</span>
                    </div>
                  </div>
                  
                  {/* Points */}
                  <div className="text-right">
                    <p className={cn("font-semibold", colors.text, isRTL && "arabic-text")}>
                      {formatPoints(entry.total_points)}
                    </p>
                    <p className="text-xs text-muted-foreground">punten</p>
                  </div>
                </div>
              );
            })}
            
            {/* User's Position (if not in top 10) */}
            {showUserPosition && currentUserEntry && currentUserEntry.rank > 10 && (
              <>
                <div className="flex items-center justify-center py-2">
                  <div className="text-xs text-muted-foreground">...</div>
                </div>
                
                <div className={cn(
                  "flex items-center gap-3 p-3 rounded-lg border",
                  "bg-primary/5 border-primary/20 ring-2 ring-primary ring-offset-2"
                )}>
                  <div className="flex items-center justify-center w-8 h-8">
                    <span className="text-sm font-bold text-primary">
                      #{currentUserEntry.rank}
                    </span>
                  </div>
                  
                  <Avatar className="w-8 h-8">
                    <AvatarFallback className="text-sm">
                      {currentUserEntry.full_name.charAt(0)}
                    </AvatarFallback>
                  </Avatar>
                  
                  <div className="flex-1 min-w-0">
                    <p className={cn("font-bold text-primary", isRTL && "arabic-text")}>
                      {currentUserEntry.full_name} (Jij)
                    </p>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <span>{currentUserEntry.badge_count} badges</span>
                      <span>•</span>
                      <span>{currentUserEntry.level_completions} niveaus</span>
                    </div>
                  </div>
                  
                  <div className="text-right">
                    <p className={cn("font-semibold text-primary", isRTL && "arabic-text")}>
                      {formatPoints(currentUserEntry.total_points)}
                    </p>
                    <p className="text-xs text-muted-foreground">punten</p>
                  </div>
                </div>
              </>
            )}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}