import React, { useRef, useEffect, useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { 
  Palette, 
  Eraser, 
  Download, 
  Trash2, 
  Users, 
  Pen,
  Type,
  Circle,
  Square
} from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/components/auth/AuthProviderQuery';

interface DrawingData {
  id: string;
  x: number;
  y: number;
  type: 'draw' | 'erase' | 'text' | 'shape';
  color: string;
  size: number;
  user_id: string;
  timestamp: number;
  data?: any;
}

interface ConnectedUser {
  id: string;
  name: string;
  color: string;
}

export const CollaborativeWhiteboard: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [currentTool, setCurrentTool] = useState<'pen' | 'eraser' | 'text' | 'circle' | 'square'>('pen');
  const [currentColor, setCurrentColor] = useState('#000000');
  const [brushSize, setBrushSize] = useState(3);
  const [connectedUsers, setConnectedUsers] = useState<ConnectedUser[]>([]);
  const [roomId] = useState('whiteboard-main');
  const { user, profile } = useAuth();
  const { toast } = useToast();

  const colors = [
    '#000000', '#FF0000', '#00FF00', '#0000FF', '#FFFF00', 
    '#FF00FF', '#00FFFF', '#FFA500', '#800080', '#008000'
  ];

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set canvas size
    canvas.width = canvas.offsetWidth;
    canvas.height = canvas.offsetHeight;

    // Set drawing properties
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.fillStyle = 'white';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  }, []);

  useEffect(() => {
    if (!user) return;

    // Set up realtime channel for collaboration
    const channel = supabase
      .channel(`whiteboard:${roomId}`)
      .on('presence', { event: 'sync' }, () => {
        const state = channel.presenceState() as Record<string, any>;
        const users: ConnectedUser[] = Object.keys(state).map(userId => {
          const userState = state[userId][0];
          return {
            id: userId,
            name: userState?.name || 'User',
            color: userState?.color || '#000000'
          };
        });
        setConnectedUsers(users);
      })
      .on('broadcast', { event: 'drawing' }, ({ payload }) => {
        drawOnCanvas(payload);
      })
      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          await channel.track({
            id: user.id,
            name: profile?.full_name || 'User',
            color: currentColor,
            timestamp: Date.now()
          });
        }
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, profile, currentColor, roomId]);

  const drawOnCanvas = useCallback((data: DrawingData) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.globalCompositeOperation = data.type === 'erase' ? 'destination-out' : 'source-over';
    ctx.strokeStyle = data.color;
    ctx.lineWidth = data.size;

    if (data.type === 'draw' || data.type === 'erase') {
      ctx.beginPath();
      ctx.arc(data.x, data.y, data.size / 2, 0, Math.PI * 2);
      ctx.fill();
    }
  }, []);

  const startDrawing = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!user) return;
    
    setIsDrawing(true);
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const drawingData: DrawingData = {
      id: `${Date.now()}-${Math.random()}`,
      x,
      y,
      type: currentTool === 'pen' ? 'draw' : 'erase',
      color: currentColor,
      size: brushSize,
      user_id: user.id,
      timestamp: Date.now()
    };

    drawOnCanvas(drawingData);
    broadcastDrawing(drawingData);
  }, [user, currentTool, currentColor, brushSize, drawOnCanvas]);

  const draw = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing || !user) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const drawingData: DrawingData = {
      id: `${Date.now()}-${Math.random()}`,
      x,
      y,
      type: currentTool === 'pen' ? 'draw' : 'erase',
      color: currentColor,
      size: brushSize,
      user_id: user.id,
      timestamp: Date.now()
    };

    drawOnCanvas(drawingData);
    broadcastDrawing(drawingData);
  }, [isDrawing, user, currentTool, currentColor, brushSize, drawOnCanvas]);

  const stopDrawing = useCallback(() => {
    setIsDrawing(false);
  }, []);

  const broadcastDrawing = async (data: DrawingData) => {
    const channel = supabase.channel(`whiteboard:${roomId}`);
    await channel.send({
      type: 'broadcast',
      event: 'drawing',
      payload: data
    });
  };

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.fillStyle = 'white';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    toast({
      title: "تم مسح اللوحة - Canvas Cleared",
      description: "تم مسح جميع الرسومات - All drawings have been cleared",
    });
  };

  const downloadCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const link = document.createElement('a');
    link.download = `whiteboard-${Date.now()}.png`;
    link.href = canvas.toDataURL();
    link.click();

    toast({
      title: "تم تحميل اللوحة - Canvas Downloaded",
      description: "تم حفظ اللوحة كصورة - Canvas saved as image",
    });
  };

  if (!user) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <p className="text-muted-foreground">
            يجب تسجيل الدخول لاستخدام اللوحة التعاونية
            <br />
            Please log in to use the collaborative whiteboard
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-wrap items-center gap-4">
            {/* Tools */}
            <div className="flex items-center gap-2">
              <Button
                variant={currentTool === 'pen' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setCurrentTool('pen')}
              >
                <Pen className="w-4 h-4" />
              </Button>
              <Button
                variant={currentTool === 'eraser' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setCurrentTool('eraser')}
              >
                <Eraser className="w-4 h-4" />
              </Button>
              <Button
                variant={currentTool === 'circle' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setCurrentTool('circle')}
              >
                <Circle className="w-4 h-4" />
              </Button>
              <Button
                variant={currentTool === 'square' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setCurrentTool('square')}
              >
                <Square className="w-4 h-4" />
              </Button>
            </div>

            <Separator orientation="vertical" className="h-6" />

            {/* Colors */}
            <div className="flex items-center gap-1">
              <Palette className="w-4 h-4 text-muted-foreground" />
              {colors.map((color) => (
                <button
                  key={color}
                  className={`w-6 h-6 rounded-full border-2 ${
                    currentColor === color ? 'border-primary' : 'border-muted'
                  }`}
                  style={{ backgroundColor: color }}
                  onClick={() => setCurrentColor(color)}
                />
              ))}
            </div>

            <Separator orientation="vertical" className="h-6" />

            {/* Brush Size */}
            <div className="flex items-center gap-2">
              <span className="text-sm">حجم:</span>
              <input
                type="range"
                min="1"
                max="20"
                value={brushSize}
                onChange={(e) => setBrushSize(Number(e.target.value))}
                className="w-20"
              />
              <span className="text-sm w-6">{brushSize}</span>
            </div>

            <Separator orientation="vertical" className="h-6" />

            {/* Actions */}
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={clearCanvas}>
                <Trash2 className="w-4 h-4" />
              </Button>
              <Button variant="outline" size="sm" onClick={downloadCanvas}>
                <Download className="w-4 h-4" />
              </Button>
            </div>

            {/* Connected Users */}
            <div className="flex items-center gap-2 ml-auto">
              <Users className="w-4 h-4 text-muted-foreground" />
              <Badge variant="secondary">
                {connectedUsers.length} متصل
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Canvas */}
      <Card>
        <CardHeader>
          <CardTitle>اللوحة التعاونية - Collaborative Whiteboard</CardTitle>
        </CardHeader>
        <CardContent>
          <canvas
            ref={canvasRef}
            className="w-full h-[500px] border border-muted rounded-lg cursor-crosshair bg-white"
            onMouseDown={startDrawing}
            onMouseMove={draw}
            onMouseUp={stopDrawing}
            onMouseLeave={stopDrawing}
          />
        </CardContent>
      </Card>

      {/* Connected Users List */}
      {connectedUsers.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">المستخدمون المتصلون - Connected Users</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {connectedUsers.map((connectedUser) => (
                <Badge key={connectedUser.id} variant="outline" className="gap-2">
                  <div
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: connectedUser.color }}
                  />
                  {connectedUser.name}
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};