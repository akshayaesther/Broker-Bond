import React, { useState, useContext } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import { AuthContext } from '../context/AuthContext';
import { useTranslation } from 'react-i18next';
import LanguageSwitcher from '../components/LanguageSwitcher';

const Field = ({ id, label, type = 'text', placeholder, field, form, errors, onChange, hint }) => (
  <div>
    <label htmlFor={id} className="block text-sm font-semibold text-charcoal mb-2">{label}</label>
    <input
      id={id}
      type={type}
      value={form[field]}
      onChange={onChange(field)}
      className={`input-field ${errors[field] ? 'border-red-400 focus:border-red-400 focus:ring-red-200' : ''}`}
      placeholder={placeholder}
      required={field !== 'phone'}
      aria-invalid={Boolean(errors[field])}
      aria-describedby={errors[field] ? `${id}-error` : hint ? `${id}-hint` : undefined}
    />
    {hint && !errors[field] && <p id={`${id}-hint`} className="text-xs text-gray-400 mt-1">{hint}</p>}
    {errors[field] && <p id={`${id}-error`} role="alert" className="text-xs text-red-500 mt-1 font-medium">{errors[field]}</p>}
  </div>
);

const Signup = () => {
  const [form, setForm] = useState({ name: '', email: '', phone: '', password: '', confirmPassword: '' });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const { login } = useContext(AuthContext);
  const { t } = useTranslation();
  const navigate = useNavigate();

  const validate = () => {
    const e = {};
    if (!form.name.trim()) e.name = t('signup.requiredName');
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) e.email = t('signup.validEmail');
    if (form.password.length < 6) e.password = t('signup.passwordLength');
    if (form.password !== form.confirmPassword) e.confirmPassword = t('signup.passwordMismatch');
    return e;
  };

  const handleChange = (field) => (e) => {
    setForm(f => ({ ...f, [field]: e.target.value }));
    setErrors(er => ({ ...er, [field]: '' }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const validationErrors = validate();
    if (Object.keys(validationErrors).length > 0) { setErrors(validationErrors); return; }
    setLoading(true);
    try {
      const res = await axios.post('http://localhost:5000/api/auth/broker/register', {
        name: form.name, email: form.email, password: form.password, phone: form.phone
      });
      login(res.data);
      navigate('/');
    } catch (err) {
      setErrors({ email: err.response?.data?.message || t('signup.registrationFailed') });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex">
      {/* Left decorative panel — identical to Login */}
      <div className="hidden lg:flex w-1/2 bg-charcoal flex-col justify-between p-12 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-80 h-80 bg-primary/20 rounded-full -translate-y-1/2 translate-x-1/2"></div>
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-secondary/20 rounded-full translate-y-1/2 -translate-x-1/2"></div>
        <div className="absolute top-1/2 left-1/2 w-48 h-48 bg-accent/10 rounded-full -translate-x-1/2 -translate-y-1/2"></div>

        <div className="relative z-10">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center text-white font-bold font-heading shadow-lg">BB</div>
            <h1 className="text-2xl font-bold font-heading text-white">Broker-Bond</h1>
          </div>
        </div>

        <div className="relative z-10">
          <h2 className="text-4xl font-bold font-heading text-white mb-4 leading-tight">
            {t('signup.taglineTitle')}<br />
            <span className="text-primary">{t('signup.taglineHighlight')}</span>
          </h2>
          <p className="text-white/60 text-lg leading-relaxed">
            {t('signup.taglineBody')}
          </p>
          <div className="mt-10 flex flex-col space-y-4">
              {[
              { color: 'bg-primary', label: t('signup.freeToStart') },
              { color: 'bg-secondary', label: t('signup.unlimitedCandidates') },
              { color: 'bg-accent', label: t('signup.collaborate') },
            ].map((f) => (
              <div key={f.label} className="flex items-center space-x-3">
                <span className={`w-2 h-2 rounded-full ${f.color}`}></span>
                <span className="text-white/70 font-medium">{f.label}</span>
              </div>
            ))}
          </div>
        </div>

        <p className="text-white/20 text-xs relative z-10">© 2026 Broker-Bond</p>
      </div>

      {/* Right signup form */}
      <div className="flex-1 flex items-center justify-center bg-cream p-8 overflow-y-auto">
        <div className="w-full max-w-md py-8">
          <div className="flex justify-end mb-6"><LanguageSwitcher /></div>
          <div className="mb-8">
            <h2 className="text-3xl font-bold font-heading text-charcoal">{t('signup.title')}</h2>
            <p className="text-gray-500 mt-2">{t('signup.subtitle')}</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <Field id="name" label={t('signup.fullName')} field="name" form={form} errors={errors} onChange={handleChange} placeholder="Ravi Sharma" />
            <Field id="email" label={t('signup.email')} type="email" field="email" form={form} errors={errors} onChange={handleChange} placeholder="ravi@brokerbond.com" />
            <Field id="phone" label={t('signup.phone')} type="tel" field="phone" form={form} errors={errors} onChange={handleChange} placeholder="+91 98765 43210" hint={t('signup.phoneHint')} />
            <Field id="password" label={t('signup.password')} type="password" field="password" form={form} errors={errors} onChange={handleChange} placeholder={t('signup.passwordPlaceholder')} hint={t('signup.passwordHint')} />
            <Field id="confirmPassword" label={t('signup.confirmPassword')} type="password" field="confirmPassword" form={form} errors={errors} onChange={handleChange} placeholder={t('signup.confirmPasswordPlaceholder')} />

            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full text-center disabled:opacity-70"
            >
              {loading ? t('signup.creating') : `${t('signup.title')} →`}
            </button>
          </form>

          <div className="mt-8 pt-6 border-t border-gray-200 text-center">
            <p className="text-gray-500 text-sm">
              {t('signup.alreadyHaveAccount')}{' '}
              <Link to="/login" className="text-primary font-semibold hover:underline">
                {t('common.signIn')}
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Signup;
