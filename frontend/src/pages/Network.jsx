import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Send, Check, X, Globe, Inbox } from 'lucide-react';
import toast from 'react-hot-toast';
import GenderAvatar from '../components/GenderAvatar';
import PageLoader from '../components/PageLoader';
import { useTranslation } from 'react-i18next';

const STATUS_STYLES = {
  Pending:  'bg-gray-100 text-gray-600',
  Accepted: 'bg-secondary/15 text-secondary',
  Rejected: 'bg-red-100 text-red-600',
};

const Network = () => {
  const { t } = useTranslation();
  const [networkCandidates, setNetworkCandidates] = useState([]);
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedCandidateId, setSelectedCandidateId] = useState(null);
  const [splitValue, setSplitValue] = useState('50/50');

  const fetchData = async () => {
    try {
      const [netRes, reqRes] = await Promise.all([
        axios.get('http://localhost:5000/api/referrals/network'),
        axios.get('http://localhost:5000/api/referrals/requests')
      ]);
      setNetworkCandidates(netRes.data);
      setRequests(reqRes.data);
    } catch (err) { console.error(err); } finally { setLoading(false); }
  };

  useEffect(() => { fetchData(); }, []);

  const openModal = (candidateId) => {
    setSelectedCandidateId(candidateId);
    setSplitValue('50/50');
    setIsModalOpen(true);
  };

  const submitRequest = async () => {
    if (!splitValue) return;
    try {
      await axios.post('http://localhost:5000/api/referrals/request', { candidateId: selectedCandidateId, agreedSplit: splitValue });
      setIsModalOpen(false);
      toast.success(t('network.referralSent'));
      fetchData();
    } catch (err) {
      console.error(err);
      toast.error(t('network.unableSend'));
    }
  };

  const handleUpdateStatus = async (id, status) => {
    try {
      await axios.put(`http://localhost:5000/api/referrals/requests/${id}`, { status });
      toast.success(t('network.referralStatusUpdated', { status: t(`network.${status.toLowerCase()}`) }));
      fetchData();
    } catch (err) {
      console.error(err);
      toast.error(t('network.unableUpdate'));
    }
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold font-heading text-charcoal">{t('network.title')}</h2>
        <p className="text-gray-500 text-sm mt-1">{t('network.description')}</p>
      </div>
      {/* Available Referrals */}
      <div className="card">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-8 h-8 rounded-xl bg-secondary flex items-center justify-center">
            <Globe size={16} className="text-white" />
          </div>
          <h3 className="font-bold font-heading text-lg text-charcoal">{t('network.availableTitle')}</h3>
          <span className="ml-auto text-xs bg-secondary/10 text-secondary px-3 py-1 rounded-full font-bold">{networkCandidates.length} {t('network.availableCount')}</span>
        </div>

        {loading ? <PageLoader rows={3} /> : networkCandidates.length === 0 ? (
          <div className="flex flex-col items-center py-14 text-center">
            <div className="w-16 h-16 rounded-2xl bg-secondary/10 flex items-center justify-center mb-4">
              <Globe size={28} className="text-secondary" />
            </div>
            <p className="font-semibold text-charcoal">{t('network.noReferrals')}</p>
            <p className="text-gray-400 text-sm mt-1">{t('network.noReferralsHint')}</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {networkCandidates.map(cand => {
              return (
                <div key={cand._id} className="border border-gray-100 rounded-2xl p-4 hover:border-secondary/40 hover:shadow-md transition-all group bg-white">
                  <div className="flex items-center gap-3 mb-4">
                    <GenderAvatar name={cand.name} gender={cand.gender} size="lg" />
                    <div>
                      <p className="font-bold text-charcoal">{cand.gender}, {cand.age} {t('network.years')}</p>
                      <p className="text-xs text-gray-400">{cand.city} • {cand.education}</p>
                    </div>
                  </div>
                  {cand.incomeRange && (
                    <div className="mb-3">
                      <span className="text-xs bg-accent/10 text-accent px-2 py-1 rounded-full font-semibold">{cand.incomeRange}</span>
                    </div>
                  )}
                  <button
                    onClick={() => openModal(cand._id)}
                    className="w-full mt-2 flex items-center justify-center gap-2 py-2 px-4 rounded-xl text-sm font-semibold text-secondary border-2 border-secondary/20 hover:bg-secondary hover:text-white hover:border-secondary transition-all shadow-sm"
                  >
                    <Send size={14} /> {t('network.requestConnection')}
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Referral Requests Table */}
      <div className="card">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-8 h-8 rounded-xl bg-accent flex items-center justify-center">
            <Send size={16} className="text-white" />
          </div>
          <h3 className="font-bold font-heading text-lg text-charcoal">{t('network.requestsTitle')}</h3>
        </div>

        {loading ? <PageLoader rows={3} /> : requests.length === 0 ? (
          <div className="flex flex-col items-center py-10 text-center">
            <div className="w-12 h-12 rounded-2xl bg-accent/10 flex items-center justify-center mb-3">
              <Inbox size={22} className="text-accent" />
            </div>
            <p className="font-semibold text-charcoal text-sm">{t('network.noRequests')}</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-gray-100">
                  {['candidate', 'fromAgency', 'toAgency', 'split', 'status', 'actions'].map(key => (
                    <th key={key} className="py-3 px-4 text-xs font-semibold text-gray-400 uppercase tracking-wider">{t(`network.${key}`)}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {requests.map(req => {
                  const broker = JSON.parse(localStorage.getItem('broker') || '{}');
                  const isIncoming = req.owningBroker._id !== broker.id;
                  return (
                    <tr key={req._id} className="hover:bg-gray-50/50 transition-colors">
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          <GenderAvatar name={req.candidate?.name} gender={req.candidate?.gender} size="sm" />
                          <span className="font-medium text-sm text-charcoal">{req.candidate?.name || t('network.unknown')}</span>
                        </div>
                      </td>
                      <td className="py-3 px-4 text-sm text-gray-600">{req.requestingBroker?.agencyName}</td>
                      <td className="py-3 px-4 text-sm text-gray-600">{req.owningBroker?.agencyName}</td>
                      <td className="py-3 px-4">
                        <span className="text-xs bg-accent/10 text-accent px-2.5 py-1 rounded-full font-bold">{req.agreedSplit}</span>
                      </td>
                      <td className="py-3 px-4">
                        <span className={`px-3 py-1 rounded-full text-xs font-bold ${STATUS_STYLES[req.status] || STATUS_STYLES.Pending}`}>{t(`network.${req.status.toLowerCase()}`)}</span>
                      </td>
                      <td className="py-3 px-4">
                        {req.status === 'Pending' && !isIncoming && (
                          <div className="flex gap-1">
                            <button onClick={() => handleUpdateStatus(req._id, 'Accepted')} className="p-1.5 rounded-lg text-secondary hover:bg-secondary/10 transition-colors"><Check size={16} /></button>
                            <button onClick={() => handleUpdateStatus(req._id, 'Rejected')} className="p-1.5 rounded-lg text-red-400 hover:bg-red-50 transition-colors"><X size={16} /></button>
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Commission Split Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-charcoal/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-sm shadow-2xl overflow-hidden">
            <div className="h-1 bg-secondary w-full"></div>
            <div className="p-6">
              <div className="flex items-center gap-3 mb-1">
                <div className="w-9 h-9 rounded-xl bg-secondary/10 flex items-center justify-center">
                  <Send size={18} className="text-secondary" />
                </div>
                <h3 className="text-xl font-bold font-heading text-charcoal">{t('network.proposeSplit')}</h3>
              </div>
              <p className="text-sm text-gray-500 mt-2 mb-5">{t('network.splitDescription')}</p>
              <label className="block text-sm font-semibold text-charcoal mb-2">{t('network.commissionSplit')}</label>
              <input
                type="text"
                className="input-field"
                value={splitValue}
                onChange={e => setSplitValue(e.target.value)}
                placeholder={t('network.splitPlaceholder')}
              />
              <div className="flex gap-3 mt-6">
                <button onClick={() => setIsModalOpen(false)} className="flex-1 py-2.5 rounded-xl border border-gray-200 font-semibold text-gray-600 hover:bg-gray-50 transition-colors">{t('common.cancel')}</button>
                <button onClick={submitRequest} className="flex-1 btn-secondary">{t('network.confirm')}</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Network;
