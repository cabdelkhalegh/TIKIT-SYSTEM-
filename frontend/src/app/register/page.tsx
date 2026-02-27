'use client';

import { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { authService } from '@/services/auth.service';
import { CheckCircle2, Upload, Loader2, AlertCircle } from 'lucide-react';

// ─── Step Schemas ───────────────────────────────────────────────────────────

const step1Schema = z.object({
  fullName: z.string().min(2, 'Full name must be at least 2 characters').max(100),
  email: z.string().email('Invalid email address'),
  password: z.string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/[A-Z]/, 'Must contain at least one uppercase letter')
    .regex(/[a-z]/, 'Must contain at least one lowercase letter')
    .regex(/[0-9]/, 'Must contain at least one number'),
  confirmPassword: z.string(),
  phone: z.string().optional(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ['confirmPassword'],
});

type Step1Data = z.infer<typeof step1Schema>;

interface ExtractionData {
  companyName: string | null;
  vatTrnNumber: string | null;
  licenseNumber: string | null;
  expiryDate: string | null;
  businessAddress: string | null;
  activities: string[];
  ownerNames: string[];
}

// ─── Confidence Badge ───────────────────────────────────────────────────────

function ConfidenceBadge({ score }: { score: number }) {
  if (score >= 0.8) return <span className="text-xs px-1.5 py-0.5 rounded bg-green-100 text-green-700">High</span>;
  if (score >= 0.5) return <span className="text-xs px-1.5 py-0.5 rounded bg-amber-100 text-amber-700">Medium</span>;
  return <span className="text-xs px-1.5 py-0.5 rounded bg-red-100 text-red-700">Low</span>;
}

// ─── Step Indicator ─────────────────────────────────────────────────────────

function StepIndicator({ currentStep }: { currentStep: number }) {
  const steps = ['Account', 'Trade License', 'Review'];
  return (
    <div className="flex items-center justify-center mb-6">
      {steps.map((label, idx) => {
        const stepNum = idx + 1;
        const isActive = stepNum === currentStep;
        const isCompleted = stepNum < currentStep;
        return (
          <div key={label} className="flex items-center">
            <div className={`flex items-center justify-center w-8 h-8 rounded-full text-sm font-medium transition-colors ${
              isCompleted ? 'bg-green-500 text-white' :
              isActive ? 'bg-purple-600 text-white' :
              'bg-gray-200 text-gray-500'
            }`}>
              {isCompleted ? <CheckCircle2 className="w-5 h-5" /> : stepNum}
            </div>
            <span className={`ml-2 text-sm ${isActive ? 'font-semibold text-gray-900' : 'text-gray-500'}`}>
              {label}
            </span>
            {idx < steps.length - 1 && (
              <div className={`mx-3 w-12 h-0.5 ${stepNum < currentStep ? 'bg-green-500' : 'bg-gray-200'}`} />
            )}
          </div>
        );
      })}
    </div>
  );
}

// ─── Main Component ─────────────────────────────────────────────────────────

export default function RegisterPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [registrationToken, setRegistrationToken] = useState('');
  const [extractedData, setExtractedData] = useState<ExtractionData | null>(null);
  const [confidenceScores, setConfidenceScores] = useState<Record<string, number> | null>(null);
  const [extractionFailed, setExtractionFailed] = useState(false);
  const [licenseFileUrl, setLicenseFileUrl] = useState('');
  const [submitted, setSubmitted] = useState(false);

  // Editable review data
  const [reviewData, setReviewData] = useState<ExtractionData>({
    companyName: null,
    vatTrnNumber: null,
    licenseNumber: null,
    expiryDate: null,
    businessAddress: null,
    activities: [],
    ownerNames: [],
  });

  const step1Form = useForm<Step1Data>({
    resolver: zodResolver(step1Schema),
  });

  // ─── Step 1: Account credentials ────────────────────────────────────────
  const onStep1Submit = async (data: Step1Data) => {
    setIsLoading(true);
    setError('');

    try {
      const { confirmPassword, ...registerData } = data;
      const response = await authService.registerStep1(registerData);
      if (response.success && response.data.token) {
        setRegistrationToken(response.data.token);
        setStep(2);
      }
    } catch (err: any) {
      setError(
        err.response?.data?.error || err.message || 'Registration failed. Please try again.'
      );
    } finally {
      setIsLoading(false);
    }
  };

  // ─── Step 2: Trade license upload ───────────────────────────────────────
  const handleFileUpload = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsLoading(true);
    setError('');
    setExtractionFailed(false);

    try {
      // For now, use a placeholder URL — in production this would upload to cloud storage first
      const fakeUrl = `/uploads/licenses/${Date.now()}-${file.name}`;
      setLicenseFileUrl(fakeUrl);

      const response = await authService.registerStep2(fakeUrl, registrationToken);

      if (response.success && response.data.extractionSuccess && response.data.extraction) {
        setExtractedData(response.data.extraction);
        setConfidenceScores(response.data.confidenceScores);
        setReviewData({
          companyName: response.data.extraction.companyName,
          vatTrnNumber: response.data.extraction.vatTrnNumber,
          licenseNumber: response.data.extraction.licenseNumber,
          expiryDate: response.data.extraction.expiryDate,
          businessAddress: response.data.extraction.businessAddress,
          activities: response.data.extraction.activities || [],
          ownerNames: response.data.extraction.ownerNames || [],
        });
      } else {
        setExtractionFailed(true);
        setReviewData({
          companyName: null,
          vatTrnNumber: null,
          licenseNumber: null,
          expiryDate: null,
          businessAddress: null,
          activities: [],
          ownerNames: [],
        });
      }

      setStep(3);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to process trade license');
    } finally {
      setIsLoading(false);
    }
  }, [registrationToken]);

  const skipLicense = () => {
    setExtractionFailed(true);
    setStep(3);
  };

  // ─── Step 3: Review & Submit ────────────────────────────────────────────
  const handleFinalSubmit = async () => {
    setIsLoading(true);
    setError('');

    try {
      // Save reviewed data
      await authService.registerStep3(
        {
          companyName: reviewData.companyName || undefined,
          vatTrnNumber: reviewData.vatTrnNumber || undefined,
          licenseNumber: reviewData.licenseNumber || undefined,
          expiryDate: reviewData.expiryDate || undefined,
          businessAddress: reviewData.businessAddress || undefined,
          activities: reviewData.activities.length > 0 ? reviewData.activities : undefined,
          ownerNames: reviewData.ownerNames.length > 0 ? reviewData.ownerNames : undefined,
        },
        registrationToken
      );

      // Final submit
      await authService.registerSubmit(registrationToken);
      setSubmitted(true);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Submission failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // ─── Success Screen ─────────────────────────────────────────────────────
  if (submitted) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-50 via-white to-purple-50 px-4 py-12">
        <Card className="w-full max-w-md">
          <CardContent className="pt-8 pb-8 text-center space-y-4">
            <CheckCircle2 className="w-16 h-16 text-green-500 mx-auto" />
            <h2 className="text-2xl font-bold text-gray-900">Registration Submitted</h2>
            <p className="text-gray-600">
              Your account is pending Director approval. You will be able to log in once your registration has been reviewed and approved.
            </p>
            <Button onClick={() => router.push('/login')} className="mt-4">
              Go to Login
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-50 via-white to-purple-50 px-4 py-12">
      <Card className="w-full max-w-lg">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold text-center">Create an account</CardTitle>
          <CardDescription className="text-center">
            {step === 1 && 'Enter your account details'}
            {step === 2 && 'Upload your trade license for verification'}
            {step === 3 && 'Review your information before submitting'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <StepIndicator currentStep={step} />

          {error && (
            <Alert variant="destructive" className="mb-4">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* ── Step 1: Credentials ──────────────────────────────────── */}
          {step === 1 && (
            <form onSubmit={step1Form.handleSubmit(onStep1Submit)} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="fullName">Full Name</Label>
                <Input id="fullName" placeholder="John Doe" {...step1Form.register('fullName')} />
                {step1Form.formState.errors.fullName && (
                  <p className="text-sm text-red-500">{step1Form.formState.errors.fullName.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input id="email" type="email" placeholder="you@example.com" {...step1Form.register('email')} />
                {step1Form.formState.errors.email && (
                  <p className="text-sm text-red-500">{step1Form.formState.errors.email.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone">Phone (optional)</Label>
                <Input id="phone" placeholder="+971-50-1234567" {...step1Form.register('phone')} />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input id="password" type="password" placeholder="Min 8 chars, uppercase, lowercase, number" {...step1Form.register('password')} />
                {step1Form.formState.errors.password && (
                  <p className="text-sm text-red-500">{step1Form.formState.errors.password.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirm Password</Label>
                <Input id="confirmPassword" type="password" placeholder="Re-enter password" {...step1Form.register('confirmPassword')} />
                {step1Form.formState.errors.confirmPassword && (
                  <p className="text-sm text-red-500">{step1Form.formState.errors.confirmPassword.message}</p>
                )}
              </div>

              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Creating...</> : 'Continue'}
              </Button>

              <p className="text-center text-sm text-gray-600">
                Already have an account?{' '}
                <Link href="/login" className="text-indigo-600 hover:text-indigo-500 font-medium">Sign in</Link>
              </p>
            </form>
          )}

          {/* ── Step 2: Trade License Upload ─────────────────────────── */}
          {step === 2 && (
            <div className="space-y-4">
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-purple-400 transition-colors">
                <Upload className="w-10 h-10 text-gray-400 mx-auto mb-3" />
                <p className="text-sm text-gray-600 mb-2">Upload your UAE trade license</p>
                <p className="text-xs text-gray-400 mb-4">PDF, JPG, or PNG (max 10MB)</p>
                <label className="cursor-pointer">
                  <Input
                    type="file"
                    accept=".pdf,.jpg,.jpeg,.png"
                    className="hidden"
                    onChange={handleFileUpload}
                    disabled={isLoading}
                  />
                  <Button type="button" variant="outline" disabled={isLoading} asChild>
                    <span>
                      {isLoading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Extracting data...</> : 'Choose File'}
                    </span>
                  </Button>
                </label>
              </div>

              {isLoading && (
                <Alert>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <AlertDescription>AI is extracting data from your trade license...</AlertDescription>
                </Alert>
              )}

              <Button variant="ghost" onClick={skipLicense} className="w-full text-gray-500" disabled={isLoading}>
                Skip — I'll add details manually
              </Button>
            </div>
          )}

          {/* ── Step 3: Review ───────────────────────────────────────── */}
          {step === 3 && (
            <div className="space-y-4">
              {extractionFailed && (
                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>AI extraction was not available. Please enter your company details manually.</AlertDescription>
                </Alert>
              )}

              <div className="space-y-3">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <Label htmlFor="companyName">Company Name</Label>
                    {confidenceScores?.companyName !== undefined && <ConfidenceBadge score={confidenceScores.companyName} />}
                  </div>
                  <Input
                    id="companyName"
                    value={reviewData.companyName || ''}
                    onChange={(e) => setReviewData({ ...reviewData, companyName: e.target.value })}
                  />
                </div>

                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <Label htmlFor="vatTrnNumber">VAT/TRN Number</Label>
                    {confidenceScores?.vatTrnNumber !== undefined && <ConfidenceBadge score={confidenceScores.vatTrnNumber} />}
                  </div>
                  <Input
                    id="vatTrnNumber"
                    value={reviewData.vatTrnNumber || ''}
                    onChange={(e) => setReviewData({ ...reviewData, vatTrnNumber: e.target.value })}
                  />
                </div>

                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <Label htmlFor="licenseNumber">License Number</Label>
                    {confidenceScores?.licenseNumber !== undefined && <ConfidenceBadge score={confidenceScores.licenseNumber} />}
                  </div>
                  <Input
                    id="licenseNumber"
                    value={reviewData.licenseNumber || ''}
                    onChange={(e) => setReviewData({ ...reviewData, licenseNumber: e.target.value })}
                  />
                </div>

                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <Label htmlFor="expiryDate">Expiry Date</Label>
                    {confidenceScores?.expiryDate !== undefined && <ConfidenceBadge score={confidenceScores.expiryDate} />}
                  </div>
                  <Input
                    id="expiryDate"
                    type="date"
                    value={reviewData.expiryDate?.split('T')[0] || ''}
                    onChange={(e) => setReviewData({ ...reviewData, expiryDate: e.target.value })}
                  />
                </div>

                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <Label htmlFor="businessAddress">Business Address</Label>
                    {confidenceScores?.businessAddress !== undefined && <ConfidenceBadge score={confidenceScores.businessAddress} />}
                  </div>
                  <Input
                    id="businessAddress"
                    value={reviewData.businessAddress || ''}
                    onChange={(e) => setReviewData({ ...reviewData, businessAddress: e.target.value })}
                  />
                </div>

                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <Label htmlFor="activities">Activities (comma-separated)</Label>
                    {confidenceScores?.activities !== undefined && <ConfidenceBadge score={confidenceScores.activities} />}
                  </div>
                  <Input
                    id="activities"
                    value={reviewData.activities.join(', ')}
                    onChange={(e) =>
                      setReviewData({
                        ...reviewData,
                        activities: e.target.value.split(',').map((s) => s.trim()).filter(Boolean),
                      })
                    }
                  />
                </div>

                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <Label htmlFor="ownerNames">Owner Names (comma-separated)</Label>
                    {confidenceScores?.ownerNames !== undefined && <ConfidenceBadge score={confidenceScores.ownerNames} />}
                  </div>
                  <Input
                    id="ownerNames"
                    value={reviewData.ownerNames.join(', ')}
                    onChange={(e) =>
                      setReviewData({
                        ...reviewData,
                        ownerNames: e.target.value.split(',').map((s) => s.trim()).filter(Boolean),
                      })
                    }
                  />
                </div>
              </div>

              <div className="flex gap-3 pt-2">
                <Button variant="outline" onClick={() => setStep(2)} className="flex-1" disabled={isLoading}>
                  Back
                </Button>
                <Button onClick={handleFinalSubmit} className="flex-1" disabled={isLoading}>
                  {isLoading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Submitting...</> : 'Submit Registration'}
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
