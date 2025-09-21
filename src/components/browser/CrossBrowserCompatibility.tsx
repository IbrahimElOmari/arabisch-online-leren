import React, { useEffect, useState } from 'react';
import { cn } from '@/lib/utils';

// Browser detection hook
export const useBrowserDetection = () => {
  const [browserInfo, setBrowserInfo] = useState({
    name: '',
    version: '',
    isChrome: false,
    isSafari: false,
    isFirefox: false,
    isEdge: false,
    isMobile: false,
    supportsModernFeatures: true
  });

  useEffect(() => {
    const userAgent = navigator.userAgent;
    
    // Detect browser
    const isChrome = /Chrome\//.test(userAgent) && !/Edg\//.test(userAgent);
    const isSafari = /Safari\//.test(userAgent) && !/Chrome\//.test(userAgent);
    const isFirefox = /Firefox\//.test(userAgent);
    const isEdge = /Edg\//.test(userAgent);
    const isMobile = /Mobi|Android/i.test(userAgent);
    
    // Check for modern features
    const supportsModernFeatures = !!(
      window.CSS?.supports?.('backdrop-filter', 'blur(10px)') &&
      window.ResizeObserver &&
      window.IntersectionObserver
    );

    setBrowserInfo({
      name: isChrome ? 'Chrome' : isSafari ? 'Safari' : isFirefox ? 'Firefox' : isEdge ? 'Edge' : 'Unknown',
      version: userAgent.match(/(Chrome|Safari|Firefox|Edg)\/(\d+)/)?.[2] || '',
      isChrome,
      isSafari,
      isFirefox,
      isEdge,
      isMobile,
      supportsModernFeatures
    });
  }, []);

  return browserInfo;
};

// Cross-browser CSS class provider
interface BrowserCompatibleProps {
  children: React.ReactNode;
  className?: string;
}

export const BrowserCompatible: React.FC<BrowserCompatibleProps> = ({ 
  children, 
  className 
}) => {
  const browser = useBrowserDetection();
  
  const browserClasses = cn(
    className,
    {
      'browser-chrome': browser.isChrome,
      'browser-safari': browser.isSafari,
      'browser-firefox': browser.isFirefox,
      'browser-edge': browser.isEdge,
      'browser-mobile': browser.isMobile,
      'browser-legacy': !browser.supportsModernFeatures
    }
  );

  return (
    <div className={browserClasses}>
      {children}
    </div>
  );
};

// Polyfill component for older browsers
export const BrowserPolyfills: React.FC = () => {
  useEffect(() => {
    // Polyfill for older browsers
    if (!window.ResizeObserver) {
      console.warn('ResizeObserver not supported, loading polyfill...');
      // In a real app, you would load the polyfill here
    }

    if (!window.IntersectionObserver) {
      console.warn('IntersectionObserver not supported, loading polyfill...');
      // In a real app, you would load the polyfill here
    }

    // Smooth scrolling polyfill for Safari
    if (!CSS.supports('scroll-behavior', 'smooth')) {
      document.documentElement.style.scrollBehavior = 'auto';
    }
  }, []);

  return null;
};

// Performance CSS for different browsers
export const injectBrowserSpecificCSS = () => {
  const style = document.createElement('style');
  style.textContent = `
    /* Safari specific fixes */
    @supports (-webkit-backdrop-filter: blur(10px)) {
      .safari-backdrop-blur {
        -webkit-backdrop-filter: blur(10px);
        backdrop-filter: blur(10px);
      }
    }

    /* Firefox scrollbar styling */
    @-moz-document url-prefix() {
      .firefox-scrollbar {
        scrollbar-width: thin;
        scrollbar-color: hsl(var(--border)) transparent;
      }
    }

    /* Edge specific fixes */
    @supports (-ms-ime-align: auto) {
      .edge-specific {
        /* Edge specific styles */
      }
    }

    /* Mobile webkit fixes */
    @media screen and (-webkit-min-device-pixel-ratio: 0) {
      .webkit-mobile-fix input,
      .webkit-mobile-fix textarea {
        font-size: 16px; /* Prevent zoom on focus */
      }
    }

    /* Cross-browser focus styles */
    .focus-visible:focus-visible {
      outline: 2px solid hsl(var(--primary));
      outline-offset: 2px;
    }

    .focus-visible:focus:not(:focus-visible) {
      outline: none;
    }
  `;
  
  document.head.appendChild(style);
};