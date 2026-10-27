import React, { useEffect, useState, useContext } from 'react';
import axios from 'axios';
import { Users, CheckCircle, Clock, Inbox, ArrowRight, ExternalLink, Activity as ActivityIcon } from 'lucide-react';
import { AuthContext } from '../context/AuthContext';
import PageLoader from '../components/PageLoader';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { useTranslation } from 'react-i18next';

const formatRelativeTime = (timestamp, t) => {
  const elapsedSeconds = Math.max(0, Math.floor((Date.now() - new Date(timestamp).getTime()) / 1000));
  if (elapsedSeconds < 60) return t('dashboard.justNow');
  const minutes = Math.floor(elapsedSeconds / 60);
  if (minutes < 60) return t('dashboard.minutesAgo', { count: minutes });
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return t('dashboard.hoursAgo', { count: hours });
  const days = Math.floor(hours / 24);
  return t('dashboard.daysAgo', { count: days });
};

const Dashboard = () => {
  const { broker } = useContext(AuthContext);
  const { t, i18n } = useTranslation();
  const [stats, setStats] = useState({ totalCandidates: 0, activeMatches: 0, successfulMatches: 0 });
  const [loading, setLoading] = useState(true);
  const [interestRequests, setInterestRequests] = useState([]);
  const [activities, setActivities] = useState([]);
  const [requestToDismiss, setRequestToDismiss] = useState(null);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const [candRes, pipeRes, interestRes] = await Promise.all([
          axios.get('http://localhost:5000/api/candidates'),
          axios.get('http://localhost:5000/api/pipeline'),
          axios.get('http://localhost:5000/api/interests/requests')
        ]);
        setInterestRequests(interestRes.data);
        try {
          const activityRes = await axios.get('http://localhost:5000/api/activity?limit=8');
          setActivities(activityRes.data);
        } catch (activityError) {
          console.error(activityError);
        }
        const pipeline = pipeRes.data;
        setStats({
          totalCandidates: candRes.data.length,
          activeMatches: pipeline.filter(m => m.stage !== 'Married').length,
          successfulMatches: pipeline.filter(m => m.stage === 'Married').length,
        });
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  const startDeal = async request => {
    try {
      await axios.post(`http://localhost:5000/api/interests/requests/${request._id}/start-deal`);
      setInterestRequests(current => current.map(item => item._id === request._id ? { ...item, status: 'Deal Started' } : item));
      toast.success(t('dashboard.dealAdded'));
    } catch (err) { toast.error(err.response?.data?.message || t('dashboard.unableStart')); }
  };

  const reviewRequest = async request => {
    try {
      await axios.put(`http://localhost:5000/api/interests/requests/${request._id}/review`);
      setInterestRequests(current => current.map(item => item._id === request._id ? { ...item, status: 'Reviewed' } : item));
    } catch (err) { toast.error(t('dashboard.unableReview')); }
  };

  const dismissRequest = async () => {
    if (!requestToDismiss) return;
    try {
      await axios.put(`http://localhost:5000/api/interests/requests/${requestToDismiss._id}/dismiss`);
      setInterestRequests(current => current.filter(item => item._id !== requestToDismiss._id));
      setRequestToDismiss(null);
      toast.success(t('dashboard.requestDismissed'));
    } catch (err) { toast.error(err.response?.data?.message || t('dashboard.unableDismiss')); }
  };

  const statCards = [
    {
      title: t('dashboard.totalCandidates'),
      value: stats.totalCandidates,
      icon: Users,
      bg: 'bg-primary',
      glow: 'shadow-primary/20',
      strip: 'bg-primary',
      textColor: 'text-primary',
      lightBg: 'bg-primary/5',
    },
    {
      title: t('dashboard.activeDeals'),
      value: stats.activeMatches,
      icon: Clock,
      bg: 'bg-accent',
      glow: 'shadow-accent/20',
      strip: 'bg-accent',
      textColor: 'text-accent',
      lightBg: 'bg-accent/5',
    },
    {
      title: t('dashboard.successfulMatches'),
      value: stats.successfulMatches,
      icon: CheckCircle,
      bg: 'bg-secondary',
      glow: 'shadow-secondary/20',
      strip: 'bg-secondary',
      textColor: 'text-secondary',
      lightBg: 'bg-secondary/5',
    },
  ];

  const statusLabel = status => ({
    Pending: t('dashboard.pendingStatus'),
    Reviewed: t('dashboard.reviewed'),
    'Deal Started': t('dashboard.dealStarted'),
  }[status] || status);

  return (
    <div>
      {/* Welcome Header */}
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold font-heading text-charcoal">
            {t('dashboard.welcome')} <span className="text-primary">{broker?.name?.split(' ')[0] || t('common.broker')}</span> 👋
          </h1>
          <p className="text-gray-500 mt-1 text-sm">
            {new Date().toLocaleDateString(i18n.resolvedLanguage === 'ta' ? 'ta-IN' : 'en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
          </p>
        </div>
      </div>

      {loading ? <PageLoader rows={3} /> : <>
      {/* Stat Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
        {statCards.map((stat, idx) => {
          const Icon = stat.icon;
          return (
            <div key={idx} className={`card shadow-lg ${stat.glow} ${stat.lightBg} border-0`}>
              <div className={`absolute top-0 left-0 h-1 w-full ${stat.strip} rounded-t-2xl`}></div>
              <div className="flex items-center justify-between mt-2">
                <div>
                  <p className="text-sm font-semibold text-gray-500 uppercase tracking-wider">{stat.title}</p>
                  <h3 className="text-5xl font-bold font-heading text-charcoal mt-2">{stat.value}</h3>
                </div>
                <div className={`${stat.bg} p-4 rounded-2xl shadow-md`}>
                  <Icon size={28} className="text-white" />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Recent Activity */}
      <div className="card mb-8">
        <div className="flex items-center justify-between mb-5">
          <div><h3 className="text-lg font-bold font-heading text-charcoal">{t('dashboard.interestRequests')}</h3><p className="text-sm text-gray-500 mt-1">{t('dashboard.interestDescription')}</p></div>
          <span className="text-xs bg-accent/10 text-accent px-3 py-1 rounded-full font-bold">{interestRequests.filter(request => request.status === 'Pending').length} {t('dashboard.pending')}</span>
        </div>
        {interestRequests.length === 0 ? <p className="text-sm text-gray-400 py-8 text-center">{t('dashboard.noRequests')}</p> : <div className="space-y-3">
          {interestRequests.map(request => <div key={request._id} className="border border-gray-100 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center gap-3">
            <div className="flex-1"><p className="font-semibold text-charcoal">{request.expressingCandidate?.name} {t('dashboard.interestedIn')} {request.targetCandidate?.name}</p><p className="text-xs text-gray-500 mt-1">{request.targetCandidate?.age} {t('family.years')} • {request.targetCandidate?.city} • {request.targetCandidate?.education}</p>{request.crossBroker && <p className="text-xs text-accent mt-2">{t('dashboard.managedByAnother')}</p>}</div>
            <span className="text-xs font-bold text-gray-500">{statusLabel(request.status)}</span>
            {request.crossBroker ? <Link to="/network" className="text-xs font-semibold text-secondary flex items-center gap-1">{t('dashboard.brokerNetwork')} <ExternalLink size={13} /></Link> : request.status === 'Pending' ? <button type="button" onClick={() => startDeal(request)} className="btn-secondary flex items-center gap-1 text-xs"><ArrowRight size={13} /> {t('dashboard.startDeal')}</button> : null}
            {request.status === 'Pending' && <><button type="button" onClick={() => setRequestToDismiss(request)} className="text-xs font-semibold text-red-500 hover:text-red-700">{t('dashboard.dismiss')}</button><button type="button" onClick={() => reviewRequest(request)} className="text-xs font-semibold text-gray-500 hover:text-charcoal">{t('dashboard.markReviewed')}</button></>}
          </div>)}
        </div>}
      </div>

      {requestToDismiss && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-charcoal/60 p-4 backdrop-blur-sm" role="dialog" aria-modal="true" aria-labelledby="dismiss-interest-title">
          <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-2xl">
            <h3 id="dismiss-interest-title" className="text-xl font-bold font-heading text-charcoal">{t('dashboard.dismissTitle')}</h3>
            <p className="mt-2 text-sm text-gray-500">{t('dashboard.cannotUndo')}</p>
            <div className="mt-6 flex justify-end gap-3">
              <button type="button" onClick={() => setRequestToDismiss(null)} className="rounded-xl px-5 py-2.5 font-semibold text-gray-600 transition-colors hover:bg-gray-100">{t('common.cancel')}</button>
              <button type="button" onClick={dismissRequest} className="rounded-xl bg-red-500 px-5 py-2.5 font-semibold text-white transition-colors hover:bg-red-600">{t('dashboard.dismiss')}</button>
            </div>
          </div>
        </div>
      )}

      {/* Recent Activity */}
      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold font-heading text-charcoal">{t('dashboard.recentActivity')}</h3>
          <span className="text-xs text-secondary bg-secondary/10 px-3 py-1 rounded-full">{t('dashboard.latest')} {activities.length}</span>
        </div>
        {activities.length === 0 ? <div className="flex flex-col items-center justify-center py-12 text-center">
          <div className="w-16 h-16 rounded-2xl bg-secondary/10 flex items-center justify-center mb-4"><Inbox size={28} className="text-secondary" /></div>
          <p className="font-semibold text-charcoal">{t('dashboard.noActivity')}</p>
          <p className="text-gray-400 text-sm mt-1 max-w-xs">{t('dashboard.activityHint')}</p>
        </div> : <div className="divide-y divide-gray-100">
          {activities.map(activity => <div key={activity._id} className="flex items-start gap-3 py-3 first:pt-0 last:pb-0">
            <div className="mt-0.5 rounded-lg bg-primary/10 p-2 text-primary"><ActivityIcon size={15} /></div>
            <div className="min-w-0 flex-1"><p className="text-sm font-semibold text-charcoal">{activity.description}</p><p className="mt-1 text-xs text-gray-400">{formatRelativeTime(activity.createdAt, t)}</p></div>
          </div>)}
        </div>}
      </div>
      </>}
    </div>
  );
};

export default Dashboard;
