import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2 } from 'lucide-react';
import type { Module } from '@/types/modules';

const enrollmentSchema = z.object({
  fullName: z.string().min(2, 'Name must be at least 2 characters').max(100),
  email: z.string().email('Invalid email address').max(255),
  dateOfBirth: z.string().min(1, 'Date of birth is required'),
  isMinor: z.boolean(),
  parentName: z.string().max(100).optional(),
  parentEmail: z.string().email('Invalid email').max(255).optional(),
  parentPhone: z.string().max(20).optional(),
  emergencyContact: z.string().min(5, 'Emergency contact is required').max(200),
  consentGiven: z.boolean().refine(val => val === true, 'Consent is required'),
  paymentType: z.enum(['one_time', 'installment'])
});

type EnrollmentFormData = z.infer<typeof enrollmentSchema>;

interface EnrollmentFormProps {
  module: Module;
  onSubmit: (data: EnrollmentFormData) => Promise<void>;
}

export const EnrollmentForm = ({ module, onSubmit }: EnrollmentFormProps) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const form = useForm<EnrollmentFormData>({
    resolver: zodResolver(enrollmentSchema),
    defaultValues: {
      fullName: '',
      email: '',
      dateOfBirth: '',
      isMinor: false,
      emergencyContact: '',
      consentGiven: false,
      paymentType: 'one_time'
    }
  });

  const isMinor = form.watch('isMinor');

  const handleSubmit = async (data: EnrollmentFormData) => {
    setIsSubmitting(true);
    setError(null);
    
    try {
      await onSubmit(data);
    } catch (err: any) {
      setError(err.message || 'Enrollment failed');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card className="max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle>Enroll in {module.name}</CardTitle>
        <CardDescription>
          Fill out the form below to enroll in this course
        </CardDescription>
      </CardHeader>

      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="fullName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Full Name *</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="John Doe" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email *</FormLabel>
                  <FormControl>
                    <Input {...field} type="email" placeholder="john@example.com" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="dateOfBirth"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Date of Birth *</FormLabel>
                  <FormControl>
                    <Input {...field} type="date" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="isMinor"
              render={({ field }) => (
                <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                  <FormControl>
                    <Checkbox
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                  <div className="space-y-1 leading-none">
                    <FormLabel>I am under 18 years old</FormLabel>
                  </div>
                </FormItem>
              )}
            />

            {isMinor && (
              <>
                <FormField
                  control={form.control}
                  name="parentName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Parent/Guardian Name *</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="Jane Doe" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="parentEmail"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Parent/Guardian Email *</FormLabel>
                      <FormControl>
                        <Input {...field} type="email" placeholder="jane@example.com" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="parentPhone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Parent/Guardian Phone</FormLabel>
                      <FormControl>
                        <Input {...field} type="tel" placeholder="+31 6 12345678" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </>
            )}

            <FormField
              control={form.control}
              name="emergencyContact"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Emergency Contact *</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="Name and phone number" />
                  </FormControl>
                  <FormDescription>
                    Provide a contact person in case of emergency
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="paymentType"
              render={({ field }) => (
                <FormItem className="space-y-3">
                  <FormLabel>Payment Option *</FormLabel>
                  <FormControl>
                    <RadioGroup
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                      className="flex flex-col space-y-1"
                    >
                      <FormItem className="flex items-center space-x-3 space-y-0">
                        <FormControl>
                          <RadioGroupItem value="one_time" />
                        </FormControl>
                        <FormLabel className="font-normal">
                          One-time payment: €{(module.price_one_time_cents / 100).toFixed(2)}
                        </FormLabel>
                      </FormItem>
                      {module.installment_months && module.installment_months > 0 && (
                        <FormItem className="flex items-center space-x-3 space-y-0">
                          <FormControl>
                            <RadioGroupItem value="installment" />
                          </FormControl>
                          <FormLabel className="font-normal">
                            {module.installment_months} monthly payments of €
                            {((module.installment_monthly_cents || 0) / 100).toFixed(2)}
                          </FormLabel>
                        </FormItem>
                      )}
                    </RadioGroup>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="consentGiven"
              render={({ field }) => (
                <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                  <FormControl>
                    <Checkbox
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                  <div className="space-y-1 leading-none">
                    <FormLabel>
                      I agree to the terms and conditions *
                    </FormLabel>
                    <FormDescription>
                      You agree to our Terms of Service and Privacy Policy
                    </FormDescription>
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />

            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <Button type="submit" className="w-full" disabled={isSubmitting}>
              {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Continue to Payment
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
};
