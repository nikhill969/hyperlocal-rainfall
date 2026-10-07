import { useEffect, useRef, useState } from 'react';
import AreaPicker from './AreaPicker';

const googleScriptUrl = 'https://accounts.google.com/gsi/client';

export default function AuthPage({ onLogin, onAdminLogin, onRegister, onGoogleLogin, onGoogleRegister, onForgotPassword, onResetPassword, message }) {
  const resetFromUrl = new URLSearchParams(window.location.search).get('resetToken') || '';
  const [mode, setMode] = useState(resetFromUrl ? 'reset' : 'login');
  const [form, setForm] = useState({ name: '', email: '', password: '', confirmPassword: '' });
  const [selectedArea, setSelectedArea] = useState(null);
  const [googlePending, setGooglePending] = useState(null);
  const [resetToken, setResetToken] = useState(resetFromUrl);
  const [resetLink, setResetLink] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [googleMessage, setGoogleMessage] = useState('');
  const [busy, setBusy] = useState(false);
  const googleButtonRef = useRef(null);
  const googleFlowRef = useRef(false);
  const googleLoginRef = useRef(onGoogleLogin);
  googleLoginRef.current = onGoogleLogin;
  const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;

  useEffect(() => {
    if (!clientId || !googleButtonRef.current) return undefined;

    const renderGoogleButton = () => {
      if (!window.google?.accounts?.id || !googleButtonRef.current) return;
      googleButtonRef.current.replaceChildren();
      window.google.accounts.id.initialize({
        client_id: clientId,
        auto_select: false,
        cancel_on_tap_outside: true,
        callback: async (response) => {
          googleFlowRef.current = false;
          setGoogleMessage('');
          setError('');
          setBusy(true);
          try {
            const result = await googleLoginRef.current(response.credential);
            if (result?.needsRegistration) {
              setGooglePending({ credential: response.credential, profile: result.googleProfile });
              setForm((current) => ({ ...current, name: result.googleProfile.name || '', email: result.googleProfile.email }));
              setSelectedArea(null);
              setMode('register');
              setSuccess('Choose your area to finish creating your citizen account.');
            }
          } catch (requestError) {
            setError(requestError.message || 'Google sign-in failed. Please try again.');
          } finally {
            setBusy(false);
          }
        }
      });
      window.google.accounts.id.renderButton(googleButtonRef.current, {
        type: 'standard',
        theme: 'outline',
        size: 'large',
        text: 'continue_with',
        shape: 'rectangular',
        width: Math.min(360, googleButtonRef.current.clientWidth || 320),
        logo_alignment: 'left'
      });
    };

    let script = document.querySelector(`script[src="${googleScriptUrl}"]`);
    if (window.google?.accounts?.id) {
      renderGoogleButton();
      return undefined;
    }
    if (!script) {
      script = document.createElement('script');
      script.src = googleScriptUrl;
      script.async = true;
      script.defer = true;
      document.head.appendChild(script);
    }
    const handleScriptLoad = () => {
      script.dataset.loaded = 'true';
      renderGoogleButton();
    };
    const handleScriptError = () => setGoogleMessage('Google sign-in could not load. Check your connection or use email sign-in.');
    if (script.dataset.loaded === 'true') renderGoogleButton();
    else {
      script.addEventListener('load', handleScriptLoad);
      script.addEventListener('error', handleScriptError);
    }
    return () => {
      script.removeEventListener('load', handleScriptLoad);
      script.removeEventListener('error', handleScriptError);
    };
  }, [clientId]);

  useEffect(() => {
    const handleWindowBlur = () => {
      if (googleButtonRef.current?.contains(document.activeElement)) {
        googleFlowRef.current = true;
        setGoogleMessage('Waiting for Google account selection...');
      }
    };
    const handleWindowFocus = () => {
      if (googleFlowRef.current) {
        googleFlowRef.current = false;
        setGoogleMessage('Google sign-in was canceled or closed. You can try again or use email sign-in.');
      }
    };
    window.addEventListener('blur', handleWindowBlur);
    window.addEventListener('focus', handleWindowFocus);
    return () => {
      window.removeEventListener('blur', handleWindowBlur);
      window.removeEventListener('focus', handleWindowFocus);
    };
  }, []);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');
    setSuccess('');
    setResetLink('');
    setBusy(true);
    try {
      if (mode === 'login' || mode === 'admin-login') {
        const credentials = { email: form.email, password: form.password };
        if (mode === 'admin-login') await onAdminLogin(credentials);
        else await onLogin(credentials);
      } else if (mode === 'register' && googlePending) {
        if (!selectedArea) throw new Error('Search for your area or use your current location.');
        await onGoogleRegister({
          credential: googlePending.credential,
          name: form.name,
          area: selectedArea.name,
          areaLatitude: selectedArea.latitude,
          areaLongitude: selectedArea.longitude
        });
      } else if (mode === 'register') {
        if (!selectedArea) throw new Error('Search for your area or use your current location.');
        const result = await onRegister({
          name: form.name,
          email: form.email,
          password: form.password,
          area: selectedArea.name,
          areaLatitude: selectedArea.latitude,
          areaLongitude: selectedArea.longitude
        });
        setMode('login');
        setForm((current) => ({ ...current, password: '' }));
        setSelectedArea(null);
        setGooglePending(null);
        setSuccess(result.message || 'Registration successful. Please login to continue.');
      } else if (mode === 'forgot') {
        const result = await onForgotPassword(form.email);
        setSuccess(result.message || 'If an account exists for that email, password reset instructions are ready.');
        setResetLink(result.developmentResetToken
          ? `${window.location.origin}/?resetToken=${encodeURIComponent(result.developmentResetToken)}`
          : '');
      } else {
        if (form.password !== form.confirmPassword) throw new Error('The passwords do not match.');
        const result = await onResetPassword(resetToken, form.password);
        setSuccess(result.message || 'Password updated. Sign in with your new password.');
        setMode('login');
        setGooglePending(null);
        window.history.replaceState({}, '', window.location.pathname);
      }
    } catch (requestError) {
      setError(requestError.message || 'Unable to continue. Please try again.');
    } finally {
      setBusy(false);
    }
  };

  const switchMode = (nextMode) => {
    setMode(nextMode);
    setError('');
    setSuccess('');
    setResetLink('');
    setGoogleMessage('');
    if (nextMode !== 'register') setGooglePending(null);
  };

  return (
    <main className="auth-layout">
      <section className="auth-story">
        <p className="eyebrow">Localized environmental risk assessment</p>
        <h1>Know your area.<br />Report what you see.</h1>
        <p>Rainfall, local observations, and geographic context in one shared waterlogging risk workspace.</p>
        <div className="auth-story-note">
          <span className="risk-key low" /> Low
          <span className="risk-key medium" /> Medium
          <span className="risk-key high" /> High
          <small>Prototype assessment, not an official flood warning.</small>
        </div>
      </section>

      <section className="auth-panel">
        {mode !== 'forgot' && mode !== 'reset' && <div className="auth-tabs" role="tablist" aria-label="Account access">
          <button type="button" className={mode === 'login' ? 'selected' : ''} onClick={() => switchMode('login')}>Citizen sign in</button>
          <button type="button" className={mode === 'admin-login' ? 'selected' : ''} onClick={() => switchMode('admin-login')}>Admin sign in</button>
          <button type="button" className={mode === 'register' ? 'selected' : ''} onClick={() => switchMode('register')}>Citizen registration</button>
        </div>}

        <form onSubmit={handleSubmit}>
          <div className="auth-heading">
            <span className="eyebrow">Hyperlocal Rainfall</span>
            <h2>{mode === 'login' ? 'Citizen sign in' : mode === 'admin-login' ? 'Administrator sign in' : mode === 'register' ? 'Create a citizen account' : mode === 'forgot' ? 'Reset your password' : 'Choose a new password'}</h2>
            <p>{mode === 'login' ? 'Sign in to view your locality dashboard.' : mode === 'admin-login' ? 'Administrator credentials provide access to all areas.' : mode === 'register' ? 'Your selected area determines which reports you can access.' : mode === 'forgot' ? 'We will prepare a secure, time-limited reset link if the account exists.' : 'This link expires after 30 minutes and can only be used once.'}</p>
          </div>

          {(mode === 'login' || mode === 'admin-login') && <>
            <label className="auth-field">Email address<input type="email" value={form.email} onChange={(event) => setForm({ ...form, email: event.target.value })} autoComplete="email" required /></label>
            <label className="auth-field">Password<input type="password" value={form.password} onChange={(event) => setForm({ ...form, password: event.target.value })} autoComplete="current-password" required /></label>
            <button type="button" className="forgot-link" onClick={() => switchMode('forgot')}>Forgot password?</button>
          </>}

          {mode === 'forgot' && <label className="auth-field">Email address<input type="email" value={form.email} onChange={(event) => setForm({ ...form, email: event.target.value })} autoComplete="email" required /></label>}

          {mode === 'reset' && <>
            <label className="auth-field">New password<input type="password" value={form.password} onChange={(event) => setForm({ ...form, password: event.target.value })} autoComplete="new-password" minLength="8" required /></label>
            <label className="auth-field">Confirm new password<input type="password" value={form.confirmPassword} onChange={(event) => setForm({ ...form, confirmPassword: event.target.value })} autoComplete="new-password" minLength="8" required /></label>
          </>}

          {mode === 'register' && <>
            <label className="auth-field">Full name<input value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} autoComplete="name" required maxLength="80" readOnly={Boolean(googlePending)} /></label>
            <label className="auth-field">Email address<input type="email" value={form.email} onChange={(event) => setForm({ ...form, email: event.target.value })} autoComplete="email" required readOnly={Boolean(googlePending)} /></label>
            {!googlePending && <label className="auth-field">Password<input type="password" value={form.password} onChange={(event) => setForm({ ...form, password: event.target.value })} autoComplete="new-password" minLength="8" required /><small>Use at least 8 characters.</small></label>}
            <AreaPicker label="Area / locality" placeholder="Search city, area, or place..." value={selectedArea} onSelect={setSelectedArea} />
          </>}

          {(error || message) && <p className="auth-error" role="alert">{error || message}</p>}
          {success && <p className="auth-success" role="status">{success}</p>}
          {resetLink && <a className="dev-reset-link" href={resetLink}>Open the development reset link</a>}
          {googleMessage && <p className="auth-google-message" role="status">{googleMessage}</p>}

          {clientId
            ? <div className={`google-button-shell ${mode === 'login' ? '' : 'google-button-hidden'}`} ref={googleButtonRef} aria-hidden={mode !== 'login'} />
            : mode === 'login' && <button className="google-unconfigured" type="button" onClick={() => setGoogleMessage('Google sign-in needs VITE_GOOGLE_CLIENT_ID and GOOGLE_CLIENT_ID configured by the administrator.')}><span aria-hidden="true">G</span>Continue with Google</button>}
          {mode === 'login' && <div className="auth-divider"><span>or continue with email</span></div>}

          <button className="auth-submit" type="submit" disabled={busy}>
            {busy ? 'Please wait...' : mode === 'login' ? 'Sign in' : mode === 'admin-login' ? 'Admin sign in' : mode === 'register' ? googlePending ? 'Create citizen account' : 'Create account' : mode === 'forgot' ? 'Send reset link' : 'Update password'}
          </button>
          {(mode === 'forgot' || mode === 'reset') && <button className="forgot-link back-to-login" type="button" onClick={() => switchMode('login')}>Back to sign in</button>}
          {import.meta.env.DEV && mode === 'admin-login' && <p className="demo-credentials">Demo admin: admin@hyperlocal.local / RainfallAdmin!2026</p>}
        </form>
      </section>
    </main>
  );
}