import React, { useState, useRef, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { useRTLAnimations } from '@/hooks/useRTLAnimations';

// Ripple Effect Component
interface RippleProps {
  className?: string;
  color?: string;
  duration?: number;
}

export const Ripple: React.FC<RippleProps> = ({ 
  className, 
  color = 'rgba(255, 255, 255, 0.6)', 
  duration = 600 
}) => {
  const [ripples, setRipples] = useState<Array<{
    x: number;
    y: number;
    size: number;
    key: number;
  }>>([]);

  const addRipple = (event: React.MouseEvent<HTMLDivElement>) => {
    const rect = event.currentTarget.getBoundingClientRect();
    const size = Math.max(rect.width, rect.height);
    const x = event.clientX - rect.left - size / 2;
    const y = event.clientY - rect.top - size / 2;
    
    const newRipple = {
      x,
      y,
      size,
      key: Date.now(),
    };

    setRipples(prev => [...prev, newRipple]);

    setTimeout(() => {
      setRipples(prev => prev.filter(ripple => ripple.key !== newRipple.key));
    }, duration);
  };

  return (
    <div
      className={cn('absolute inset-0 overflow-hidden rounded-inherit', className)}
      onMouseDown={addRipple}
    >
      {ripples.map(ripple => (
        <span
          key={ripple.key}
          className="absolute animate-ping rounded-full pointer-events-none"
          style={{
            left: ripple.x,
            top: ripple.y,
            width: ripple.size,
            height: ripple.size,
            backgroundColor: color,
            animationDuration: `${duration}ms`,
          }}
        />
      ))}
    </div>
  );
};

// Enhanced Button with Micro-interactions
interface InteractiveButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'default' | 'outline' | 'ghost' | 'gradient';
  size?: 'sm' | 'md' | 'lg';
  ripple?: boolean;
  glow?: boolean;
  bounce?: boolean;
  children: React.ReactNode;
}

export const InteractiveButton: React.FC<InteractiveButtonProps> = ({
  variant = 'default',
  size = 'md',
  ripple = true,
  glow = false,
  bounce = false,
  className,
  children,
  ...props
}) => {
  const [isPressed, setIsPressed] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  
  const variantStyles = {
    default: 'bg-primary text-primary-foreground hover:bg-primary/90',
    outline: 'border-2 border-primary text-primary hover:bg-primary hover:text-primary-foreground',
    ghost: 'text-primary hover:bg-primary/10',
    gradient: 'bg-gradient-to-r from-primary to-accent text-primary-foreground',
  };

  const sizeStyles = {
    sm: 'px-3 py-1.5 text-sm h-8',
    md: 'px-4 py-2 text-sm h-10',
    lg: 'px-6 py-3 text-base h-12',
  };

  return (
    <button
      className={cn(
        'relative inline-flex items-center justify-center gap-2 rounded-md font-medium',
        'transition-all duration-200 ease-out overflow-hidden',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
        'disabled:pointer-events-none disabled:opacity-50',
        'active:scale-95',
        variantStyles[variant],
        sizeStyles[size],
        glow && 'hover:shadow-glow hover:shadow-primary/50',
        bounce && 'hover:animate-bounce-in',
        isPressed && 'scale-95',
        isHovered && 'shadow-lg -translate-y-0.5',
        className
      )}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onMouseDown={() => setIsPressed(true)}
      onMouseUp={() => setIsPressed(false)}
      {...props}
    >
      {children}
      {ripple && <Ripple />}
    </button>
  );
};

// Floating Action Button with Animations
interface FloatingActionButtonProps {
  onClick?: () => void;
  icon: React.ReactNode;
  label?: string;
  position?: 'bottom-right' | 'bottom-left' | 'top-right' | 'top-left';
  className?: string;
}

export const FloatingActionButton: React.FC<FloatingActionButtonProps> = ({
  onClick,
  icon,
  label,
  position = 'bottom-right',
  className,
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const { getBounceInClasses } = useRTLAnimations();

  const positionStyles = {
    'bottom-right': 'bottom-6 right-6',
    'bottom-left': 'bottom-6 left-6',
    'top-right': 'top-6 right-6',
    'top-left': 'top-6 left-6',
  };

  return (
    <div className={cn('fixed z-50', positionStyles[position])}>
      <button
        onClick={onClick}
        onMouseEnter={() => setIsExpanded(true)}
        onMouseLeave={() => setIsExpanded(false)}
        className={cn(
          'group flex items-center gap-3 bg-primary text-primary-foreground',
          'rounded-full shadow-lg hover:shadow-xl',
          'transition-all duration-300 ease-out',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
          'hover:scale-110 active:scale-95',
          getBounceInClasses(),
          isExpanded ? 'px-4 py-3' : 'p-4',
          className
        )}
        aria-label={label || 'Floating action button'}
      >
        <div className="flex-shrink-0">
          {icon}
        </div>
        
        {label && (
          <span 
            className={cn(
              'whitespace-nowrap font-medium transition-all duration-300',
              isExpanded 
                ? 'opacity-100 max-w-xs' 
                : 'opacity-0 max-w-0 overflow-hidden'
            )}
          >
            {label}
          </span>
        )}
        
        <Ripple color="rgba(255, 255, 255, 0.3)" />
      </button>
    </div>
  );
};

// Animated Counter Component
interface AnimatedCounterProps {
  value: number;
  duration?: number;
  className?: string;
  prefix?: string;
  suffix?: string;
}

export const AnimatedCounter: React.FC<AnimatedCounterProps> = ({
  value,
  duration = 1000,
  className,
  prefix = '',
  suffix = '',
}) => {
  const [displayValue, setDisplayValue] = useState(0);
  const [isVisible, setIsVisible] = useState(false);
  const countRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
        }
      },
      { threshold: 0.1 }
    );

    if (countRef.current) {
      observer.observe(countRef.current);
    }

    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!isVisible) return;

    const startTime = Date.now();
    const startValue = displayValue;
    const difference = value - startValue;

    const updateCounter = () => {
      const now = Date.now();
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      
      // Easing function for smooth animation
      const easeOutQuart = 1 - Math.pow(1 - progress, 4);
      
      const currentValue = Math.round(startValue + difference * easeOutQuart);
      setDisplayValue(currentValue);

      if (progress < 1) {
        requestAnimationFrame(updateCounter);
      }
    };

    requestAnimationFrame(updateCounter);
  }, [value, duration, isVisible, displayValue]);

  return (
    <span 
      ref={countRef}
      className={cn('font-bold tabular-nums', className)}
    >
      {prefix}{displayValue.toLocaleString()}{suffix}
    </span>
  );
};

// Hover Card with Tilt Effect
interface TiltCardProps {
  children: React.ReactNode;
  className?: string;
  maxTilt?: number;
  perspective?: number;
}

export const TiltCard: React.FC<TiltCardProps> = ({
  children,
  className,
  maxTilt = 15,
  perspective = 1000,
}) => {
  const [tilt, setTilt] = useState({ x: 0, y: 0 });
  const cardRef = useRef<HTMLDivElement>(null);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!cardRef.current) return;

    const rect = cardRef.current.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    
    const mouseX = e.clientX - centerX;
    const mouseY = e.clientY - centerY;
    
    const tiltX = (mouseY / (rect.height / 2)) * maxTilt;
    const tiltY = -(mouseX / (rect.width / 2)) * maxTilt;
    
    setTilt({ x: tiltX, y: tiltY });
  };

  const handleMouseLeave = () => {
    setTilt({ x: 0, y: 0 });
  };

  return (
    <div
      ref={cardRef}
      className={cn('transition-transform duration-200 ease-out', className)}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      style={{
        transform: `perspective(${perspective}px) rotateX(${tilt.x}deg) rotateY(${tilt.y}deg)`,
      }}
    >
      {children}
    </div>
  );
};

// Magnetic Button Effect
interface MagneticButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  strength?: number;
  children: React.ReactNode;
}

export const MagneticButton: React.FC<MagneticButtonProps> = ({
  strength = 0.3,
  children,
  className,
  ...props
}) => {
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const buttonRef = useRef<HTMLButtonElement>(null);

  const handleMouseMove = (e: React.MouseEvent<HTMLButtonElement>) => {
    if (!buttonRef.current) return;

    const rect = buttonRef.current.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    
    const mouseX = e.clientX - centerX;
    const mouseY = e.clientY - centerY;
    
    setPosition({
      x: mouseX * strength,
      y: mouseY * strength,
    });
  };

  const handleMouseLeave = () => {
    setPosition({ x: 0, y: 0 });
  };

  return (
    <button
      ref={buttonRef}
      className={cn(
        'transition-transform duration-200 ease-out',
        'hover:scale-110 active:scale-95',
        className
      )}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      style={{
        transform: `translate(${position.x}px, ${position.y}px)`,
      }}
      {...props}
    >
      {children}
    </button>
  );
};

export default {
  Ripple,
  InteractiveButton,
  FloatingActionButton,
  AnimatedCounter,
  TiltCard,
  MagneticButton,
};