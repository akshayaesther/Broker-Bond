import React, { useState, useContext } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import { AuthContext } from '../context/AuthContext';
import { useTranslation } from 'react-i18next';
import LanguageSwitcher from '../components/LanguageSwitcher';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useContext(AuthContext);
  const { t } = useTranslation();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await axios.post('http://localhost:5000/api/auth/broker/login', { email, password });
      login(res.data);
      navigate('/');
    } catch (err) {
      alert(t('login.loginFailed'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex">
      {/* Left decorative panel */}
      <div className="hidden lg:flex w-1/2 bg-charcoal flex-col justify-between p-12 relative overflow-hidden">
        {/* Decorative blobs */}
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
            {t('login.taglineTitle')}
          </h2>
          <p className="text-white/60 text-lg leading-relaxed">
            {t('login.taglineBody')}
          </p>

          <div className="mt-10 flex flex-col space-y-4">
              {[
              { color: 'bg-primary', label: t('login.candidateManagement') },
              { color: 'bg-secondary', label: t('login.autoMatchScoring') },
              { color: 'bg-accent', label: t('login.dealPipelineTracking') },
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

      {/* Right login form */}
      <div className="flex-1 flex items-center justify-center bg-cream p-8">
        <div className="w-full max-w-md">
          <div className="flex justify-end mb-6"><LanguageSwitcher /></div>
          <div className="mb-10">
            <h2 className="text-3xl font-bold font-heading text-charcoal">{t('login.welcome')}</h2>
            <p className="text-gray-500 mt-2">{t('login.subtitle')}</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-semibold text-charcoal mb-2">{t('login.email')}</label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                className="input-field"
                placeholder="ravi@brokerbond.com"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-charcoal mb-2">{t('login.password')}</label>
              <input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                className="input-field"
                placeholder={t('login.passwordPlaceholder')}
                required
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full text-center mt-2 disabled:opacity-70"
            >
              {loading ? t('login.signingIn') : `${t('common.signIn')} →`}
            </button>
          </form>

          <div className="mt-8 pt-6 border-t border-gray-200 space-y-3 text-center">
            <p className="text-gray-500 text-sm">
              {t('login.newBroker')}{' '}
              <Link to="/signup" className="text-primary font-semibold hover:underline">
                {t('login.createAccount')}
              </Link>
            </p>
            <p className="text-gray-500 text-sm">
              {t('login.familyMember')}{' '}
              <Link to="/family-portal" className="text-secondary font-semibold hover:underline">
                {t('login.familyPortal')}
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
