import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardHeader, CardContent, CardTitle, CardDescription } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';

// Note: jest-axe requires @types/jest-axe for TypeScript
// For now, we use manual accessibility checks

describe('Component Accessibility Tests', () => {
  describe('Button Component', () => {
    it('default button renders correctly', () => {
      const { getByRole } = render(<Button>Click me</Button>);
      expect(getByRole('button')).toBeDefined();
    });

    it('button with aria-label renders correctly', () => {
      const { getByLabelText } = render(
        <Button aria-label="Submit form">Submit</Button>
      );
      expect(getByLabelText('Submit form')).toBeDefined();
    });

    it('disabled button has correct attribute', () => {
      const { getByRole } = render(<Button disabled>Disabled</Button>);
      expect(getByRole('button')).toHaveProperty('disabled', true);
    });
  });

  describe('Input Component', () => {
    it('input with label is accessible', () => {
      const { getByLabelText } = render(
        <div>
          <Label htmlFor="test-email">Email address</Label>
          <Input id="test-email" type="email" />
        </div>
      );
      expect(getByLabelText('Email address')).toBeDefined();
    });

    it('input with aria-describedby renders correctly', () => {
      const { getByRole } = render(
        <div>
          <Label htmlFor="test-password">Password</Label>
          <Input 
            id="test-password" 
            type="password" 
            aria-describedby="password-error"
          />
          <p id="password-error">Password is required</p>
        </div>
      );
      expect(getByRole('textbox')).toHaveAttribute('aria-describedby', 'password-error');
    });
  });

  describe('Card Component', () => {
    it('card with content renders correctly', () => {
      const { getByText } = render(
        <Card>
          <CardHeader>
            <CardTitle>Card Title</CardTitle>
            <CardDescription>Card description</CardDescription>
          </CardHeader>
          <CardContent>
            <p>Card content</p>
          </CardContent>
        </Card>
      );
      expect(getByText('Card Title')).toBeDefined();
      expect(getByText('Card content')).toBeDefined();
    });
  });

  describe('Badge Component', () => {
    it('badge renders correctly', () => {
      const { getByText } = render(<Badge>New</Badge>);
      expect(getByText('New')).toBeDefined();
    });
  });

  describe('Form Structure', () => {
    it('form with aria-labelledby is accessible', () => {
      const { getByRole } = render(
        <form aria-labelledby="form-title">
          <h2 id="form-title">Contact Form</h2>
          <Label htmlFor="name">Name</Label>
          <Input id="name" type="text" required />
          <Button type="submit">Submit</Button>
        </form>
      );
      expect(getByRole('form')).toHaveAttribute('aria-labelledby', 'form-title');
    });
  });

  describe('Navigation Structure', () => {
    it('navigation with aria-label is accessible', () => {
      const { getByRole } = render(
        <nav aria-label="Main navigation">
          <ul>
            <li><a href="/">Home</a></li>
            <li><a href="/about">About</a></li>
          </ul>
        </nav>
      );
      expect(getByRole('navigation')).toHaveAttribute('aria-label', 'Main navigation');
    });
  });

  describe('Heading Structure', () => {
    it('proper heading hierarchy renders correctly', () => {
      const { getByRole } = render(
        <main>
          <h1>Main Title</h1>
          <section>
            <h2>Section Title</h2>
          </section>
        </main>
      );
      expect(getByRole('heading', { level: 1 })).toBeDefined();
      expect(getByRole('heading', { level: 2 })).toBeDefined();
    });
  });
});
