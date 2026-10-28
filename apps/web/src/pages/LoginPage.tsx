import { useState, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Car, Phone, ArrowLeft, Shield } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/index';
import { useAuth } from '../features/auth/AuthContext';
import { sendPhoneOtp, verifyOtp, DEV_MODE } from '../lib/firebase';
import api from '../lib/api';
import toast from 'react-hot-toast';

type Step = 'phone' | 'otp';

export default function LoginPage() {
  const [step, setStep] = useState<Step>('phone');
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [loading, setLoading] = useState(false);
  const [confirmation, setConfirmation] = useState<any>(null);
  const [phoneError, setPhoneError] = useState('');
  const otpRefs = useRef<(HTMLInputElement | null)[]>([]);
  const { login } = useAuth();
  const navigate = useNavigate();

  const formatPhone = (raw: string) => {
    const digits = raw.replace(/\D/g, '');
    if (digits.startsWith('91') && digits.length === 12) return '+' + digits;
    if (digits.length === 10) return '+91' + digits;
    return '+91' + digits;
  };

  const validatePhone = (p: string) => {
    const digits = p.replace(/\D/g, '');
    if (digits.length < 10) return 'Enter a valid 10-digit mobile number';
    const last10 = digits.slice(-10);
    if (!/^[6-9]\d{9}$/.test(last10)) return 'Enter a valid Indian mobile number';
    return '';
  };

  const handleSendOtp = async () => {
    const err = validatePhone(phone);
    if (err) { setPhoneError(err); return; }
    setPhoneError('');
    setLoading(true);
    try {
      const formatted = formatPhone(phone);
      const result = await sendPhoneOtp(formatted, 'recaptcha-container');
      setConfirmation(result);
      setStep('otp');
      toast.success(DEV_MODE ? 'Dev mode: use OTP 123456' : `OTP sent to ${formatted}`);
    } catch (err: any) {
      toast.error(err?.message || 'Failed to send OTP');
    } finally {
      setLoading(false);
    }
  };

  const handleOtpChange = (index: number, value: string) => {
    if (!/^\d*$/.test(value)) return;
    const newOtp = [...otp];
    newOtp[index] = value.slice(-1);
    setOtp(newOtp);
    if (value && index < 5) otpRefs.current[index + 1]?.focus();
    if (!value && index > 0) otpRefs.current[index - 1]?.focus();
  };

  const handleOtpKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      otpRefs.current[index - 1]?.focus();
    }
  };

  const handleVerifyOtp = async () => {
    const otpString = otp.join('');
    if (otpString.length < 6) { toast.error('Enter complete 6-digit OTP'); return; }
    setLoading(true);
    try {
      const idToken = await verifyOtp(confirmation, otpString);
      const { data } = await api.post('/auth/login', { idToken });
      const { accessToken, refreshToken, user: userData } = data.data;
      login(accessToken, refreshToken, userData);
      toast.success('Welcome to DriveSafe!');
      if (userData.role === 'ADMIN') navigate('/admin');
      else if (userData.role === 'DRIVER') navigate('/driver');
      else navigate('/dashboard');
    } catch (err: any) {
      const msg = err?.response?.data?.error || err?.message || 'Invalid OTP';
      toast.error(msg);
      setOtp(['', '', '', '', '', '']);
      otpRefs.current[0]?.focus();
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Left panel — branding */}
      <div className="hidden lg:flex w-1/2 bg-gradient-to-br from-dark-navy to-dark-charcoal text-white flex-col justify-between p-12">
        <Link to="/" className="flex items-center gap-2">
          <div className="w-9 h-9 rounded-xl bg-primary flex items-center justify-center">
            <Car size={20} className="text-white" />
          </div>
          <span className="font-bold text-2xl">DriveSafe India</span>
        </Link>

        <div>
          <h2 className="text-4xl font-bold leading-tight mb-4">
            Safe Rides,<br />
            <span className="text-primary">Every Time.</span>
          </h2>
          <p className="text-white/60 text-lg mb-8 max-w-sm">
            Professional drivers for your own car. Police-verified, trained, and always on time.
          </p>
          <div className="flex items-center gap-3 bg-white/10 rounded-xl p-4">
            <Shield size={20} className="text-primary" />
            <p className="text-sm text-white/80">All drivers are police-verified and background-checked</p>
          </div>
        </div>

        <p className="text-white/30 text-sm">© 2024 DriveSafe India</p>
      </div>

      {/* Right panel — form */}
      <div className="flex-1 flex items-center justify-center p-6">
        <div className="w-full max-w-sm">
          {/* Mobile logo */}
          <div className="lg:hidden flex items-center gap-2 mb-8">
            <div className="w-9 h-9 rounded-xl bg-primary flex items-center justify-center">
              <Car size={20} className="text-white" />
            </div>
            <span className="font-bold text-xl text-gray-900">DriveSafe India</span>
          </div>

          {step === 'phone' ? (
            <>
              <div className="mb-8">
                <h1 className="text-2xl font-bold text-gray-900 mb-1">Welcome back</h1>
                <p className="text-gray-500 text-sm">Enter your mobile number to continue</p>
              </div>

              {DEV_MODE && (
                <div className="mb-5 p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-700">
                  <strong>Dev Mode:</strong> Use any Indian number. OTP is <strong>123456</strong>.<br />
                  Quick: <button onClick={() => setPhone('9999999901')} className="underline font-medium">Customer</button>{' · '}
                  <button onClick={() => setPhone('9999999902')} className="underline font-medium">Driver</button>{' · '}
                  <button onClick={() => setPhone('9999999900')} className="underline font-medium">Admin</button>
                </div>
              )}

              <div className="space-y-4">
                <div>
                  <label className="input-label">Mobile Number</label>
                  <div className="flex gap-2">
                    <div className="flex items-center gap-1.5 px-3 py-3 border border-gray-200 rounded-lg bg-gray-50 text-sm font-medium text-gray-600 whitespace-nowrap">
                      🇮🇳 +91
                    </div>
                    <input
                      className="input-field flex-1"
                      type="tel"
                      placeholder="Enter 10-digit number"
                      value={phone}
                      onChange={e => { setPhone(e.target.value); setPhoneError(''); }}
                      onKeyDown={e => e.key === 'Enter' && handleSendOtp()}
                      maxLength={10}
                      autoFocus
                    />
                  </div>
                  {phoneError && <p className="input-error">{phoneError}</p>}
                </div>

                <Button fullWidth loading={loading} onClick={handleSendOtp} size="lg">
                  Send OTP
                </Button>

                <p className="text-xs text-gray-400 text-center">
                  By continuing, you agree to our{' '}
                  <a href="#" className="text-primary hover:underline">Terms</a> &{' '}
                  <a href="#" className="text-primary hover:underline">Privacy Policy</a>
                </p>
              </div>
            </>
          ) : (
            <>
              <button
                onClick={() => { setStep('phone'); setOtp(['', '', '', '', '', '']); }}
                className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700 mb-6 transition-colors"
              >
                <ArrowLeft size={16} />
                Change number
              </button>

              <div className="mb-8">
                <h1 className="text-2xl font-bold text-gray-900 mb-1">Verify OTP</h1>
                <p className="text-gray-500 text-sm">
                  Enter the 6-digit code sent to{' '}
                  <span className="font-semibold text-gray-700">+91 {phone}</span>
                </p>
              </div>

              {DEV_MODE && (
                <div className="mb-5 p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-700">
                  Dev mode: enter <strong>123456</strong> as OTP
                </div>
              )}

              <div className="space-y-6">
                {/* OTP input boxes */}
                <div>
                  <p className="text-sm font-medium text-gray-700 mb-3">Enter OTP</p>
                  <div className="flex gap-3 justify-between">
                    {otp.map((digit, i) => (
                      <input
                        key={i}
                        ref={el => { otpRefs.current[i] = el; }}
                        type="text"
                        inputMode="numeric"
                        maxLength={1}
                        value={digit}
                        onChange={e => handleOtpChange(i, e.target.value)}
                        onKeyDown={e => handleOtpKeyDown(i, e)}
                        className={`w-12 h-14 text-center text-xl font-bold rounded-xl border-2 outline-none transition-all
                          ${digit ? 'border-primary bg-primary-50 text-primary' : 'border-gray-200 bg-white text-gray-900'}
                          focus:border-primary focus:ring-2 focus:ring-primary-100`}
                        autoFocus={i === 0}
                      />
                    ))}
                  </div>
                </div>

                <Button fullWidth loading={loading} onClick={handleVerifyOtp} size="lg">
                  Verify & Continue
                </Button>

                <div className="text-center">
                  <p className="text-sm text-gray-400">Didn't receive the OTP?</p>
                  <button
                    onClick={handleSendOtp}
                    className="text-sm text-primary font-medium hover:underline mt-1"
                    disabled={loading}
                  >
                    Resend OTP
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Invisible recaptcha container */}
      <div id="recaptcha-container" />
    </div>
  );
}
