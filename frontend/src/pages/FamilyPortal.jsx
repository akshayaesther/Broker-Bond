import React, { useState } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';
import { Heart, ShieldCheck, Users, LayoutDashboard, Search, Send } from 'lucide-react';
import toast from 'react-hot-toast';
import GenderAvatar from '../components/GenderAvatar';
import PageLoader from '../components/PageLoader';
import CandidateTrust from '../components/CandidateTrust';
import { useTranslation } from 'react-i18next';
import LanguageSwitcher from '../components/LanguageSwitcher';

const STAGE_CONFIG = {
  'Interested':        { color: 'bg-gray-200',   label: 'family.interested',       step: 1 },
  'Meeting Arranged':  { color: 'bg-accent',      label: 'family.meetingArranged', step: 2 },
  'Family Approved':   { color: 'bg-secondary',   label: 'family.familyApproved',  step: 3 },
  'Married':           { color: 'bg-primary',      label: 'family.married',      step: 4 },
};

const FamilyPortal = () => {
  const { t } = useTranslation();
  const translateCompatibilityTag = tag => t(`candidates.compatibilityReasons.${tag}`, { defaultValue: tag });
  const [step, setStep] = useState(1);
  const [email, setEmail] = useState('');
  const [candidateId, setCandidateId] = useState('');
  const [submittedEmail, setSubmittedEmail] = useState('');
  const [submittedCandidateId, setSubmittedCandidateId] = useState('');
  const [otp, setOtp] = useState('');
  const [previewUrl, setPreviewUrl] = useState('');
  const [portalData, setPortalData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [requestError, setRequestError] = useState('');
  const [otpError, setOtpError] = useState('');
  const [familyToken, setFamilyToken] = useState('');
  const [portalTab, setPortalTab] = useState('status');
  const [browseProfiles, setBrowseProfiles] = useState([]);
  const [browseLoading, setBrowseLoading] = useState(false);
  const [browseFilters, setBrowseFilters] = useState({ ageMin: '', ageMax: '', city: '', education: '', income: '', denomination: '', churchAttendance: '', faithImportance: '', recentlyUpdated: false });
  const [interestLoading, setInterestLoading] = useState(null);
  const [showMoreFilters, setShowMoreFilters] = useState(false);

  const requestOtp = async (e) => {
    e.preventDefault();
    setLoading(true);
    setRequestError('');
    setOtpError('');
    const normalizedEmail = email.trim().toLowerCase();
    const normalizedCandidateId = candidateId.trim();
    try {
      const res = await axios.post('http://localhost:5000/api/auth/family/request-otp', {
        email: normalizedEmail,
        candidateId: normalizedCandidateId
      });
      setSubmittedEmail(normalizedEmail);
      setSubmittedCandidateId(normalizedCandidateId);
      setOtp('');
      setPreviewUrl(res.data.previewUrl);
      setStep(2);
    } catch (err) {
      setRequestError(err.response?.data?.message || t('family.unableSendOtp'));
    } finally {
      setLoading(false);
    }
  };

  const verifyOtp = async (e) => {
    e.preventDefault();
    if (otp.length !== 6) {
      setOtpError(t('family.otpLength'));
      return;
    }
    setLoading(true);
    setOtpError('');
    try {
      const res = await axios.post('http://localhost:5000/api/auth/family/verify-otp', {
        email: submittedEmail,
        candidateId: submittedCandidateId,
        otp: otp.trim()
      });
      setStep(3);
      setPortalData(res.data.portalData);
      setFamilyToken(res.data.token);
    } catch (err) {
      setOtp('');
      const serverMessage = err.response?.data?.message;
      setOtpError(serverMessage === 'Incorrect OTP. Please check the latest email and try again.'
        ? t('family.incorrectLatestOtp')
        : serverMessage || t('family.invalidOtp'));
    } finally {
      setLoading(false);
    }
  };

  const handleOtpChange = event => {
    setOtp(event.target.value.replace(/\D/g, '').slice(0, 6));
  };

  const handleOtpPaste = event => {
    event.preventDefault();
    setOtp(event.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6));
  };

  const fetchBrowseProfiles = async (filters = browseFilters) => {
    if (!familyToken) return;
    setBrowseLoading(true);
    try {
      const params = Object.fromEntries(Object.entries(filters).filter(([, value]) => value));
      const res = await axios.get('http://localhost:5000/api/interests/browse', { params, headers: { Authorization: `Bearer ${familyToken}` } });
      setBrowseProfiles(res.data);
    } catch (err) {
      toast.error(err.response?.data?.message || t('family.unableBrowse'));
    } finally { setBrowseLoading(false); }
  };

  const expressInterest = async targetCandidateId => {
    setInterestLoading(targetCandidateId);
    try {
      await axios.post('http://localhost:5000/api/interests', { targetCandidateId }, { headers: { Authorization: `Bearer ${familyToken}` } });
      toast.success(t('family.interestSent'));
    } catch (err) { toast.error(err.response?.data?.message || t('family.unableInterest')); }
    finally { setInterestLoading(null); }
  };

  const stageInfo = STAGE_CONFIG[portalData?.status] || STAGE_CONFIG['Interested'];

  return (
    <div className="min-h-screen flex">
      {/* Left branding strip */}
      <div className="hidden lg:flex w-80 bg-charcoal flex-col p-10 relative overflow-hidden flex-shrink-0">
        <div className="absolute top-0 right-0 w-56 h-56 bg-primary/20 rounded-full -translate-y-1/2 translate-x-1/2"></div>
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-secondary/20 rounded-full translate-y-1/2 -translate-x-1/2"></div>

        <div className="relative z-10 flex items-center space-x-2 mb-12">
          <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center text-white font-bold font-heading text-sm shadow">BB</div>
          <h1 className="text-xl font-bold font-heading text-white">Broker-Bond</h1>
        </div>
        <div className="relative z-10 flex-1">
          <div className="w-14 h-14 rounded-2xl bg-primary/20 flex items-center justify-center mb-6">
          </div>
          <h2 className="text-2xl font-bold font-heading text-white leading-snug mb-3">{t('family.portalTitle')}</h2>
          <p className="text-white/50 text-sm leading-relaxed">{t('family.portalDescription')}</p>
        </div>

        <div className="relative z-10 space-y-3">
            {[
            { icon: ShieldCheck, text: t('family.privacy') },
            { icon: Users, text: t('family.locked') },
            { icon: LayoutDashboard, text: t('family.realtime') },
          ].map(({ icon: Icon, text }) => (
            <div key={text} className="flex items-center gap-3">
              <Icon size={16} className="text-secondary flex-shrink-0" />
              <span className="text-white/60 text-sm">{text}</span>
            </div>
          ))}
        </div>

        <div className="relative z-10 mt-8 pt-6 border-t border-white/10 text-center">
          <Link to="/login" className="text-xs text-white/30 hover:text-white/60 transition-colors">{t('family.brokerQuestion')}</Link>
        </div>
      </div>

      {/* Right content */}
      <div className="flex-1 bg-cream flex items-center justify-center p-8">
        <div className={`w-full ${step === 3 ? 'max-w-6xl' : 'max-w-md'}`}>
          <div className="flex justify-end mb-6"><LanguageSwitcher /></div>

          {/* Step 1: Enter email + candidate ID */}
          {step === 1 && (
            <div>
              <div className="mb-8">
                <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center mb-4">
                  <Heart size={22} className="text-primary" />
                </div>
                <h2 className="text-2xl font-bold font-heading text-charcoal">{t('family.access')}</h2>
                <p className="text-gray-500 text-sm mt-1">{t('family.accessDescription')}</p>
              </div>
              <form onSubmit={requestOtp} className="space-y-5">
                <div>
                  <label className="block text-sm font-semibold text-charcoal mb-2">{t('family.yourEmail')}</label>
                  <input type="email" value={email} onChange={e => setEmail(e.target.value)} className="input-field" placeholder="family@example.com" required />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-charcoal mb-2">{t('family.candidateId')}</label>
                  <input type="text" value={candidateId} onChange={e => setCandidateId(e.target.value)} className="input-field" placeholder={t('family.candidateIdHint')} required />
                </div>
                {requestError && <p role="alert" className="text-sm text-red-600 font-medium">{requestError}</p>}
                <button type="submit" disabled={loading} className="btn-primary w-full">{loading ? t('family.sending') : t('family.sendOtp')}</button>
              </form>
            </div>
          )}

          {/* Step 2: Verify OTP */}
          {step === 2 && (
            <div>
              <div className="mb-8">
                <div className="w-12 h-12 rounded-2xl bg-secondary/10 flex items-center justify-center mb-4">
                  <ShieldCheck size={22} className="text-secondary" />
                </div>
                <h2 className="text-2xl font-bold font-heading text-charcoal">{t('family.verify')}</h2>
                <p className="text-gray-500 text-sm mt-1">{t('family.otpSent')} <strong className="text-charcoal">{email}</strong>.</p>
              </div>
              {previewUrl && (
                <div className="mb-5 p-3 bg-secondary/5 border border-secondary/20 rounded-xl">
                  <p className="text-xs text-secondary font-semibold">{t('family.testMode')} <a href={previewUrl} target="_blank" rel="noreferrer" className="underline">{t('family.viewEmail')}</a></p>
                </div>
              )}
              <form onSubmit={verifyOtp} className="space-y-5">
                <div>
                  <label className="block text-sm font-semibold text-charcoal mb-2">{t('family.enterOtp')}</label>
                  <input type="text" value={otp} onChange={handleOtpChange} onPaste={handleOtpPaste} className="input-field text-center text-xl tracking-[0.5em] font-bold" placeholder="• • • • • •" maxLength={6} inputMode="numeric" autoComplete="one-time-code" pattern="[0-9]{6}" required />
                </div>
                {otpError && <p role="alert" className="text-sm text-red-600 font-medium">{otpError}</p>}
                <button type="submit" disabled={loading} className="btn-secondary w-full">{loading ? t('family.verifying') : t('family.verifyAccess')}</button>
              </form>
              <button onClick={() => setStep(1)} className="mt-4 text-sm text-gray-400 hover:text-charcoal w-full text-center transition-colors">{t('family.changeEmail')}</button>
            </div>
          )}

          {/* Step 3: Portal view */}
          {step === 3 && portalData && (
            <div className="space-y-6">
              <div>
                <h2 className="text-2xl font-bold font-heading text-charcoal">{t('family.hello')}</h2>
                <div className="mt-1 flex flex-wrap items-center gap-2"><p className="text-gray-500 text-sm">{t('family.statusFor')} <span className="font-semibold text-charcoal">{portalData.candidateName}</span></p><CandidateTrust candidate={portalData} showFreshness /></div>
              </div>

              <div className="flex border-b border-gray-200 gap-6">
                <button type="button" onClick={() => setPortalTab('status')} className={`pb-3 text-sm font-semibold ${portalTab === 'status' ? 'text-primary border-b-2 border-primary' : 'text-gray-400'}`}>{t('family.myStatus')}</button>
                <button type="button" onClick={() => { setPortalTab('browse'); fetchBrowseProfiles(); }} className={`pb-3 text-sm font-semibold ${portalTab === 'browse' ? 'text-primary border-b-2 border-primary' : 'text-gray-400'}`}>{t('family.browseProfiles')}</button>
              </div>

              {portalTab === 'browse' && <div className="space-y-5">
                <div className="card">
                  <div className="flex items-center gap-2 mb-3"><Search size={16} className="text-primary" /><h3 className="font-bold font-heading">{t('family.browseProfiles')}</h3></div>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                    <input aria-label={t('family.minAge')} className="input-field text-sm" placeholder={t('family.minAge')} value={browseFilters.ageMin} onChange={e => setBrowseFilters({ ...browseFilters, ageMin: e.target.value })} />
                    <input aria-label={t('family.maxAge')} className="input-field text-sm" placeholder={t('family.maxAge')} value={browseFilters.ageMax} onChange={e => setBrowseFilters({ ...browseFilters, ageMax: e.target.value })} />
                    <input aria-label={t('candidates.city')} className="input-field text-sm" placeholder={t('candidates.city')} value={browseFilters.city} onChange={e => setBrowseFilters({ ...browseFilters, city: e.target.value })} />
                  </div>
                  <button type="button" onClick={() => setShowMoreFilters(value => !value)} className="mt-3 text-sm font-semibold text-secondary hover:text-secondary/80 transition-colors">
                    {showMoreFilters ? t('family.hideMoreFilters') : t('family.moreFilters')}
                  </button>
                  {showMoreFilters && <div className="grid grid-cols-2 md:grid-cols-3 gap-2 mt-3">
                    <input aria-label={t('candidates.education')} className="input-field text-sm" placeholder={t('candidates.education')} value={browseFilters.education} onChange={e => setBrowseFilters({ ...browseFilters, education: e.target.value })} />
                    <input aria-label={t('family.incomeRange')} className="input-field text-sm" placeholder={t('family.incomeRange')} value={browseFilters.income} onChange={e => setBrowseFilters({ ...browseFilters, income: e.target.value })} />
                    <select aria-label={t('candidates.allDenominations')} className="input-field text-sm" value={browseFilters.denomination} onChange={e => setBrowseFilters({ ...browseFilters, denomination: e.target.value })}><option value="">{t('family.denomination')}</option><option>Catholic</option><option>Protestant</option><option>Pentecostal</option><option>CSI</option><option>CNI</option><option>Baptist</option><option>Methodist</option><option>Orthodox</option><option>Mar Thoma</option><option>Evangelical</option><option>Other</option></select>
                    <select aria-label={t('candidates.allAttendance')} className="input-field text-sm" value={browseFilters.churchAttendance} onChange={e => setBrowseFilters({ ...browseFilters, churchAttendance: e.target.value })}><option value="">{t('candidates.churchAttendance')}</option><option value="Weekly">{t('family.weekly')}</option><option value="Several times a month">{t('family.severalTimesMonth')}</option><option value="Occasionally">{t('family.occasionally')}</option><option value="Rarely">{t('family.rarely')}</option></select>
                    <select aria-label={t('candidates.allFaith')} className="input-field text-sm" value={browseFilters.faithImportance} onChange={e => setBrowseFilters({ ...browseFilters, faithImportance: e.target.value })}><option value="">{t('candidates.faithImportance')}</option><option value="Essential">{t('family.essential')}</option><option value="Very Important">{t('family.veryImportant')}</option><option value="Important">{t('family.important')}</option><option value="Flexible">{t('family.flexible')}</option></select>
                    <label className="col-span-2 flex items-center gap-2 text-sm font-semibold text-charcoal md:col-span-3"><input type="checkbox" checked={browseFilters.recentlyUpdated} onChange={e => setBrowseFilters({ ...browseFilters, recentlyUpdated: e.target.checked })} />{t('family.recentlyUpdated')}</label>
                  </div>}
                  <button type="button" onClick={() => fetchBrowseProfiles()} className="btn-primary w-full mt-3">{t('family.applyFilters')}</button>
                </div>
                {browseLoading ? <PageLoader rows={3} /> : browseProfiles.length === 0 ? <p className="text-center text-sm text-gray-400 py-8">{t('family.noProfiles')}</p> : <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">{browseProfiles.map(profile => {
                  const compatibilityScore = profile.compatibilityScore ?? profile.score;
                  const compatibilityTags = (profile.compatibilityFactors || profile.factors || []).slice(0, 2);
                  return <div key={profile._id} className="card relative flex h-full flex-col gap-4 border-gray-200 p-5 shadow-md transition-shadow hover:shadow-lg">
                    {compatibilityScore !== undefined && compatibilityScore !== null && <span className="absolute right-4 top-4 rounded-full bg-accent/10 px-2.5 py-1 text-xs font-bold text-accent">{t('family.matchScore', { score: compatibilityScore })}</span>}
                    <div className="relative flex h-40 items-center justify-center overflow-hidden rounded-xl bg-gray-100">
                      <div className="blur-sm"><GenderAvatar gender={profile.gender} size="photo" /></div>
                      <div className="absolute inset-0 flex items-center justify-center bg-white/10 text-lg font-bold text-white drop-shadow">?</div>
                    </div>
                    <div className="flex-1 text-center">
                      <div className="flex flex-wrap items-center justify-center gap-2"><p className="font-bold text-charcoal">••••• •.</p><CandidateTrust candidate={profile} /></div>
                      <p className="mt-1 text-sm text-gray-500">{profile.age} {t('family.years')} • {profile.city}</p>
                      <p className="text-sm text-gray-500">{profile.education}</p>
                      <CandidateTrust candidate={profile} showFreshness showBadges={false} centered />
                      {profile.denomination && profile.religion === 'Christian' && <p className="mt-2 text-xs font-semibold text-secondary">{profile.denomination}</p>}
                      {compatibilityTags.length > 0 && <div className="mt-3 flex flex-wrap justify-center gap-1.5">{compatibilityTags.map((tag, index) => <span key={`${tag}-${index}`} className="rounded-full bg-secondary/10 px-2 py-1 text-[11px] font-semibold text-secondary">{translateCompatibilityTag(tag)}</span>)}</div>}
                    </div>
                    <p className="text-center text-xs text-gray-400">{t('family.contactHidden')}</p>
                    <button type="button" onClick={() => expressInterest(profile._id)} disabled={Boolean(interestLoading)} className="btn-secondary mt-auto flex w-full items-center justify-center gap-1 text-sm disabled:opacity-60"><Send size={13} />{interestLoading === profile._id ? t('family.sending') : t('family.expressInterest')}</button>
                  </div>;
                })}</div>}
              </div>}

              {/* Stage card */}
              {portalTab === 'status' && <><div className={`p-5 rounded-2xl ${stageInfo.color} text-white shadow-lg`}>
                <p className="text-xs font-semibold uppercase tracking-widest opacity-80">{t('family.currentStage')}</p>
                <p className="text-2xl font-bold font-heading mt-1">{t(stageInfo.label)}</p>
                <div className="mt-3 flex gap-1">
                  {[1,2,3,4].map(n => (
                    <div key={n} className={`h-1.5 flex-1 rounded-full ${n <= stageInfo.step ? 'bg-white' : 'bg-white/30'}`}></div>
                  ))}
                </div>
              </div>

              {/* Matches */}
              <div className="card">
                <h3 className="font-bold font-heading mb-4">{t('family.prospectiveMatches')}</h3>
                {portalData.matches.map((m, i) => (
                    <div key={i} className="flex items-center gap-4 p-3 bg-gray-50 rounded-xl">
                    <div className={`w-11 h-11 rounded-xl bg-gray-100 flex items-center justify-center flex-shrink-0 overflow-hidden ${m.unlocked ? '' : 'blur-sm'}`}>
                      <GenderAvatar gender={m.gender} size="lg" />
                    </div>
                    <div className="flex-1">
                      <p className="font-semibold text-charcoal">{m.unlocked ? m.name : '••••• •.'}</p>
                      <p className="text-sm text-gray-500">{m.age} {t('family.years')} • {m.unlocked ? m.city : '•••••••'}</p>
                    </div>
                    <span className="text-xs bg-gray-200 text-gray-500 px-3 py-1 rounded-full font-semibold">{t('family.pendingApproval')}</span>
                  </div>
                ))}
              </div></>}

              {portalData.matches.some(match => match.unlocked) && <div className="card">
                <h3 className="font-bold font-heading mb-3">{t('family.approvedContact')}</h3>
                <div className="space-y-2 text-sm">
                  {portalData.matches.filter(match => match.unlocked).map((match, index) => <div key={index} className="grid grid-cols-[auto_1fr] gap-x-3 gap-y-1"><span className="font-semibold text-charcoal">{match.name}</span><span className="text-gray-500">{match.city}</span><span className="text-gray-400">{t('family.phone')}</span><span className="text-gray-600">{match.phone}</span><span className="text-gray-400">{t('family.email')}</span><span className="text-gray-600">{match.email}</span></div>)}
                </div>
              </div>}

              <button onClick={() => setStep(1)} className="w-full py-2.5 border border-gray-200 rounded-xl text-gray-500 hover:bg-gray-100 transition-colors text-sm font-medium">{t('common.signOut')}</button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default FamilyPortal;
