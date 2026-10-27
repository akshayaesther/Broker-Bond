import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Plus, Edit, Trash2, Zap, MessageCircle, Search, Users, Copy } from 'lucide-react';
import toast from 'react-hot-toast';
import GenderAvatar from '../components/GenderAvatar';
import PageLoader from '../components/PageLoader';
import CandidateTrust from '../components/CandidateTrust';
import { isRecentlyUpdated } from '../utils/candidateFreshness';
import { useTranslation } from 'react-i18next';

const emptyCandidateForm = () => ({
  name: '', age: '', gender: 'Male', city: '', education: '', incomeRange: '', religion: '', denomination: '', faithProfile: {}, partnerPreferences: {}, lifestyle: {}, familyEmail: '', pastorReferenceContact: '', pastorVerified: false, brokerVerified: false, brokerVerificationNote: '', isOpenToReferral: false, privacyMasking: { phone: true, email: true, exactLocation: true }
});

const CandidateList = () => {
  const { t } = useTranslation();
  const optionLabel = option => t(`candidates.options.${option}`, { defaultValue: option });
  const translateExplanation = explanation => explanation
    .replace(/faith alignment|denomination alignment|marriage expectations|family values|lifestyle fit|same location|similar education|similar career expectations/g, reason => t(`candidates.compatibilityReasons.${reason}`, { defaultValue: reason }))
    .replace('The available profile details show a developing fit', t('candidates.explanationDeveloping'))
    .replace('Notable differences:', t('candidates.explanationDifferences'))
    .replace('align well', t('candidates.explanationAlign'));
  const [candidates, setCandidates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isMatchModalOpen, setIsMatchModalOpen] = useState(false);
  const [currentCandidate, setCurrentCandidate] = useState(null);
  const [matches, setMatches] = useState([]);
  const [addingMatchId, setAddingMatchId] = useState(null);
  const [candidateToDelete, setCandidateToDelete] = useState(null);
  const [copiedCandidateId, setCopiedCandidateId] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState({ age: '', city: '', education: '', income: '', denomination: '', churchAttendance: '', faithImportance: '', childrenPreference: '', relocationPreference: '', familyInvolvement: '', dietaryPreference: '', smoking: '', drinking: '', recentlyUpdated: false });
  const [showMoreFilters, setShowMoreFilters] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;

  const [formData, setFormData] = useState(emptyCandidateForm);

  const fetchCandidates = async () => {
    try {
      const res = await axios.get('http://localhost:5000/api/candidates');
      setCandidates(res.data);
    } catch (err) { console.error(err); } finally { setLoading(false); }
  };

  useEffect(() => { fetchCandidates(); }, []);

  const handleSave = async (e) => {
    e.preventDefault();
    try {
      if (currentCandidate) {
        await axios.put(`http://localhost:5000/api/candidates/${currentCandidate._id}`, formData);
        toast.success(t('candidates.candidateUpdated'));
      } else {
        await axios.post('http://localhost:5000/api/candidates', formData);
        toast.success(t('candidates.candidateAdded'));
      }
      setIsModalOpen(false);
      fetchCandidates();
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.message || t('candidates.unableSave'));
    }
  };

  const handleDelete = async () => {
    try {
      await axios.delete(`http://localhost:5000/api/candidates/${candidateToDelete._id}`);
      setCandidateToDelete(null);
      toast.success(t('candidates.candidateDeleted'));
      fetchCandidates();
    } catch (err) {
      console.error(err);
      toast.error(t('candidates.unableDelete'));
    }
  };

  const handleScoreMatches = async (candidate) => {
    setCurrentCandidate(candidate);
    try {
      const res = await axios.get(`http://localhost:5000/api/candidates/${candidate._id}/matches/auto-score`);
      setMatches(res.data);
      setIsMatchModalOpen(true);
    } catch (err) {
      console.error(err);
      toast.error(t('candidates.unableMatches'));
    }
  };

  const handleAddToPipeline = async (matchCandidate) => {
    if (!currentCandidate || addingMatchId) return;
    setAddingMatchId(matchCandidate._id);
    try {
      await axios.post('http://localhost:5000/api/pipeline', {
        candidate1: currentCandidate._id,
        candidate2: matchCandidate._id
      });
      toast.success(t('candidates.matchAdded'));
      setIsMatchModalOpen(false);
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.message || t('candidates.unableAddMatch'));
    } finally {
      setAddingMatchId(null);
    }
  };

  const generateWhatsAppLink = (matchCand) => {
    const text = `Hi, I have a matrimony profile that matches your preferences. Details: ${matchCand.name}, Age ${matchCand.age}, City ${matchCand.city}. Let me know if you are interested.`;
    return `https://wa.me/?text=${encodeURIComponent(text)}`;
  };

  const openAdd = () => {
    setCurrentCandidate(null);
    setFormData(emptyCandidateForm());
    setIsModalOpen(true);
  };

  const setNestedField = (section, key, value) => setFormData(current => ({ ...current, [section]: { ...current[section], [key]: value } }));

  const copyCandidateId = async (candidateId) => {
    try {
      await navigator.clipboard.writeText(candidateId);
      setCopiedCandidateId(candidateId);
      toast.success(t('candidates.candidateIdCopied'));
      setTimeout(() => setCopiedCandidateId(null), 2000);
    } catch (err) {
      console.error(err);
      toast.error(t('candidates.unableCopy'));
    }
  };

  const filteredCandidates = candidates.filter(candidate => {
    const searchableText = [candidate.name, candidate.city, candidate.education]
      .filter(Boolean)
      .join(' ')
      .toLowerCase();
    const ageMatches = !filters.age || (
      filters.age === 'under-25' ? candidate.age < 25 :
      filters.age === '25-34' ? candidate.age >= 25 && candidate.age <= 34 :
      filters.age === '35-44' ? candidate.age >= 35 && candidate.age <= 44 :
      candidate.age >= 45
    );
    const christianMatches = (!filters.denomination || candidate.denomination === filters.denomination)
      && (!filters.churchAttendance || candidate.faithProfile?.churchAttendance === filters.churchAttendance)
      && (!filters.faithImportance || candidate.faithProfile?.faithImportance === filters.faithImportance);
    const marriageMatches = (!filters.childrenPreference || candidate.partnerPreferences?.childrenPreference === filters.childrenPreference)
      && (!filters.relocationPreference || candidate.partnerPreferences?.relocationPreference === filters.relocationPreference)
      && (!filters.familyInvolvement || candidate.partnerPreferences?.familyInvolvement === filters.familyInvolvement);
    const lifestyleMatches = (!filters.dietaryPreference || candidate.lifestyle?.dietaryPreference === filters.dietaryPreference)
      && (!filters.smoking || candidate.lifestyle?.smoking === filters.smoking)
      && (!filters.drinking || candidate.lifestyle?.drinking === filters.drinking);
    return searchableText.includes(searchTerm.trim().toLowerCase())
      && ageMatches
      && (!filters.city || candidate.city === filters.city)
      && (!filters.education || candidate.education === filters.education)
      && (!filters.income || candidate.incomeRange === filters.income)
      && christianMatches && marriageMatches && lifestyleMatches
      && (!filters.recentlyUpdated || isRecentlyUpdated(candidate.lastUpdated || candidate.updatedAt || candidate.createdAt));
  });
  const filterOptions = (key, nestedKey) => [...new Set(candidates.map(candidate => nestedKey ? candidate[key]?.[nestedKey] : candidate[key]).filter(Boolean))];
  const setFilter = key => event => setFilters(current => ({ ...current, [key]: event.target.value }));
  const totalPages = Math.ceil(filteredCandidates.length / pageSize);
  const paginatedCandidates = filteredCandidates.slice((currentPage - 1) * pageSize, currentPage * pageSize);
  useEffect(() => { setCurrentPage(1); }, [searchTerm, filters]);
  useEffect(() => {
    if (totalPages > 0 && currentPage > totalPages) setCurrentPage(totalPages);
  }, [currentPage, totalPages]);

  return (
    <div>
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-8">
        <div>
          <h2 className="text-2xl font-bold font-heading text-charcoal">{t('candidates.title')}</h2>
          <p className="text-gray-500 text-sm mt-1">{candidates.length} {t('candidates.roster')}</p>
        </div>
        <button onClick={openAdd} className="btn-primary flex items-center gap-2">
          <Plus size={18} /> {t('candidates.add')}
        </button>
      </div>

      {/* Table Card */}
      <div className="card p-0 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100 bg-gray-50/50 flex items-center gap-3">
          <Search size={16} className="text-gray-400" />
          <label htmlFor="candidate-search" className="sr-only">{t('candidates.searchLabel')}</label>
          <input
            id="candidate-search"
            type="search"
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            placeholder={t('candidates.searchPlaceholder')}
            className="flex-1 bg-transparent text-sm text-charcoal placeholder:text-gray-400 focus:outline-none"
          />
          {searchTerm && <span className="text-xs text-gray-400">{filteredCandidates.length} {t('candidates.found')}</span>}
        </div>
        <div className="px-6 py-4 border-b border-gray-100 space-y-3">
          <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
            <select aria-label={t('candidates.filterByAge')} value={filters.age} onChange={setFilter('age')} className="input-field text-sm">
              <option value="">{t('candidates.allAges')}</option><option value="under-25">{t('candidates.under25')}</option><option value="25-34">25–34</option><option value="35-44">35–44</option><option value="45-plus">45+</option>
            </select>
            <select aria-label={t('candidates.filterByCity')} value={filters.city} onChange={setFilter('city')} className="input-field text-sm">
              <option value="">{t('candidates.allCities')}</option>{filterOptions('city').map(option => <option key={option}>{option}</option>)}
            </select>
            <label className="flex items-center gap-2 text-sm font-semibold text-charcoal"><input type="checkbox" checked={filters.recentlyUpdated} onChange={e => setFilters(current => ({ ...current, recentlyUpdated: e.target.checked }))} />{t('candidates.recentlyUpdated')}</label>
          </div>
          <button type="button" onClick={() => setShowMoreFilters(value => !value)} className="text-sm font-semibold text-secondary hover:text-secondary/80 transition-colors">
            {showMoreFilters ? t('candidates.hideMore') : t('candidates.more')}
          </button>
          <div className={`overflow-hidden transition-all duration-200 ${showMoreFilters ? 'max-h-[48rem] opacity-100' : 'max-h-0 opacity-0'}`} aria-hidden={!showMoreFilters}>
            <div className="space-y-4 pt-1">
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-2">{t('candidates.educationIncome')}</p>
                <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
                  <select aria-label={t('candidates.filterByEducation')} value={filters.education} onChange={setFilter('education')} className="input-field text-sm">
                    <option value="">{t('candidates.allEducation')}</option>{filterOptions('education').map(option => <option key={option}>{option}</option>)}
                  </select>
                  <select aria-label={t('candidates.filterByIncome')} value={filters.income} onChange={setFilter('income')} className="input-field text-sm">
                    <option value="">{t('candidates.allIncome')}</option>{filterOptions('incomeRange').map(option => <option key={option}>{option}</option>)}
                  </select>
                </div>
              </div>
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-2">{t('candidates.christian')}</p>
                <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
                  <select aria-label={t('candidates.filterByDenomination')} value={filters.denomination} onChange={setFilter('denomination')} className="input-field text-sm"><option value="">{t('candidates.allDenominations')}</option>{filterOptions('denomination').map(option => <option key={option}>{option}</option>)}</select>
                  <select aria-label={t('candidates.filterByAttendance')} value={filters.churchAttendance} onChange={setFilter('churchAttendance')} className="input-field text-sm"><option value="">{t('candidates.allAttendance')}</option>{filterOptions('faithProfile', 'churchAttendance').map(option => <option key={option}>{option}</option>)}</select>
                  <select aria-label={t('candidates.filterByFaith')} value={filters.faithImportance} onChange={setFilter('faithImportance')} className="input-field text-sm"><option value="">{t('candidates.allFaith')}</option>{filterOptions('faithProfile', 'faithImportance').map(option => <option key={option}>{option}</option>)}</select>
                </div>
              </div>
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-2">{t('candidates.marriage')}</p>
                <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
                  <select aria-label={t('candidates.filterByChildren')} value={filters.childrenPreference} onChange={setFilter('childrenPreference')} className="input-field text-sm"><option value="">{t('candidates.allChildren')}</option>{filterOptions('partnerPreferences', 'childrenPreference').map(option => <option key={option}>{option}</option>)}</select>
                  <select aria-label={t('candidates.filterByRelocation')} value={filters.relocationPreference} onChange={setFilter('relocationPreference')} className="input-field text-sm"><option value="">{t('candidates.allRelocation')}</option>{filterOptions('partnerPreferences', 'relocationPreference').map(option => <option key={option}>{option}</option>)}</select>
                  <select aria-label={t('candidates.filterByFamily')} value={filters.familyInvolvement} onChange={setFilter('familyInvolvement')} className="input-field text-sm"><option value="">{t('candidates.allFamily')}</option>{filterOptions('partnerPreferences', 'familyInvolvement').map(option => <option key={option}>{option}</option>)}</select>
                </div>
              </div>
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-2">{t('candidates.lifestyle')}</p>
                <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
                  <select aria-label={t('candidates.filterByDietary')} value={filters.dietaryPreference} onChange={setFilter('dietaryPreference')} className="input-field text-sm"><option value="">{t('candidates.allDietary')}</option>{filterOptions('lifestyle', 'dietaryPreference').map(option => <option key={option}>{option}</option>)}</select>
                  <select aria-label={t('candidates.filterBySmoking')} value={filters.smoking} onChange={setFilter('smoking')} className="input-field text-sm"><option value="">{t('candidates.allSmoking')}</option>{filterOptions('lifestyle', 'smoking').map(option => <option key={option}>{option}</option>)}</select>
                  <select aria-label={t('candidates.filterByDrinking')} value={filters.drinking} onChange={setFilter('drinking')} className="input-field text-sm"><option value="">{t('candidates.allDrinking')}</option>{filterOptions('lifestyle', 'drinking').map(option => <option key={option}>{option}</option>)}</select>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-gray-100">
                <th className="py-3 px-6 text-xs font-semibold text-gray-400 uppercase tracking-wider">{t('candidates.candidate')}</th>
                <th className="py-3 px-6 text-xs font-semibold text-gray-400 uppercase tracking-wider">{t('candidates.candidateId')}</th>
                <th className="py-3 px-6 text-xs font-semibold text-gray-400 uppercase tracking-wider">{t('candidates.details')}</th>
                <th className="py-3 px-6 text-xs font-semibold text-gray-400 uppercase tracking-wider">{t('candidates.city')}</th>
                <th className="py-3 px-6 text-xs font-semibold text-gray-400 uppercase tracking-wider">{t('candidates.referral')}</th>
                <th className="py-3 px-6 text-xs font-semibold text-gray-400 uppercase tracking-wider">{t('candidates.actions')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {loading ? (
                <tr><td colSpan={6} className="p-6"><PageLoader rows={4} /></td></tr>
              ) : filteredCandidates.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-16 text-center">
                    <div className="flex flex-col items-center">
                      <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center mb-3">
                        <Users size={24} className="text-primary" />
                      </div>
                      <p className="font-semibold text-charcoal">{candidates.length ? t('candidates.noMatching') : t('candidates.noCandidates')}</p>
                      <p className="text-gray-400 text-sm mt-1">{candidates.length ? t('candidates.tryDifferent') : t('candidates.clickAdd')}</p>
                    </div>
                  </td>
                </tr>
              ) : paginatedCandidates.map(cand => {
                return (
                  <tr key={cand._id} className="hover:bg-gray-50/70 transition-colors">
                    <td className="py-4 px-6">
                      <div className="flex items-center gap-3">
                        <GenderAvatar name={cand.name} gender={cand.gender} />
                        <div>
                          <div className="flex flex-wrap items-center gap-2"><p className="font-semibold text-charcoal">{cand.name}</p><CandidateTrust candidate={cand} /></div>
                          <p className="text-xs text-gray-400">{cand.gender}</p>
                          <CandidateTrust candidate={cand} showFreshness showBadges={false} />
                        </div>
                      </div>
                    </td>
                    <td className="py-4 px-6">
                      <div className="flex items-center gap-2">
                        <code className="text-xs text-gray-500 max-w-[9rem] truncate" title={cand._id}>{cand._id}</code>
                        <button type="button" onClick={() => copyCandidateId(cand._id)} className="p-1.5 rounded-lg text-secondary hover:bg-secondary/10 transition-colors" title={t('candidates.copyId')} aria-label={`${t('candidates.copyIdFor')} ${cand.name}`}>
                          <Copy size={14} />
                        </button>
                        {copiedCandidateId === cand._id && <span className="text-xs text-secondary font-semibold">{t('candidates.copied')}</span>}
                      </div>
                    </td>
                    <td className="py-4 px-6">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="px-2.5 py-1 bg-charcoal/5 text-charcoal rounded-full text-xs font-medium">{cand.age} {t('candidates.years')}</span>
                        <span className="px-2.5 py-1 bg-secondary/10 text-secondary rounded-full text-xs font-medium">{cand.education}</span>
                        {cand.incomeRange && <span className="px-2.5 py-1 bg-accent/10 text-accent rounded-full text-xs font-medium">{cand.incomeRange}</span>}
                        {cand.religion === 'Christian' && cand.denomination && <span className="px-2.5 py-1 bg-secondary/10 text-secondary rounded-full text-xs font-medium">{cand.denomination}</span>}
                        {cand.religion === 'Christian' && cand.faithProfile?.faithImportance && <span className="px-2.5 py-1 bg-accent/10 text-accent rounded-full text-xs font-medium">{t('candidates.faithLabel')} {optionLabel(cand.faithProfile.faithImportance)}</span>}
                      </div>
                    </td>
                    <td className="py-4 px-6">
                      <span className="text-sm text-gray-600 font-medium">{cand.city}</span>
                    </td>
                    <td className="py-4 px-6">
                      {cand.isOpenToReferral
                        ? <span className="px-3 py-1 bg-secondary/10 text-secondary rounded-full text-xs font-bold">{t('candidates.open')}</span>
                        : <span className="px-3 py-1 bg-gray-100 text-gray-500 rounded-full text-xs font-bold">{t('candidates.closed')}</span>}
                    </td>
                    <td className="py-4 px-6">
                      <div className="flex items-center gap-1">
                        <button onClick={() => handleScoreMatches(cand)} className="p-2 rounded-lg text-accent hover:bg-accent/10 transition-colors" title={t('candidates.findMatches')}>
                          <Zap size={16} />
                        </button>
                        <button onClick={() => { setCurrentCandidate(cand); setFormData(cand); setIsModalOpen(true); }} className="p-2 rounded-lg text-secondary hover:bg-secondary/10 transition-colors">
                          <Edit size={16} />
                        </button>
                        <button onClick={() => setCandidateToDelete(cand)} className="p-2 rounded-lg text-red-400 hover:bg-red-50 transition-colors" title={`${t('candidates.deleteTitle')} ${cand.name}`}>
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        {totalPages > 1 && (
          <div className="flex flex-wrap items-center justify-between gap-3 px-6 py-4 border-t border-gray-100">
            <p className="text-sm text-gray-500">
                {t('candidates.showing')} {(currentPage - 1) * pageSize + 1}–{Math.min(currentPage * pageSize, filteredCandidates.length)} {t('candidates.of')} {filteredCandidates.length}
            </p>
            <div className="flex items-center gap-1" aria-label={t('candidates.candidatePages')}>
              <button type="button" disabled={currentPage === 1} onClick={() => setCurrentPage(page => page - 1)} className="px-3 py-1.5 rounded-lg text-sm font-semibold text-gray-600 hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors">
                {t('candidates.previous')}
              </button>
              {Array.from({ length: totalPages }, (_, index) => index + 1).map(page => (
                <button type="button" key={page} aria-current={page === currentPage ? 'page' : undefined} onClick={() => setCurrentPage(page)} className={`w-8 h-8 rounded-lg text-sm font-semibold transition-colors ${page === currentPage ? 'bg-primary text-white' : 'text-gray-600 hover:bg-primary/10 hover:text-primary'}`}>
                  {page}
                </button>
              ))}
              <button type="button" disabled={currentPage === totalPages} onClick={() => setCurrentPage(page => page + 1)} className="px-3 py-1.5 rounded-lg text-sm font-semibold text-gray-600 hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors">
                {t('candidates.next')}
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Add / Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-charcoal/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto shadow-2xl">
            <div className="p-6 border-b border-gray-100">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
                  {currentCandidate ? <Edit size={16} className="text-white" /> : <Plus size={16} className="text-white" />}
                </div>
                <h3 className="text-xl font-bold font-heading">{currentCandidate ? t('candidates.editCandidate') : t('candidates.addCandidateTitle')}</h3>
              </div>
            </div>
            <form onSubmit={handleSave} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold mb-1.5">{t('candidates.name')}</label>
                  <input type="text" className="input-field" value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} required />
                </div>
                <div>
                  <label className="block text-sm font-semibold mb-1.5">{t('candidates.age')}</label>
                  <input type="number" className="input-field" value={formData.age} onChange={e => setFormData({ ...formData, age: e.target.value })} required />
                </div>
                <div>
                  <label className="block text-sm font-semibold mb-1.5">{t('candidates.gender')}</label>
                  <select className="input-field" value={formData.gender} onChange={e => setFormData({ ...formData, gender: e.target.value })}>
                    <option value="Male">{t('candidates.male')}</option><option value="Female">{t('candidates.female')}</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-semibold mb-1.5">{t('candidates.city')}</label>
                  <input type="text" className="input-field" value={formData.city} onChange={e => setFormData({ ...formData, city: e.target.value })} required />
                </div>
                <div>
                  <label className="block text-sm font-semibold mb-1.5">{t('candidates.education')}</label>
                  <input type="text" className="input-field" value={formData.education} onChange={e => setFormData({ ...formData, education: e.target.value })} required />
                </div>
                <div>
                  <label className="block text-sm font-semibold mb-1.5">{t('candidates.incomeRange')}</label>
                  <input type="text" className="input-field" value={formData.incomeRange} onChange={e => setFormData({ ...formData, incomeRange: e.target.value })} placeholder={t('candidates.incomePlaceholder')} />
                </div>
                <div>
                  <label className="block text-sm font-semibold mb-1.5">{t('candidates.religion')}</label>
                  <select className="input-field" value={formData.religion || ''} onChange={e => setFormData({ ...formData, religion: e.target.value, denomination: e.target.value === 'Christian' ? formData.denomination : '' })}>
                    <option value="">{t('candidates.notSpecified')}</option><option value="Christian">{t('candidates.christianReligion')}</option><option value="Hindu">{t('candidates.hinduReligion')}</option><option value="Muslim">{t('candidates.muslimReligion')}</option><option value="Sikh">{t('candidates.sikhReligion')}</option><option value="Jain">{t('candidates.jainReligion')}</option><option value="Other">{t('candidates.otherReligion')}</option>
                  </select>
                </div>
                {formData.religion === 'Christian' && <div>
                  <label className="block text-sm font-semibold mb-1.5">{t('candidates.denominationLabel')}</label>
                  <select className="input-field" value={formData.denomination || ''} onChange={e => setFormData({ ...formData, denomination: e.target.value })}>
                    <option value="">{t('candidates.notSpecified')}</option><option>Catholic</option><option>Protestant</option><option>Pentecostal</option><option>CSI</option><option>CNI</option><option>Baptist</option><option>Methodist</option><option>Orthodox</option><option>Mar Thoma</option><option>Evangelical</option><option>Other</option>
                  </select>
                </div>}
                <div className="col-span-2 border-t border-gray-100 pt-4">
                  <p className="text-sm font-bold text-charcoal mb-3">{t('candidates.trustSection')}</p>
                  <div className="grid grid-cols-1 gap-4">
                    <label className="text-sm font-semibold">{t('candidates.pastorReference')}<input className="input-field mt-1.5 font-normal" value={formData.pastorReferenceContact || ''} onChange={e => setFormData({ ...formData, pastorReferenceContact: e.target.value })} placeholder={t('candidates.pastorReferencePlaceholder')} /></label>
                    <label className="flex items-center gap-3 text-sm font-semibold"><input type="checkbox" checked={Boolean(formData.pastorVerified)} onChange={e => setFormData({ ...formData, pastorVerified: e.target.checked })} />{t('candidates.pastorVerified')}</label>
                    <label className="flex items-center gap-3 text-sm font-semibold"><input type="checkbox" checked={Boolean(formData.brokerVerified)} onChange={e => setFormData({ ...formData, brokerVerified: e.target.checked })} />{t('candidates.brokerVerified')}</label>
                    <label className="text-sm font-semibold">{t('candidates.verificationNote')} <span className="font-normal text-gray-400">({t('candidates.optional')})</span><input className="input-field mt-1.5 font-normal" value={formData.brokerVerificationNote || ''} onChange={e => setFormData({ ...formData, brokerVerificationNote: e.target.value })} placeholder={t('candidates.brokerNotePlaceholder')} /></label>
                  </div>
                </div>
                {formData.religion === 'Christian' && <div className="col-span-2 border-t border-gray-100 pt-4">
                  <p className="text-sm font-bold text-charcoal mb-3">{t('candidates.compatibilitySection')}</p>
                  <div className="grid grid-cols-2 gap-4">
                    {[
                      ['faithImportance', t('candidates.faithImportance'), ['Essential', 'Very Important', 'Important', 'Flexible']],
                      ['churchAttendance', t('candidates.churchAttendance'), ['Weekly', 'Several times a month', 'Occasionally', 'Rarely']],
                      ['prayerImportance', t('candidates.prayerImportance'), ['Very Important', 'Important', 'Flexible']],
                      ['bibleStudyImportance', t('candidates.bibleStudy'), ['Very Important', 'Important', 'Not a major factor']],
                      ['weddingType', t('candidates.weddingType'), ['Church wedding', 'Civil + church', 'Open to discussion']],
                      ['childrenFaithImportance', t('candidates.childrenFaith'), ['Essential', 'Very Important', 'Important', 'Flexible']]
                    ].map(([key, label, options]) => <label key={key} className="text-sm font-semibold">{label}<select className="input-field mt-1.5 font-normal" value={formData.faithProfile?.[key] || ''} onChange={e => setNestedField('faithProfile', key, e.target.value)}><option value="">{t('candidates.notSpecified')}</option>{options.map(option => <option key={option} value={option}>{optionLabel(option)}</option>)}</select></label>)}
                  </div>
                </div>}
                <div className="col-span-2 border-t border-gray-100 pt-4">
                  <p className="text-sm font-bold text-charcoal mb-3">{t('candidates.partnerPreferences')}</p>
                  <div className="grid grid-cols-2 gap-4">
                    <label className="text-sm font-semibold">{t('candidates.preferredDenomination')}<select className="input-field mt-1.5 font-normal" value={Array.isArray(formData.partnerPreferences?.preferredDenomination) ? 'Selected denominations' : formData.partnerPreferences?.preferredDenomination || ''} onChange={e => setNestedField('partnerPreferences', 'preferredDenomination', e.target.value === 'Selected denominations' ? [] : e.target.value)}><option value="">{t('candidates.notSpecified')}</option><option value="Same as mine">{t('candidates.sameAsMine')}</option><option value="Any Christian denomination">{t('candidates.anyChristian')}</option><option value="Selected denominations">{t('candidates.selectedDenominations')}</option></select>{Array.isArray(formData.partnerPreferences?.preferredDenomination) && <select multiple size={3} className="input-field mt-1.5 font-normal" value={formData.partnerPreferences.preferredDenomination} onChange={e => setNestedField('partnerPreferences', 'preferredDenomination', [...e.target.selectedOptions].map(option => option.value))}><option>Catholic</option><option>Protestant</option><option>Pentecostal</option><option>CSI</option><option>CNI</option><option>Baptist</option><option>Methodist</option><option>Orthodox</option><option>Mar Thoma</option><option>Evangelical</option><option>Other</option></select>}</label>
                    <label className="text-sm font-semibold">{t('candidates.childrenPreference')}<input className="input-field mt-1.5 font-normal" value={formData.partnerPreferences?.childrenPreference || ''} onChange={e => setNestedField('partnerPreferences', 'childrenPreference', e.target.value)} placeholder={t('candidates.childrenPlaceholder')} /></label>
                    <label className="text-sm font-semibold">{t('candidates.relocationPreference')}<input className="input-field mt-1.5 font-normal" value={formData.partnerPreferences?.relocationPreference || ''} onChange={e => setNestedField('partnerPreferences', 'relocationPreference', e.target.value)} /></label>
                    <label className="text-sm font-semibold">{t('candidates.familyInvolvement')}<input className="input-field mt-1.5 font-normal" value={formData.partnerPreferences?.familyInvolvement || ''} onChange={e => setNestedField('partnerPreferences', 'familyInvolvement', e.target.value)} /></label>
                  </div>
                </div>
                <div className="col-span-2 border-t border-gray-100 pt-4">
                  <p className="text-sm font-bold text-charcoal mb-3">{t('candidates.familyPrivacy')}</p>
                  <div className="grid grid-cols-3 gap-3 text-sm">
                    {['phone', 'email', 'exactLocation'].map(key => <label key={key} className="flex items-center gap-2"><input type="checkbox" checked={formData.privacyMasking?.[key] !== false} onChange={e => setNestedField('privacyMasking', key, e.target.checked)} />{t('candidates.maskUntilApproved', { field: key === 'exactLocation' ? t('candidates.exactLocation') : t(`family.${key}`) })}</label>)}
                  </div>
                </div>
                <div className="col-span-2">
                  <label htmlFor="family-email" className="block text-sm font-semibold mb-1.5">{t('candidates.familyEmail')} <span className="text-gray-400 font-normal">({t('candidates.optional')})</span></label>
                  <input id="family-email" type="email" className="input-field" value={formData.familyEmail || ''} onChange={e => setFormData({ ...formData, familyEmail: e.target.value })} placeholder="family@example.com" />
                  <p className="text-xs text-gray-400 mt-1">{t('candidates.familyEmailHint')}</p>
                </div>
              </div>
              <label className="flex items-center gap-3 cursor-pointer p-3 rounded-xl border border-dashed border-secondary/30 hover:bg-secondary/5 transition-colors">
                <input type="checkbox" id="referral" checked={formData.isOpenToReferral} onChange={e => setFormData({ ...formData, isOpenToReferral: e.target.checked })} className="rounded text-secondary" />
                <span className="text-sm font-medium text-charcoal">{t('candidates.referralNetwork')}</span>
                <span className="ml-auto text-xs text-secondary font-semibold">{t('candidates.expandsReach')}</span>
              </label>
              <div className="flex justify-end gap-3 pt-2">
                <button type="button" onClick={() => setIsModalOpen(false)} className="px-5 py-2.5 text-gray-600 hover:bg-gray-100 rounded-xl font-semibold transition-colors">{t('common.cancel')}</button>
                <button type="submit" className="btn-primary">{t('candidates.save')}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {candidateToDelete && (
        <div className="fixed inset-0 bg-charcoal/60 backdrop-blur-sm flex items-center justify-center z-[60] p-4" role="dialog" aria-modal="true" aria-labelledby="delete-candidate-title">
          <div className="bg-white rounded-2xl w-full max-w-sm shadow-2xl p-6">
            <h3 id="delete-candidate-title" className="text-xl font-bold font-heading text-charcoal">
              {t('candidates.deleteCandidateQuestion', { name: candidateToDelete.name })}
            </h3>
            <p className="text-sm text-gray-500 mt-2">{t('candidates.cannotUndo')}</p>
            <div className="flex justify-end gap-3 mt-6">
              <button type="button" onClick={() => setCandidateToDelete(null)} className="px-5 py-2.5 text-gray-600 hover:bg-gray-100 rounded-xl font-semibold transition-colors">
                {t('common.cancel')}
              </button>
              <button type="button" onClick={handleDelete} className="px-5 py-2.5 rounded-xl bg-primary text-white font-semibold hover:bg-primary-hover transition-colors">
                {t('candidates.deleteCandidate')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Matches Modal */}
      {isMatchModalOpen && (
        <div className="fixed inset-0 bg-charcoal/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl">
            <div className="p-6 border-b border-gray-100 flex justify-between items-center">
              <div>
                <h3 className="text-xl font-bold font-heading">{t('candidates.topMatches')}</h3>
                <p className="text-sm text-gray-500 mt-0.5">{t('candidates.forCandidate')} <span className="font-semibold text-charcoal">{currentCandidate?.name}</span></p>
              </div>
              <button onClick={() => setIsMatchModalOpen(false)} className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center text-gray-500 hover:bg-gray-200 transition-colors font-bold">×</button>
            </div>
            <div className="p-6 space-y-3">
              {matches.length === 0 ? (
                <div className="text-center py-12">
                  <div className="w-14 h-14 rounded-2xl bg-secondary/10 flex items-center justify-center mx-auto mb-3">
                    <Zap size={24} className="text-secondary" />
                  </div>
                  <p className="font-semibold text-charcoal">{t('candidates.noMatches')}</p>
                  <p className="text-gray-400 text-sm mt-1">{t('candidates.addCandidatesForMatches')}</p>
                </div>
              ) : matches.map((m, idx) => {
                const scoreColor = m.score >= 75 ? 'bg-secondary text-white' : m.score >= 50 ? 'bg-accent text-white' : 'bg-gray-100 text-gray-600';
                return (
                  <div key={idx} className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 p-4 rounded-xl border border-gray-100 hover:border-secondary/30 hover:bg-secondary/5 transition-all">
                    <div className="flex items-start gap-4">
                                            <GenderAvatar name={m.candidate.name} gender={m.candidate.gender} size="lg" />
                      <div>
                        <div className="flex items-center gap-2">
                          <div className="flex flex-wrap items-center gap-2"><h4 className="font-bold text-charcoal">{m.candidate.name}</h4><CandidateTrust candidate={m.candidate} /></div>
                          <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${scoreColor}`}>{m.score}%</span>
                        </div>
                        <p className="text-sm text-gray-500 mt-0.5">{m.candidate.age} {t('candidates.matchYears')} • {m.candidate.city} • {m.candidate.education}</p>
                        <div className="mt-3 space-y-1.5">
                          <p className="text-[11px] font-bold uppercase tracking-wider text-gray-400">{t('candidates.poweredByEngine')}</p>
                          {Object.entries(m.categories || {}).filter(([, category]) => category.score !== null).map(([key, category]) => <div key={key} className="flex items-center gap-2 text-xs"><span className="w-32 text-gray-500 truncate">{t(`candidates.compatibilityCategories.${key}`, { defaultValue: category.label })}</span><div className="h-1.5 flex-1 max-w-32 rounded-full bg-gray-100"><div className="h-full rounded-full bg-secondary" style={{ width: `${category.score}%` }}></div></div><span className="w-8 text-right font-semibold text-gray-500">{category.score}%</span></div>)}
                          <p className="text-xs text-gray-600 mt-2"><span className="font-semibold text-charcoal">{t('candidates.whyMatch')}</span> {translateExplanation(m.explanation)}</p>
                        </div>
                      </div>
                    </div>
                    <div className="flex flex-wrap items-center gap-2 flex-shrink-0">
                      <a href={generateWhatsAppLink(m.candidate)} target="_blank" rel="noreferrer" className="btn-accent flex items-center gap-1.5 text-sm">
                        <MessageCircle size={14} /> {t('candidates.whatsapp')}
                      </a>
                      <button
                        type="button"
                        onClick={() => handleAddToPipeline(m.candidate)}
                        disabled={Boolean(addingMatchId)}
                        className="btn-secondary flex items-center gap-1.5 text-sm disabled:opacity-60 disabled:cursor-not-allowed"
                      >
                        <Plus size={14} /> {addingMatchId === m.candidate._id ? t('candidates.adding') : t('candidates.addToPipeline')}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CandidateList;
