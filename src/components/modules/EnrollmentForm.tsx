import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, CreditCard, Calendar, Info } from 'lucide-react';
import type { Module, EnrollmentFormData } from '@/types/modules';

const enrollmentFormSchema = z.object({
  dateOfBirth: z.string().min(1, 'Date of birth is required'),
  isMinor: z.boolean(),
  parentName: z.string().optional(),
  parentEmail: z.string().email().optional().or(z.literal('')),
  parentPhone: z.string().optional(),
  emergencyContactName: z.string().min(1, 'Emergency contact name is required'),
  emergencyContactPhone: z.string().min(1, 'Emergency contact phone is required'),
  emergencyContactRelationship: z.string().min(1, 'Relationship is required'),
  consentGiven: z.boolean().refine(val => val === true, {
    message: 'You must give consent to continue'
  }),
  paymentType: z.enum(['one_time', 'installment'])
}).refine((data) => {
  if (data.isMinor) {
    return data.parentName && data.parentEmail && data.parentPhone;
  }
  return true;
}, {
  message: 'Parent/guardian information is required for minors',
  path: ['parentName']
});

type EnrollmentFormValues = z.infer<typeof enrollmentFormSchema>;

interface EnrollmentFormProps {
  module: Module;
  onSubmit: (data: EnrollmentFormData) => Promise<void>;
}

export const EnrollmentForm = ({ module, onSubmit }: EnrollmentFormProps) => {
  const { t } = useTranslation();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const form = useForm<EnrollmentFormValues>({
    resolver: zodResolver(enrollmentFormSchema),
    defaultValues: {
      dateOfBirth: '',
      isMinor: false,
      parentName: '',
      parentEmail: '',
      parentPhone: '',
      emergencyContactName: '',
      emergencyContactPhone: '',
      emergencyContactRelationship: '',
      consentGiven: false,
      paymentType: 'one_time'
    }
  });

  const isMinor = form.watch('isMinor');
  const paymentType = form.watch('paymentType');

  const formatPrice = (cents: number) => {
    return `€${(cents / 100).toFixed(2)}`;
  };

  const handleSubmit = async (values: EnrollmentFormValues) => {
    setIsSubmitting(true);
    setError(null);

    try {
      const formData: EnrollmentFormData = {
        dateOfBirth: values.dateOfBirth,
        isMinor: values.isMinor,
        parentName: values.parentName,
        parentEmail: values.parentEmail,
        parentPhone: values.parentPhone,
        emergencyContact: {
          name: values.emergencyContactName,
          phone: values.emergencyContactPhone,
          relationship: values.emergencyContactRelationship
        },
        consentGiven: values.consentGiven,
        paymentType: values.paymentType
      };

      await onSubmit(formData);
    } catch (err) {
      const error = err as Error;
      setError(error.message || t('enrollment.error.generic', 'Failed to process enrollment'));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card className="max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle>{t('enrollment.title', 'Enroll in')} {module.name}</CardTitle>
        <CardDescription>
          {module.description || t('enrollment.description', 'Complete the form below to enroll')}
        </CardDescription>
      </CardHeader>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(handleSubmit)}>
          <CardContent className="space-y-6">
            {/* Test Mode Alert */}
            <Alert>
              <Info className="h-4 w-4" />
              <AlertDescription>
                <strong>{t('enrollment.testMode', 'TEST MODE')}:</strong>{' '}
                {t('enrollment.testModeDescription', 'Payment system is in test mode. No real charges will be made.')}
              </AlertDescription>
            </Alert>

            {/* Personal Information */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">{t('enrollment.personalInfo', 'Personal Information')}</h3>
              
              <FormField
                control={form.control}
                name="dateOfBirth"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('enrollment.dateOfBirth', 'Date of Birth')}</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
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
                      <FormLabel>{t('enrollment.isMinor', 'I am under 18 years old')}</FormLabel>
                    </div>
                  </FormItem>
                )}
              />
            </div>

            {/* Parent/Guardian Information (if minor) */}
            {isMinor && (
              <div className="space-y-4 p-4 border rounded-lg bg-muted/50">
                <h3 className="text-lg font-semibold">{t('enrollment.parentInfo', 'Parent/Guardian Information')}</h3>
                
                <FormField
                  control={form.control}
                  name="parentName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t('enrollment.parentName', 'Parent/Guardian Name')}</FormLabel>
                      <FormControl>
                        <Input {...field} />
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
                      <FormLabel>{t('enrollment.parentEmail', 'Parent/Guardian Email')}</FormLabel>
                      <FormControl>
                        <Input type="email" {...field} />
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
                      <FormLabel>{t('enrollment.parentPhone', 'Parent/Guardian Phone')}</FormLabel>
                      <FormControl>
                        <Input type="tel" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            )}

            {/* Emergency Contact */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">{t('enrollment.emergencyContact', 'Emergency Contact')}</h3>
              
              <FormField
                control={form.control}
                name="emergencyContactName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('enrollment.emergencyContactName', 'Name')}</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="emergencyContactPhone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('enrollment.emergencyContactPhone', 'Phone')}</FormLabel>
                    <FormControl>
                      <Input type="tel" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="emergencyContactRelationship"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('enrollment.emergencyContactRelationship', 'Relationship')}</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder={t('enrollment.relationshipPlaceholder', 'e.g., Parent, Sibling, Friend')} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Payment Type */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">{t('enrollment.paymentOptions', 'Payment Options')}</h3>
              
              <FormField
                control={form.control}
                name="paymentType"
                render={({ field }) => (
                  <FormItem className="space-y-3">
                    <FormControl>
                      <RadioGroup
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                        className="space-y-3"
                      >
                        <div className="flex items-start space-x-3 p-4 border rounded-lg hover:bg-accent cursor-pointer">
                          <RadioGroupItem value="one_time" id="one_time" className="mt-1" />
                          <label htmlFor="one_time" className="flex-1 cursor-pointer">
                            <div className="flex items-center gap-2 font-semibold">
                              <CreditCard className="h-4 w-4" />
                              {t('enrollment.oneTimePayment', 'One-time Payment')}
                            </div>
                            <div className="text-2xl font-bold mt-1">
                              {formatPrice(module.price_one_time_cents)}
                            </div>
                            <p className="text-sm text-muted-foreground mt-1">
                              {t('enrollment.oneTimeDescription', 'Pay once and get full access immediately')}
                            </p>
                          </label>
                        </div>

                        {module.installment_months && module.installment_monthly_cents && (
                          <div className="flex items-start space-x-3 p-4 border rounded-lg hover:bg-accent cursor-pointer">
                            <RadioGroupItem value="installment" id="installment" className="mt-1" />
                            <label htmlFor="installment" className="flex-1 cursor-pointer">
                              <div className="flex items-center gap-2 font-semibold">
                                <Calendar className="h-4 w-4" />
                                {t('enrollment.installmentPayment', 'Monthly Installments')}
                              </div>
                              <div className="text-2xl font-bold mt-1">
                                {formatPrice(module.installment_monthly_cents)}
                                <span className="text-base font-normal text-muted-foreground">
                                  {' '}/ {t('enrollment.month', 'month')}
                                </span>
                              </div>
                              <p className="text-sm text-muted-foreground mt-1">
                                {t('enrollment.installmentDescription', '{{months}} monthly payments', { months: module.installment_months })}
                              </p>
                              <p className="text-xs text-muted-foreground mt-1">
                                {t('enrollment.totalAmount', 'Total')}: {formatPrice(module.installment_monthly_cents * module.installment_months)}
                              </p>
                            </label>
                          </div>
                        )}
                      </RadioGroup>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Consent */}
            <FormField
              control={form.control}
              name="consentGiven"
              render={({ field }) => (
                <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                  <FormControl>
                    <Checkbox
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                  <div className="space-y-1 leading-none">
                    <FormLabel>
                      {t('enrollment.consent', 'I agree to the terms and conditions')}
                    </FormLabel>
                    <FormDescription>
                      {t('enrollment.consentDescription', 'By checking this box, you agree to our terms of service and privacy policy.')}
                    </FormDescription>
                    <FormMessage />
                  </div>
                </FormItem>
              )}
            />

            {/* Error Display */}
            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
          </CardContent>

          <CardFooter>
            <Button type="submit" className="w-full" size="lg" disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {t('enrollment.processing', 'Processing...')}
                </>
              ) : (
                <>
                  {t('enrollment.proceed', 'Proceed to Payment')} - {formatPrice(
                    paymentType === 'one_time' 
                      ? module.price_one_time_cents 
                      : (module.installment_monthly_cents || 0)
                  )}
                </>
              )}
            </Button>
          </CardFooter>
        </form>
      </Form>
    </Card>
  );
};
