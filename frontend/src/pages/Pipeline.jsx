import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { ArrowRight, DollarSign, Inbox, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';
import GenderAvatar from '../components/GenderAvatar';
import PageLoader from '../components/PageLoader';
import { useTranslation } from 'react-i18next';

const STAGES = ['Interested', 'Meeting Arranged', 'Family Approved', 'Married'];

// Visual identity per stage
const STAGE_STYLES = {
  'Interested':       { header: 'bg-gray-100 text-gray-600',   bar: 'bg-gray-400',    pill: 'bg-gray-100 text-gray-600',   width: 'w-1/4',  },
  'Meeting Arranged': { header: 'bg-accent/15 text-accent',    bar: 'bg-accent',      pill: 'bg-accent/15 text-accent',    width: 'w-1/2',  },
  'Family Approved':  { header: 'bg-secondary/15 text-secondary', bar: 'bg-secondary', pill: 'bg-secondary/15 text-secondary', width: 'w-3/4' },
  'Married':          { header: 'bg-primary/15 text-primary',   bar: 'bg-primary',     pill: 'bg-primary/15 text-primary',  width: 'w-full', },
};

const Pipeline = () => {
  const { t } = useTranslation();
  const [pipeline, setPipeline] = useState([]);
  const [loading, setLoading] = useState(true);
  const [matchToRemove, setMatchToRemove] = useState(null);

  const fetchPipeline = async () => {
    try {
      const res = await axios.get('http://localhost:5000/api/pipeline');
      setPipeline(res.data);
    } catch (err) { console.error(err); } finally { setLoading(false); }
  };

  useEffect(() => { fetchPipeline(); }, []);

  const moveStage = async (id, currentStage, direction) => {
    const idx = STAGES.indexOf(currentStage);
    const newIdx = direction === 'next' ? idx + 1 : idx - 1;
    if (newIdx < 0 || newIdx >= STAGES.length) return;
    try {
      await axios.put(`http://localhost:5000/api/pipeline/${id}/stage`, { stage: STAGES[newIdx] });
      toast.success(t('pipeline.stageChanged'));
      fetchPipeline();
    } catch (err) {
      console.error(err);
      toast.error(t('pipeline.unableStage'));
    }
  };

  const updateCommission = async (id, commission) => {
    try {
      await axios.put(`http://localhost:5000/api/pipeline/${id}/stage`, { stage: 'Married', commission });
      fetchPipeline();
    } catch (err) {
      console.error(err);
      toast.error(t('pipeline.unableCommission'));
    }
  };

  const removeMatch = async () => {
    if (!matchToRemove) return;
    try {
      await axios.delete(`http://localhost:5000/api/pipeline/${matchToRemove._id}`);
      setPipeline(current => current.filter(match => match._id !== matchToRemove._id));
      setMatchToRemove(null);
      toast.success(t('pipeline.dealRemoved'));
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.message || t('pipeline.unableRemove'));
    }
  };

  return (
    <div>
      <div className="mb-8">
        <h2 className="text-2xl font-bold font-heading text-charcoal">{t('pipeline.title')}</h2>
        <p className="text-gray-500 text-sm mt-1">{t('pipeline.description')}</p>
      </div>
      {loading ? <PageLoader rows={4} /> : <div className="flex gap-4 overflow-x-auto pb-6">
        {STAGES.map(stage => {
          const s = STAGE_STYLES[stage];
          const stageMatches = pipeline.filter(m => m.stage === stage);
          return (
            <div key={stage} className="flex-1 min-w-[270px] flex flex-col">
              {/* Column Header */}
              <div className={`flex items-center justify-between px-4 py-2.5 rounded-xl mb-3 ${s.header}`}>
                <span className="font-bold font-heading text-sm">{t(`pipeline.${stage === 'Meeting Arranged' ? 'meetingArranged' : stage === 'Family Approved' ? 'familyApproved' : stage.toLowerCase()}`)}</span>
                <span className={`w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold ${s.pill}`}>
                  {stageMatches.length}
                </span>
              </div>

              {/* Cards */}
              <div className="flex-1 space-y-3">
                {stageMatches.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-28 border-2 border-dashed border-gray-200 rounded-2xl text-gray-300">
                    <Inbox size={22} className="mb-1" />
                    <p className="text-xs font-semibold">{t('pipeline.noCards')}</p>
                  </div>
                ) : stageMatches.map(match => {
                  return (
                    <div key={match._id} className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-shadow">
                      {/* Stage progress strip */}
                      <div className="h-1 bg-gray-100">
                        <div className={`h-full ${s.bar} ${s.width} transition-all`}></div>
                      </div>

                      <div className="p-4">
                        {/* Couple row */}
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center gap-2">
                            <GenderAvatar name={match.candidate1?.name} gender={match.candidate1?.gender} size="sm" />
                            <div>
                              <p className="font-semibold text-charcoal text-sm leading-none">{match.candidate1?.name}</p>
                            </div>
                          </div>
                          <div className="text-gray-300 text-base">♥</div>
                          <div className="flex items-center gap-2">
                            <div className="text-right">
                              <p className="font-semibold text-charcoal text-sm leading-none">{match.candidate2?.name}</p>
                            </div>
                            <GenderAvatar name={match.candidate2?.name} gender={match.candidate2?.gender} size="sm" />
                          </div>
                        </div>

                        {/* Commission field for Married */}
                        {stage === 'Married' && (
                          <div className="mt-2 pt-3 border-t border-gray-100 flex items-center justify-between">
                            <span className="flex items-center gap-1 text-secondary text-xs font-semibold">
                              <DollarSign size={13} /> {t('pipeline.commission')}
                            </span>
                            <input
                              type="number"
                              defaultValue={match.commission || ''}
                              onBlur={(e) => updateCommission(match._id, Number(e.target.value))}
                              className="w-24 px-2 py-1 border border-gray-200 rounded-lg text-right text-sm focus:outline-none focus:border-secondary"
                              placeholder={t('pipeline.commissionPlaceholder')}
                            />
                          </div>
                        )}

                        {/* Move buttons */}
                        <div className="flex justify-end gap-2 mt-3">
                          {stage !== 'Interested' && (
                            <button onClick={() => moveStage(match._id, stage, 'prev')} className="text-xs px-3 py-1.5 text-gray-500 hover:bg-gray-100 rounded-lg font-medium transition-colors">← {t('pipeline.back')}</button>
                          )}
                          {stage !== 'Married' && (
                            <button onClick={() => moveStage(match._id, stage, 'next')} className={`text-xs px-3 py-1.5 rounded-lg font-semibold transition-colors flex items-center gap-1 ${s.pill}`}>
                              {t('pipeline.next')} <ArrowRight size={11} />
                            </button>
                          )}
                          <button type="button" onClick={() => setMatchToRemove(match)} className="p-1.5 rounded-lg text-red-400 transition-colors hover:bg-red-50 hover:text-red-600" title={t('pipeline.removeDeal')} aria-label={t('pipeline.removeFromPipeline', { first: match.candidate1?.name, second: match.candidate2?.name })}>
                            <Trash2 size={15} />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>}

      {matchToRemove && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-charcoal/60 p-4 backdrop-blur-sm" role="dialog" aria-modal="true" aria-labelledby="remove-deal-title">
          <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-2xl">
            <h3 id="remove-deal-title" className="text-xl font-bold font-heading text-charcoal">{t('pipeline.removeFromPipeline', { first: matchToRemove.candidate1?.name, second: matchToRemove.candidate2?.name })}</h3>
            <p className="mt-2 text-sm text-gray-500">{t('pipeline.cannotUndo')}</p>
            <div className="mt-6 flex justify-end gap-3">
              <button type="button" onClick={() => setMatchToRemove(null)} className="rounded-xl px-5 py-2.5 font-semibold text-gray-600 transition-colors hover:bg-gray-100">{t('common.cancel')}</button>
              <button type="button" onClick={removeMatch} className="rounded-xl bg-red-500 px-5 py-2.5 font-semibold text-white transition-colors hover:bg-red-600">{t('pipeline.remove')}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Pipeline;
