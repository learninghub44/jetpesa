'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '../../lib/supabaseBrowser';
import confetti from 'canvas-confetti';

const MIN_WAGER = 10;
const COUNTDOWN_MS = 5000;

/* -------------------------------------------------------------------------- */
/*  Icon System                                                               */
/* -------------------------------------------------------------------------- */
function Icon({ name, size = 18, className = '', style = {} }) {
  const props = {
    width: size,
    height: size,
    viewBox: '0 0 24 24',
    fill: 'none',
    stroke: 'currentColor',
    strokeWidth: 2,
    strokeLinecap: 'round',
    strokeLinejoin: 'round',
    className,
    style,
    'aria-hidden': true,
  };

  switch (name) {
    case 'jet':
      return <svg {...props}><path d="M17.8 16.8 21 21l-4.2-3.2" /><path d="M2.5 13.5 21 3l-8.5 18-2.7-7.3-7.3-2.7Z" /></svg>;
    case 'volume-x':
      return <svg {...props}><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" /><line x1="23" y1="9" x2="17" y2="15" /><line x1="17" y1="9" x2="23" y2="15" /></svg>;
    case 'volume-2':
      return <svg {...props}><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" /><path d="M15.54 8.46a5 5 0 0 1 0 7.07" /><path d="M19.07 4.93a10 10 0 0 1 0 14.14" /></svg>;
    case 'cloud-rain':
      return <svg {...props}><line x1="16" y1="13" x2="16" y2="21" /><line x1="8" y1="13" x2="8" y2="21" /><line x1="12" y1="15" x2="12" y2="23" /><path d="M20 16.58A5 5 0 0 0 18 7h-1.26A8 8 0 1 0 4 15.25" /></svg>;
    case 'user':
      return <svg {...props}><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" /></svg>;
    case 'shield-check':
      return <svg {...props}><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" /><path d="m9 12 2 2 4-4" /></svg>;
    case 'bar-chart-3':
      return <svg {...props}><path d="M3 3v18h18" /><path d="M18 17V9" /><path d="M13 17V5" /><path d="M8 17v-3" /></svg>;
    case 'rocket':
      return <svg {...props}><path d="M4.5 16.5c-1.5 1.26-2 5-2 5s3.74-.5 5-2c.71-.84.7-2.13-.09-2.91a2.18 2.18 0 0 0-2.91-.09z" /><path d="m12 15-3-3a22 22 0 0 1 2-3.95A12.88 12.88 0 0 1 22 2c0 2.72-.78 7.5-6 11a22.35 22.35 0 0 1-4 2z" /><path d="M9 12H4s.55-3.03 2-4c1.62-1.08 5 0 5 0" /><path d="M12 15v5s3.03-.55 4-2c1.08-1.62 0-5 0-5" /></svg>;
    case 'message-square':
      return <svg {...props}><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" /></svg>;
    case 'send':
      return <svg {...props}><line x1="22" y1="2" x2="11" y2="13" /><polygon points="22 2 15 22 11 13 2 9 22 2" /></svg>;
    case 'x-circle':
      return <svg {...props}><circle cx="12" cy="12" r="10" /><line x1="15" y1="9" x2="9" y2="15" /><line x1="9" y1="9" x2="15" y2="15" /></svg>;
    case 'check-circle':
      return <svg {...props}><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" /><polyline points="22 4 12 14.01 9 11.01" /></svg>;
    case 'alert-triangle':
      return <svg {...props}><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z" /><line x1="12" y1="9" x2="12" y2="13" /><line x1="12" y1="17" x2="12.01" y2="17" /></svg>;
    case 'wallet':
      return <svg {...props}><path d="M21 12V7H5a2 2 0 0 1 0-4h14v4" /><path d="M3 5v14a2 2 0 0 0 2 2h16v-5" /><path d="M18 12a2 2 0 0 0 0 4h4v-4Z" /></svg>;
    case 'refresh-cw':
      return <svg {...props}><path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8" /><path d="M21 3v5h-5" /><path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16" /><path d="M3 21v-5h5" /></svg>;
    case 'plus':
      return <svg {...props}><path d="M5 12h14" /><path d="M12 5v14" /></svg>;
    case 'minus':
      return <svg {...props}><path d="M5 12h14" /></svg>;
    case 'x':
      return <svg {...props}><path d="M18 6 6 18" /><path d="m6 6 12 12" /></svg>;
    case 'check':
      return <svg {...props}><path d="M20 6 9 17l-5-5" /></svg>;
    default:
      return null;
  }
}

/* -------------------------------------------------------------------------- */
/*  User Avatar                                                               */
/* -------------------------------------------------------------------------- */
function UserAvatar({ seed, size = 28 }) {
  const colors = ['#ef4444', '#f59e0b', '#22c55e', '#3b82f6', '#8b5cf6', '#ec4899', '#14b8a6'];
  const colorIndex = seed.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0) % colors.length;
  const bgColor = colors[colorIndex];

  return (
    <div
      style={{
        width: size,
        height: size,
        borderRadius: '50%',
        background: `${bgColor}20`,
        border: `1px solid ${bgColor}40`,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: bgColor,
        flexShrink: 0,
      }}
    >
      <Icon name="user" size={Math.round(size * 0.55)} />
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*  Main Component                                                            */
/* -------------------------------------------------------------------------- */
export default function UltimateJetPesaCockpit() {
  const router = useRouter();

  const [user, setUser] = useState(null);
  const [balance, setBalance] = useState(0.0);
  const [phoneProfile, setPhoneProfile] = useState('');
  const [profileName, setProfileName] = useState('');
  const [editPhone, setEditPhone] = useState('');
  const [editName, setEditName] = useState('');
  const [rememberPhone, setRememberPhone] = useState(true);

  const [myBetsHistory, setMyBetsHistory] = useState([]);
  const [activeTab, setActiveTab] = useState('all');
  const [isDepositModalOpen, setIsDepositModalOpen] = useState(false);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [isWithdrawModalOpen, setIsWithdrawModalOpen] = useState(false);
  const [isProvablyModalOpen, setIsProvablyModalOpen] = useState(false);
  const [isRainActive, setIsRainActive] = useState(false);
  const [audioMuted, setAudioMuted] = useState(false);
  const [mobileActivePanel, setMobileActivePanel] = useState('game');

  const [toasts, setToasts] = useState([]);
  const [inputPhone, setInputPhone] = useState('');
  const [inputAmount, setInputAmount] = useState('100');
  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [loadingDeposit, setLoadingDeposit] = useState(false);
  const [loadingWithdraw, setLoadingWithdraw] = useState(false);

  const [deckA, setDeckA] = useState({
    wager: MIN_WAGER,
    isAuto: false,
    isAutoCash: false,
    cashVal: 2.0,
    hasBetNext: false,
    hasBetCurrent: false,
  });

  const [deckB, setDeckB] = useState({
    wager: 20,
    isAuto: false,
    isAutoCash: false,
    cashVal: 3.0,
    hasBetNext: false,
    hasBetCurrent: false,
  });

  const [multiplier, setMultiplier] = useState(1.0);
  const [gameStatus, setGameStatus] = useState('idle');
  const [countdownProgress, setCountdownProgress] = useState(100);
  const [historyTape, setHistoryTape] = useState([]);

  const [activePlayersCount, setActivePlayersCount] = useState(0);
  const [liveBetsFeed, setLiveBetsFeed] = useState([]);
  const [chatInput, setChatInput] = useState('');
  const [chatLogs, setChatLogs] = useState([]);

  const [provablyData, setProvablyData] = useState(null);
  const [provablyLoading, setProvablyLoading] = useState(false);
  const [roundInfo, setRoundInfo] = useState({ nonce: 0, commitment: '' });

  const canvasRef = useRef(null);
  const animationId = useRef(null);
  const chatEndRef = useRef(null);
  const audioCtxRef = useRef(null);
  const planeImageRef = useRef(null);
  const roundRef = useRef({ nonce: 0, phase: 'betting', takeoffAt: 0, crashPoint: null, commitment: '' });
  const clockOffsetRef = useRef(0);
  const deckARef = useRef(null);
  const deckBRef = useRef(null);
  const cashingRef = useRef({ A: false, B: false });
  const queuedForRoundRef = useRef(0);
  const prevOpenRef = useRef({ A: false, B: false });
  const applyRef = useRef(null);

  useEffect(() => {
    const svgPlane = `
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 420 180">
        <defs>
          <linearGradient id="bodyRed" x1="0" x2="1">
            <stop offset="0%" stop-color="#ff6b6b"/>
            <stop offset="45%" stop-color="#e11d48"/>
            <stop offset="100%" stop-color="#7f1d1d"/>
          </linearGradient>
          <linearGradient id="glass" x1="0" x2="1">
            <stop offset="0%" stop-color="#dbeafe"/>
            <stop offset="100%" stop-color="#1e293b"/>
          </linearGradient>
          <filter id="shadow">
            <feDropShadow dx="0" dy="8" stdDeviation="8" flood-color="#000000" flood-opacity="0.45"/>
          </filter>
        </defs>
        <g filter="url(#shadow)" transform="rotate(-12 210 90)">
          <path d="M70 98 L12 60 L110 84 Z" fill="url(#bodyRed)" stroke="#111827" stroke-width="3"/>
          <path d="M150 104 L40 168 L290 116 Z" fill="url(#bodyRed)" stroke="#111827" stroke-width="4"/>
          <path d="M72 82 C145 44, 270 40, 360 74 C376 80, 376 96, 360 101 C260 130, 142 125, 72 100 C50 92, 50 88, 72 82 Z" fill="url(#bodyRed)" stroke="#111827" stroke-width="4"/>
          <path d="M112 95 C175 84, 255 84, 340 92" stroke="#ffffff" stroke-width="5" opacity="0.45" fill="none"/>
          <path d="M160 68 C190 48, 230 50, 252 72 C222 78, 192 80, 160 68 Z" fill="url(#glass)" stroke="#111827" stroke-width="2"/>
          <path d="M78 82 L48 28 C76 28, 98 50, 105 80 Z" fill="url(#bodyRed)" stroke="#111827" stroke-width="4"/>
          <ellipse cx="362" cy="88" rx="22" ry="15" fill="#1e293b" stroke="#000" stroke-width="3"/>
          <circle cx="382" cy="88" r="10" fill="#d1d5db" stroke="#111827" stroke-width="3"/>
          <circle cx="384" cy="88" r="4" fill="#ffffff" opacity="0.8"/>
        </g>
      </svg>
    `;

    const img = new Image();
    img.src = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svgPlane);
    planeImageRef.current = img;
  }, []);

  const triggerToast = useCallback((msg, type = 'info') => {
    const id = Date.now() + Math.random();
    setToasts((prev) => [...prev, { id, msg, type }]);
    setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), 3500);
  }, []);

  const playSynthesizedTone = useCallback((freq, type, duration, volume = 0.03) => {
    if (audioMuted) return;
    try {
      if (!audioCtxRef.current) {
        audioCtxRef.current = new (window.AudioContext || window.webkitAudioContext)();
      }
      const ctx = audioCtxRef.current;
      if (ctx.state === 'suspended') ctx.resume();
      const osc = ctx.createOscillator();
      const gainNode = ctx.createGain();
      osc.type = type;
      osc.frequency.value = freq;
      gainNode.gain.setValueAtTime(volume, ctx.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + duration);
      osc.connect(gainNode);
      gainNode.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + duration);
    } catch (e) {
      // silent
    }
  }, [audioMuted]);












  /* ---------------------------------------------------------------------- */
  /*  Server-authoritative game + wallet (Supabase). The browser never       */
  /*  decides balances, crash points or payouts.                             */
  /* ---------------------------------------------------------------------- */
  deckARef.current = deckA;
  deckBRef.current = deckB;

  const authedFetch = useCallback(async (path, options = {}) => {
    const { data } = await supabase.auth.getSession();
    const token = data?.session?.access_token || '';
    const res = await fetch(path, {
      ...options,
      cache: 'no-store',
      headers: { 'Content-Type': 'application/json', ...(options.headers || {}), Authorization: `Bearer ${token}` },
    });
    const json = await res.json().catch(() => ({}));
    if (res.status === 401) router.push('/auth?tab=login');
    return { res, json };
  }, [router]);

  const fetchProvablyRound = useCallback(async (nonce, openModal = false) => {
    try {
      if (openModal) setProvablyLoading(true);
      const res = await fetch(`/api/game/provably?nonce=${nonce}`, { cache: 'no-store' });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.message || 'Could not load provably fair round.');
      setProvablyData(data);
      if (openModal) setIsProvablyModalOpen(true);
    } catch (e) {
      triggerToast(e.message, 'error');
    } finally {
      if (openModal) setProvablyLoading(false);
    }
  }, [triggerToast]);

  const openProvablyModal = async () => {
    const r = roundRef.current;
    // The running round's seed stays secret until it crashes; show the last revealed one.
    const nonce = r.crashPoint != null ? r.nonce : Math.max(1, r.nonce - 1);
    await fetchProvablyRound(nonce, true);
  };

  const placeServerBet = async (deckName, fromQueue = false) => {
    const d = deckName === 'A' ? deckARef.current : deckBRef.current;
    const setter = deckName === 'A' ? setDeckA : setDeckB;
    const stake = Math.max(MIN_WAGER, Number(d.wager) || MIN_WAGER);
    const autoCashout = d.isAutoCash ? parseFloat(d.cashVal) : null;
    const { res, json } = await authedFetch('/api/game/bet', {
      method: 'POST',
      body: JSON.stringify({ deck: deckName, stake, autoCashout }),
    });
    if (!res.ok || !json.success) {
      setter((p) => ({ ...p, hasBetNext: false }));
      triggerToast(json.message || 'Could not place bet.', 'error');
      return false;
    }
    setBalance(json.balance);
    setter((p) => ({ ...p, hasBetCurrent: true, hasBetNext: fromQueue ? p.isAuto : p.hasBetNext }));
    return true;
  };

  const serverCashout = async (deckName, auto = false) => {
    if (cashingRef.current[deckName]) return;
    cashingRef.current[deckName] = true;
    const setter = deckName === 'A' ? setDeckA : setDeckB;
    let settled = false;
    try {
      const { res, json } = await authedFetch('/api/game/cashout', {
        method: 'POST',
        body: JSON.stringify({ deck: deckName, auto }),
      });
      if (!res.ok || !json.success) { triggerToast(json.message || 'Cash-out failed.', 'error'); return; }
      if (json.result === 'won') {
        settled = true;
        setBalance(json.balance);
        setter((p) => ({ ...p, hasBetCurrent: false }));
        playSynthesizedTone(587.33, 'sine', 0.12, 0.05);
        setTimeout(() => playSynthesizedTone(880.0, 'sine', 0.25, 0.05), 110);
        confetti({ particleCount: 60, spread: 50, origin: { y: 0.4 } });
        triggerToast(`${auto ? 'Auto ' : ''}Cashout @ ${json.multiplier.toFixed(2)}x! +KES ${json.payout.toFixed(2)}`, 'success');
      } else if (json.result === 'crashed') {
        settled = true;
        setter((p) => ({ ...p, hasBetCurrent: false }));
        triggerToast('Too late. The plane had already flown away.', 'error');
      } else if (json.result === 'no_bet') {
        settled = true;
        setter((p) => ({ ...p, hasBetCurrent: false }));
      }
      // 'too_early' / 'not_flying': leave unsettled so the loop can retry.
    } finally {
      if (!settled) cashingRef.current[deckName] = false;
    }
  };

  const applyServerState = (json, t0) => {
    const r = json.round;
    const rtt = Date.now() - t0;
    clockOffsetRef.current = json.serverTime - (t0 + rtt / 2);

    const prev = roundRef.current;
    roundRef.current = { nonce: r.nonce, phase: r.phase, takeoffAt: r.takeoffAt, crashPoint: r.crashPoint, commitment: r.commitment };
    if (prev.nonce !== r.nonce) {
      setRoundInfo({ nonce: r.nonce, commitment: r.commitment });
      cashingRef.current = { A: false, B: false };
    }

    setBalance(json.balance);
    setLiveBetsFeed(json.liveBets);
    setActivePlayersCount(json.playerCount);
    setHistoryTape(json.history);
    setMyBetsHistory(json.myHistory);

    const isOpen = (d) => json.myBets.some((b) => b.deck === d && b.status === 'open');
    const open = { A: isOpen('A'), B: isOpen('B') };
    ['A', 'B'].forEach((d) => {
      if (prevOpenRef.current[d] && !open[d] && r.crashPoint != null) {
        const lost = json.myBets.find((b) => b.deck === d && b.status === 'lost');
        if (lost) triggerToast(`Deck ${d}: flew away @ ${Number(r.crashPoint).toFixed(2)}x`, 'error');
      }
    });
    prevOpenRef.current = open;
    setDeckA((p) => (p.hasBetCurrent === open.A ? p : { ...p, hasBetCurrent: open.A }));
    setDeckB((p) => (p.hasBetCurrent === open.B ? p : { ...p, hasBetCurrent: open.B }));

    // Queued ("next round") bets are placed as soon as a new betting window opens.
    if (r.phase === 'betting' && queuedForRoundRef.current !== r.nonce) {
      queuedForRoundRef.current = r.nonce;
      if (deckARef.current?.hasBetNext) placeServerBet('A', true);
      if (deckBRef.current?.hasBetNext) placeServerBet('B', true);
    }
  };
  applyRef.current = applyServerState;

  useEffect(() => {
    const savedPhone = localStorage.getItem('jetpesa_saved_phone');
    if (savedPhone) {
      setInputPhone(savedPhone);
      setPhoneProfile(savedPhone);
      setEditPhone(savedPhone);
    }
    let cancelled = false;
    (async () => {
      const { data } = await supabase.auth.getSession();
      const session = data?.session;
      if (!session) { router.push('/'); return; }
      setUser(session.user);
      const { data: prof } = await supabase
        .from('profiles')
        .select('wallet_balance, display_name, mpesa_phone')
        .eq('id', session.user.id)
        .maybeSingle();
      if (cancelled || !prof) return;
      setBalance(Number(prof.wallet_balance || 0));
      setProfileName(prof.display_name || '');
      setEditName(prof.display_name || '');
      if (!savedPhone && prof.mpesa_phone) {
        setPhoneProfile(prof.mpesa_phone);
        setInputPhone(prof.mpesa_phone);
        setEditPhone(prof.mpesa_phone);
      }
    })();
    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!session) router.push('/');
    });
    return () => { cancelled = true; sub.subscription.unsubscribe(); };
  }, [router]);

  // Poll the server for round state (balance, live bets, history, phase).
  useEffect(() => {
    if (!user) return;
    let stopped = false;
    let timer;
    const tick = async () => {
      try {
        const t0 = Date.now();
        const { res, json } = await authedFetch('/api/game/state');
        if (!stopped && res.ok && json.success) applyRef.current(json, t0);
      } catch (e) { /* retry on next tick */ }
      if (!stopped) timer = setTimeout(tick, roundRef.current.phase === 'flying' ? 250 : 500);
    };
    tick();
    return () => { stopped = true; clearTimeout(timer); };
  }, [user, authedFetch]);


  useEffect(() => {
    function runClockLoop() {
      const r = roundRef.current;
      const now = Date.now() + clockOffsetRef.current;
      let offsetMs = 0;

      if (r.nonce) {
        const sinceTakeoff = now - r.takeoffAt;
        if (r.crashPoint != null) {
          // Crash point is only known once the server confirms the crash.
          if (gameStatus !== 'crashed') setGameStatus('crashed');
          setMultiplier(Number(r.crashPoint));
          offsetMs = COUNTDOWN_MS + Math.max(0, sinceTakeoff);
        } else if (sinceTakeoff < 0) {
          if (gameStatus !== 'idle') {
            setGameStatus('idle');
            setMultiplier(1.0);
            playSynthesizedTone(440, 'triangle', 0.05, 0.03);
          }
          setCountdownProgress(Math.max(0, Math.min(100, (-sinceTakeoff / COUNTDOWN_MS) * 100)));
          offsetMs = COUNTDOWN_MS + sinceTakeoff;
          if (offsetMs % 1000 < 20) playSynthesizedTone(320, 'sine', 0.03, 0.02);
        } else {
          if (gameStatus !== 'running') setGameStatus('running');
          const computed = Math.max(1, Math.floor(Math.exp(0.078 * (sinceTakeoff / 1000)) * 100) / 100);
          setMultiplier(computed);
          offsetMs = COUNTDOWN_MS + sinceTakeoff;
          if (offsetMs % 300 < 20) playSynthesizedTone(200 + computed * 15, 'sine', 0.015, 0.012);
          [['A', deckA], ['B', deckB]].forEach(([name, d]) => {
            if (d.hasBetCurrent && d.isAutoCash && computed >= parseFloat(d.cashVal) && !cashingRef.current[name]) {
              serverCashout(name, true);
            }
          });
        }
      }

      renderRadarCanvas(offsetMs, COUNTDOWN_MS);
      animationId.current = requestAnimationFrame(runClockLoop);
    }

    animationId.current = requestAnimationFrame(runClockLoop);
    return () => cancelAnimationFrame(animationId.current);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [deckA, deckB, gameStatus, balance, audioMuted, isRainActive]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatLogs]);



  /* ---------------------------------------------------------------------- */
  /*  TRULY RESPONSIVE CANVAS — reads actual container dimensions            */
  /* ---------------------------------------------------------------------- */
  const drawRain = (ctx, W, H, secondsInAir) => {
    if (!isRainActive) return;
    ctx.save();
    ctx.strokeStyle = 'rgba(125, 211, 252, 0.34)';
    ctx.lineWidth = W < 500 ? 1 : 1.4;
    ctx.shadowBlur = 8;
    ctx.shadowColor = 'rgba(56,189,248,0.45)';
    const drops = W < 500 ? 40 : 80;
    for (let i = 0; i < drops; i++) {
      const x = ((i * 71 + secondsInAir * 360) % (W + 120)) - 80;
      const y = ((i * 47 + secondsInAir * 620) % (H + 140)) - 80;
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.lineTo(x - 9, y + 24);
      ctx.stroke();
    }
    ctx.restore();
  };

  const renderRadarCanvas = (offsetMs, countdownLimit) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const parent = canvas.parentElement;
    if (!parent) return;

    const dpr = window.devicePixelRatio || 1;
    const W = parent.clientWidth;
    const H = parent.clientHeight;
    if (W === 0 || H === 0) return;

    if (canvas.width !== Math.round(W * dpr) || canvas.height !== Math.round(H * dpr)) {
      canvas.width = Math.round(W * dpr);
      canvas.height = Math.round(H * dpr);
    }

    const ctx = canvas.getContext('2d');
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, W, H);

    // Grid
    ctx.strokeStyle = 'rgba(255,255,255,0.025)';
    ctx.lineWidth = 1;
    const gridX = W < 500 ? 36 : 50;
    const gridY = W < 500 ? 30 : 40;
    for (let i = 0; i < W; i += gridX) {
      ctx.beginPath(); ctx.moveTo(i, 0); ctx.lineTo(i, H); ctx.stroke();
    }
    for (let j = 0; j < H; j += gridY) {
      ctx.beginPath(); ctx.moveTo(0, j); ctx.lineTo(W, j); ctx.stroke();
    }

    if (offsetMs >= countdownLimit && gameStatus === 'running') {
      const secondsInAir = (offsetMs - countdownLimit) / 1000;
      drawRain(ctx, W, H, secondsInAir);

      const flightProgress = Math.min(secondsInAir / 11, 1);
      const smoothProgress = 1 - Math.pow(1 - flightProgress, 2.4);
      const multiplierLift = Math.min((multiplier - 1) / 2.8, 1);
      const liftFactor = Math.max(smoothProgress * 0.9, multiplierLift);

      const pad = Math.max(30, W * 0.06);
      const startX = pad;
      const baseY = H - pad;
      const maxLift = H - pad * 2.5;

      const cx = startX + (W - pad * 2.5) * Math.min(Math.pow(flightProgress, 0.82), 1);
      const cy = baseY - maxLift * Math.min(liftFactor, 1);

      const controlX = startX + (cx - startX) * 0.48;
      const controlY = baseY - maxLift * Math.min(liftFactor * 0.42, 0.62);

      ctx.beginPath();
      ctx.moveTo(startX, baseY);
      ctx.quadraticCurveTo(controlX, controlY, cx, cy);
      ctx.strokeStyle = 'rgba(225,29,72,0.98)';
      ctx.lineWidth = W < 500 ? 4 : 6;
      ctx.shadowBlur = 28;
      ctx.shadowColor = '#e11d48';
      ctx.stroke();
      ctx.shadowBlur = 0;

      ctx.lineTo(cx, baseY);
      ctx.lineTo(startX, baseY);
      ctx.closePath();

      const underGradient = ctx.createLinearGradient(startX, cy, startX, baseY);
      underGradient.addColorStop(0, 'rgba(225,29,72,0.26)');
      underGradient.addColorStop(0.45, 'rgba(225,29,72,0.1)');
      underGradient.addColorStop(1, 'transparent');
      ctx.fillStyle = underGradient;
      ctx.fill();

      // Plane scales with canvas width
      const planeScale = Math.max(0.45, Math.min(W / 700, 1));
      const planeW = 136 * planeScale;
      const planeH = 64 * planeScale;
      const planeAngle = -0.32 + Math.min(liftFactor * 0.38, 0.26) + Math.sin(secondsInAir * 5) * 0.018;

      // Shadow
      ctx.save();
      ctx.translate(cx + 8 * planeScale, cy + 13 * planeScale);
      ctx.rotate(planeAngle);
      ctx.globalAlpha = 0.2;
      ctx.filter = `blur(${Math.round(11 * planeScale)}px)`;
      if (planeImageRef.current) ctx.drawImage(planeImageRef.current, -planeW / 2, -planeH / 2, planeW, planeH);
      ctx.restore();

      // Main plane
      ctx.save();
      ctx.translate(cx, cy);
      ctx.rotate(planeAngle);
      ctx.shadowBlur = 24 * planeScale;
      ctx.shadowColor = 'rgba(255,255,255,0.32)';
      if (planeImageRef.current) ctx.drawImage(planeImageRef.current, -planeW / 2, -planeH / 2, planeW, planeH);
      ctx.restore();

      // Exhaust particles
      const particleCount = W < 400 ? 3 : 5;
      for (let i = 0; i < particleCount; i++) {
        ctx.beginPath();
        ctx.arc(
          cx - (36 + i * 11) * planeScale,
          cy + Math.sin(secondsInAir * 9 + i) * 4 * planeScale,
          (2.2 + i * 0.35) * planeScale,
          0, Math.PI * 2
        );
        ctx.fillStyle = i % 2 === 0 ? 'rgba(255,255,255,0.48)' : 'rgba(239,68,68,0.42)';
        ctx.fill();
      }
    }
  };

  /* ---------------------------------------------------------------------- */
  /*  Wallet & Profile Logic                                                 */
  /* ---------------------------------------------------------------------- */








  const handleProfileUpdate = async () => {
    if (!user) return;
    const cleanPhone = editPhone.trim();
    if ((!cleanPhone.startsWith('07') && !cleanPhone.startsWith('01')) || cleanPhone.length !== 10) {
      triggerToast('Enter a valid M-Pesa phone number.', 'error');
      return;
    }
    const { res, json } = await authedFetch('/api/profile', {
      method: 'POST',
      body: JSON.stringify({ displayName: editName.trim(), phone: cleanPhone }),
    });
    if (!res.ok || !json.success) { triggerToast(json.message || 'Could not update profile.', 'error'); return; }
    setProfileName(editName.trim());
    setPhoneProfile(cleanPhone);
    setInputPhone(cleanPhone);
    localStorage.setItem('jetpesa_saved_phone', cleanPhone);
    setIsProfileModalOpen(false);
    triggerToast('Profile updated successfully.', 'success');
  };

  const handleWithdrawExecution = async () => {
    const amt = parseInt(withdrawAmount, 10);
    if (isNaN(amt) || amt < 50) { triggerToast('Minimum withdrawal is KES 50.', 'error'); return; }
    if (amt > balance) { triggerToast('Withdrawal exceeds wallet balance.', 'error'); return; }
    setLoadingWithdraw(true);
    try {
      const { res, json } = await authedFetch('/api/withdraw', { method: 'POST', body: JSON.stringify({ amount: amt }) });
      if (!res.ok || !json.success) throw new Error(json.message || 'Withdrawal failed.');
      setBalance(json.balance);
      setWithdrawAmount('');
      setIsWithdrawModalOpen(false);
      triggerToast(json.message || `Withdrawal submitted: KES ${amt}`, 'success');
    } catch (e) {
      triggerToast(`Withdrawal failed: ${e.message}`, 'error');
    } finally {
      setLoadingWithdraw(false);
    }
  };

  const placeWagerIntent = (targetDeck) => {
    const isA = targetDeck === 'A';
    const d = isA ? deckA : deckB;
    const setter = isA ? setDeckA : setDeckB;
    const stake = Math.max(MIN_WAGER, Number(d.wager) || MIN_WAGER);
    if (balance <= 0) { triggerToast('Wallet reads KES 0.00. Please deposit first.', 'error'); return; }
    if (balance < stake) { triggerToast('Selected stake exceeds your available balance.', 'error'); return; }

    const r = roundRef.current;
    const now = Date.now() + clockOffsetRef.current;
    if (r.nonce && r.crashPoint == null && now < r.takeoffAt - 250) {
      placeServerBet(targetDeck);
    } else {
      setter((p) => ({ ...p, hasBetNext: !p.hasBetNext }));
      triggerToast(`Deck ${targetDeck} round queue updated.`, 'info');
    }
  };

  const handleManualPayoutExecution = (targetDeck) => {
    const targetState = targetDeck === 'A' ? deckA : deckB;
    if (!targetState.hasBetCurrent) return;
    serverCashout(targetDeck, false);
  };

  const handlePaymentInitiation = async () => {
    const amt = parseInt(inputAmount, 10);
    const cleanPhone = inputPhone.trim().replace(/\s+/g, '');
    if (isNaN(amt) || amt < 49) { triggerToast('Minimum deposit is KES 49.', 'error'); return; }
    if ((!cleanPhone.startsWith('07') && !cleanPhone.startsWith('01')) || cleanPhone.length !== 10) { triggerToast('Enter a valid M-Pesa phone number.', 'error'); return; }
    if (!user?.id) { triggerToast('Login session expired. Please sign in again.', 'error'); return; }
    setLoadingDeposit(true);
    try {
      const { res, json: data } = await authedFetch('/api/deposit', {
        method: 'POST',
        body: JSON.stringify({ amount: amt, phone: cleanPhone }),
      });
      if (!res.ok || !data.success) throw new Error(data.message || 'Payment initiation failed.');
      if (rememberPhone) localStorage.setItem('jetpesa_saved_phone', cleanPhone);
      triggerToast(data.message || 'STK push sent. Complete payment on your phone.', 'info');
      let attempts = 0;
      const maxAttempts = 36;
      const poll = setInterval(async () => {
        attempts += 1;
        try {
          const { json: st } = await authedFetch(`/api/deposit-status?reference=${encodeURIComponent(data.reference)}`);
          if (st.status === 'completed') {
            clearInterval(poll);
            setBalance(Number(st.balance || 0));
            setIsDepositModalOpen(false);
            setLoadingDeposit(false);
            triggerToast(`Deposit confirmed. KES ${amt} added.`, 'success');
            return;
          }
          if (st.status === 'failed') {
            clearInterval(poll);
            setLoadingDeposit(false);
            triggerToast(st.failureReason || 'Payment failed or was cancelled.', 'error');
            return;
          }
          if (attempts >= maxAttempts) {
            clearInterval(poll);
            setLoadingDeposit(false);
            triggerToast('Payment is still pending. Wallet will update after confirmation.', 'info');
          }
        } catch (e) {
          if (attempts >= maxAttempts) {
            clearInterval(poll);
            setLoadingDeposit(false);
            triggerToast(e.message, 'error');
          }
        }
      }, 5000);
    } catch (e) {
      setLoadingDeposit(false);
      triggerToast(e.message, 'error');
    }
  };

  /* ---------------------------------------------------------------------- */
  /*  Render Helpers                                                         */
  /* ---------------------------------------------------------------------- */
  const renderLiveBets = () => (
    <div className="jp-panel-scroll">
      <div className="jp-live-table-head">
        <span>Pilot</span>
        <span>Stake</span>
        <span>Status</span>
      </div>
      {liveBetsFeed.length === 0 ? (
        <div className="jp-empty-state">
          <Icon name="jet" size={32} />
          <strong>Preparing new round</strong>
          <span>New wagers are entering...</span>
        </div>
      ) : (
        liveBetsFeed.map((b) => (
          <div key={b.id} className="jp-live-row">
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', minWidth: 0 }}>
              <UserAvatar seed={b.username} size={26} />
              <div style={{ minWidth: 0 }}>
                <span className="jp-live-user">{b.username}</span>
                <span className="jp-live-sub">Round #{roundInfo.nonce}</span>
              </div>
            </div>
            <span className="jp-live-stake">{b.bet} KES</span>
            {b.status === 'cashed' ? (
              <span className="jp-badge jp-badge-win">{b.mult.toFixed(2)}x</span>
            ) : b.status === 'lost' ? (
              <span className="jp-badge jp-badge-lost">Lost</span>
            ) : b.status === 'flying' ? (
              <span className="jp-badge jp-badge-flying">Flying</span>
            ) : (
              <span className="jp-badge jp-badge-queue">Queued</span>
            )}
          </div>
        ))
      )}
    </div>
  );

  const renderDeckPanel = (name, deck, setter, color) => (
    <div key={name} className="jp-deck-panel">
      <div className="jp-spribe-toggle">
        <button onClick={() => setter((p) => ({ ...p, isAuto: false }))} className={`jp-spribe-tab ${!deck.isAuto ? 'jp-active' : ''}`}>Bet</button>
        <button onClick={() => setter((p) => ({ ...p, isAuto: true }))} className={`jp-spribe-tab ${deck.isAuto ? 'jp-active' : ''}`}>Auto</button>
      </div>
      <div className="jp-wager-controls">
        <button onClick={() => setter((p) => ({ ...p, wager: Math.max(MIN_WAGER, p.wager - MIN_WAGER) }))} className="jp-round-btn"><Icon name="minus" size={14} /></button>
        <input type="number" min={MIN_WAGER} step={MIN_WAGER} value={deck.wager} onChange={(e) => setter((p) => ({ ...p, wager: Math.max(MIN_WAGER, parseInt(e.target.value, 10) || MIN_WAGER) }))} className="jp-wager-input" />
        <button onClick={() => setter((p) => ({ ...p, wager: p.wager + MIN_WAGER }))} className="jp-round-btn"><Icon name="plus" size={14} /></button>
      </div>
      <div className="jp-quick-stake">
        {[10, 50, 100, 500].map((v) => (
          <button key={v} onClick={() => setter((p) => ({ ...p, wager: v }))} className="jp-quick-btn">{v}</button>
        ))}
      </div>
      <div className="jp-auto-cash-row">
        <span className="jp-auto-cash-label">Auto Cash Out</span>
        <button onClick={() => setter((p) => ({ ...p, isAutoCash: !p.isAutoCash }))} className="jp-switch-track" style={{ background: deck.isAutoCash ? '#22c55e' : '#1f2937' }}>
          <span className="jp-switch-knob" style={{ transform: deck.isAutoCash ? 'translateX(18px)' : 'translateX(0)' }} />
        </button>
      </div>
      <input type="number" step="0.1" disabled={!deck.isAutoCash} value={deck.cashVal} onChange={(e) => setter((p) => ({ ...p, cashVal: e.target.value }))} className="jp-auto-cash-input" style={{ opacity: deck.isAutoCash ? 1 : 0.4 }} />
      {deck.hasBetCurrent ? (
        <button onClick={() => handleManualPayoutExecution(name)} className="jp-cashout-button">
          CASH OUT
          <span className="jp-btn-sub">{(deck.wager * multiplier).toFixed(2)} KES</span>
        </button>
      ) : (
        <button onClick={() => placeWagerIntent(name)} className={`jp-bet-button ${deck.hasBetNext ? 'queued' : ''}`} style={{ background: deck.hasBetNext ? '#475569' : color }}>
          {deck.hasBetNext ? (
            <>CANCEL<span className="jp-btn-sub-sm">Queued</span></>
          ) : (
            <>BET<span className="jp-btn-sub">{deck.wager} KES</span></>
          )}
        </button>
      )}
    </div>
  );

  /* ---------------------------------------------------------------------- */
  /*  JSX                                                                    */
  /* ---------------------------------------------------------------------- */
  return (
    <div className="jp-cockpit">
      {/* Toasts */}
      <div className="jp-toast-container">
        {toasts.map((t) => {
          const toastIcon = t.type === 'error' ? 'x-circle' : t.type === 'success' ? 'check-circle' : 'alert-triangle';
          const toastColor = t.type === 'error' ? '#ef4444' : t.type === 'success' ? '#22c55e' : '#3b82f6';
          return (
            <div key={t.id} className="jp-toast" style={{ borderLeft: `4px solid ${toastColor}` }}>
              <Icon name={toastIcon} size={16} style={{ color: toastColor, flexShrink: 0 }} />
              <span>{t.msg}</span>
            </div>
          );
        })}
      </div>

      {/* Header */}
      <header className="jp-header">
        <div className="jp-header-left">
          <span className="jp-brand-text">JET<span className="jp-brand-accent">PESA</span></span>
          <button className="jp-fair-btn" onClick={openProvablyModal}>
            <Icon name="shield-check" size={13} />
            <span className="jp-fair-label">FAIR #{roundInfo.nonce}</span>
          </button>
        </div>
        <div className="jp-header-right">
          <button className="jp-icon-btn" onClick={() => setAudioMuted(!audioMuted)} aria-label="Toggle audio">
            <Icon name={audioMuted ? 'volume-x' : 'volume-2'} size={18} />
          </button>
          <button className={`jp-rain-btn ${isRainActive ? 'jp-active' : ''}`} onClick={() => setIsRainActive(!isRainActive)}>
            <Icon name="cloud-rain" size={13} />
            <span className="jp-rain-label">RAIN</span>
          </button>
          <button className="jp-profile-btn" onClick={() => setIsProfileModalOpen(true)}>
            <Icon name="user" size={13} />
            <span className="jp-profile-label">PROFILE</span>
          </button>
          <div className="jp-wallet-pill">
            <button className="jp-wallet-balance" onClick={() => balance > 0 ? setIsWithdrawModalOpen(true) : triggerToast('Wallet is empty. Deposit first.', 'info')}>
              <Icon name="wallet" size={15} />
              <span className="jp-wallet-amount">{balance.toFixed(2)} KES</span>
            </button>
            <button className="jp-deposit-btn" onClick={() => setIsDepositModalOpen(true)}>DEPOSIT</button>
          </div>
        </div>
      </header>

      {/* History Tape */}
      <div className="jp-history-tape">
        {historyTape.length === 0 ? (
          <div style={{ color: '#64748b', fontSize: '12px', fontWeight: '800', padding: '5px 2px' }}>
            Previous rounds will appear after the first completed flight.
          </div>
        ) : (
          historyTape.map((h, i) => (
            <div key={`${h}-${i}`} className={`jp-history-chip ${h >= 10 ? 'jp-history-ultra' : h >= 2 ? 'jp-history-high' : 'jp-history-low'}`} style={{ transform: `rotateX(14deg) translateZ(${Math.max(0, 12 - i)}px)` }}>
              {Number(h).toFixed(2)}x
            </div>
          ))
        )}
      </div>

      {/* Main Layout */}
      <div className="jp-layout">
        <div className="jp-panel jp-left-panel" data-active={mobileActivePanel === 'bets'}>
          <div className="jp-tab-bar">
            <button onClick={() => setActiveTab('all')} className={`jp-tab ${activeTab === 'all' ? 'jp-active' : ''}`}>LIVE ({activePlayersCount})</button>
            <button onClick={() => setActiveTab('mine')} className={`jp-tab ${activeTab === 'mine' ? 'jp-active' : ''}`}>MY BETS</button>
          </div>
          {activeTab === 'all' ? renderLiveBets() : (
            <div className="jp-panel-scroll">
              {myBetsHistory.length === 0 ? (
                <div className="jp-empty-state"><Icon name="bar-chart-3" size={32} /><strong>No settled bets yet.</strong></div>
              ) : (
                myBetsHistory.map((m, i) => (
                  <div key={i} className="jp-bet-history-row">
                    <div><span className="jp-bet-history-round">ROUND #{m.roundId}</span><span className="jp-bet-history-stake">{m.stake} KES</span></div>
                    <div style={{ textAlign: 'right' }}><span className="jp-bet-history-mult">{m.multiplier.toFixed(2)}x</span><span className="jp-bet-history-yield">{m.status === 'WON' ? `+${m.yieldAmount.toFixed(1)}` : `-${m.stake}`}</span></div>
                  </div>
                ))
              )}
            </div>
          )}
        </div>

        <div className="jp-center-panel" data-active={mobileActivePanel === 'game'}>
          <div className="jp-canvas-container">
            {gameStatus === 'idle' && (
              <div className="jp-idle-overlay">
                <div className="jp-progress-track"><div className="jp-progress-fill" style={{ width: `${countdownProgress}%` }} /></div>
                <span className="jp-idle-text">WAITING FOR NEXT FLIGHT...</span>
                <span className="jp-idle-sub">New wagers loading...</span>
              </div>
            )}
            <canvas ref={canvasRef} style={{ width: '100%', height: '100%', display: 'block' }} />
            {gameStatus !== 'idle' && (
              <div className="jp-multiplier-overlay">
                {gameStatus === 'crashed' ? (
                  <div>
                    <h1 className="jp-crashed-title"><Icon name="x-circle" size={32} className="jp-crash-icon" />FLEW AWAY</h1>
                    <span className="jp-crashed-sub">Ended @ {multiplier.toFixed(2)}x</span>
                  </div>
                ) : (
                  <h1 className="jp-multiplier-text">{multiplier.toFixed(2)}x</h1>
                )}
              </div>
            )}
          </div>
          <div className="jp-deck-grid">
            {renderDeckPanel('A', deckA, setDeckA, '#22c55e')}
            {renderDeckPanel('B', deckB, setDeckB, '#16a34a')}
          </div>
        </div>

        <div className="jp-panel jp-right-panel" data-active={mobileActivePanel === 'chat'}>
          <div className="jp-chat-header"><div className="jp-chat-dot" /><span>Lobby Chat</span></div>
          <div className="jp-chat-scroll">
            {chatLogs.length === 0 && (
              <div className="jp-empty-state"><Icon name="message-square" size={32} /><strong>Chat is offline</strong><span>Community chat is not available yet.</span></div>
            )}
            {chatLogs.map((c, i) => {
              const isMe = c.user === 'You';
              return (
                <div key={i} className={`jp-chat-bubble ${isMe ? 'jp-chat-me' : ''}`}>
                  {!isMe && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '3px' }}>
                      <UserAvatar seed={c.seed} size={18} />
                      <span className="jp-chat-user">{c.user}</span>
                    </div>
                  )}
                  <span className="jp-chat-msg">{c.msg}</span>
                  <span className="jp-chat-time">{c.time}</span>
                </div>
              );
            })}
            <div ref={chatEndRef} />
          </div>
          <div className="jp-chat-input-row">
            <input type="text" placeholder="Chat is not available yet" disabled value="" readOnly className="jp-chat-input" />
            <button disabled className="jp-chat-send" aria-label="Send message"><Icon name="send" size={15} /></button>
          </div>
        </div>
      </div>

      {/* Mobile Footer */}
      <div className="jp-mobile-footer">
        <button onClick={() => setMobileActivePanel('bets')} className={`jp-mobile-tab ${mobileActivePanel === 'bets' ? 'jp-active' : ''}`}><Icon name="bar-chart-3" size={18} />LIVE</button>
        <button onClick={() => setMobileActivePanel('game')} className={`jp-mobile-tab ${mobileActivePanel === 'game' ? 'jp-active' : ''}`}><Icon name="rocket" size={18} />GAME</button>
        <button onClick={() => setMobileActivePanel('chat')} className={`jp-mobile-tab ${mobileActivePanel === 'chat' ? 'jp-active' : ''}`}><Icon name="message-square" size={18} />CHAT</button>
      </div>

      {/* Deposit Modal */}
      {isDepositModalOpen && (
        <div className="jp-modal-overlay" onClick={() => setIsDepositModalOpen(false)}>
          <div className="jp-modal-box jp-modal-green" onClick={(e) => e.stopPropagation()}>
            <button className="jp-modal-close" onClick={() => setIsDepositModalOpen(false)}><Icon name="x" size={20} /></button>
            <h3 className="jp-modal-title" style={{ color: '#22c55e' }}>Safaricom M-Pesa Wire</h3>
            <div className="jp-modal-field"><label className="jp-modal-label">DEPOSIT QUANTITY (MIN 49 KES)</label><input type="number" value={inputAmount} onChange={(e) => setInputAmount(e.target.value)} className="jp-modal-input" /></div>
            <div className="jp-modal-field"><label className="jp-modal-label">M-PESA REGISTERED TELEPHONE</label><input type="text" value={inputPhone} onChange={(e) => setInputPhone(e.target.value)} placeholder="07XXXXXXXX" className="jp-modal-input" /></div>
            <button onClick={handlePaymentInitiation} disabled={loadingDeposit} className="jp-modal-btn jp-btn-green">{loadingDeposit ? 'SYNCHRONIZING...' : 'AUTHORIZE DEPOSIT'}</button>
          </div>
        </div>
      )}

      {/* Profile Modal */}
      {isProfileModalOpen && (
        <div className="jp-modal-overlay" onClick={() => setIsProfileModalOpen(false)}>
          <div className="jp-modal-box jp-modal-blue" onClick={(e) => e.stopPropagation()}>
            <button className="jp-modal-close" onClick={() => setIsProfileModalOpen(false)}><Icon name="x" size={20} /></button>
            <h3 className="jp-modal-title" style={{ color: '#38bdf8' }}>Profile Settings</h3>
            <div className="jp-modal-field"><label className="jp-modal-label">DISPLAY NAME</label><input type="text" value={editName} onChange={(e) => setEditName(e.target.value)} placeholder="Your name" className="jp-modal-input" /></div>
            <div className="jp-modal-field"><label className="jp-modal-label">EMAIL</label><input type="text" value={user?.email || ''} disabled className="jp-modal-input jp-disabled" /></div>
            <div className="jp-modal-field"><label className="jp-modal-label">M-PESA PHONE</label><input type="text" value={editPhone} onChange={(e) => setEditPhone(e.target.value)} placeholder="07XXXXXXXX" className="jp-modal-input" /></div>
            <button onClick={handleProfileUpdate} className="jp-modal-btn jp-btn-blue">SAVE PROFILE</button>
          </div>
        </div>
      )}

      {/* Withdraw Modal */}
      {isWithdrawModalOpen && (
        <div className="jp-modal-overlay" onClick={() => setIsWithdrawModalOpen(false)}>
          <div className="jp-modal-box jp-modal-orange" onClick={(e) => e.stopPropagation()}>
            <button className="jp-modal-close" onClick={() => setIsWithdrawModalOpen(false)}><Icon name="x" size={20} /></button>
            <h3 className="jp-modal-title" style={{ color: '#f59e0b' }}>Withdraw Funds</h3>
            <p className="jp-modal-balance">Available: <strong style={{ color: '#22c55e' }}>KES {balance.toFixed(2)}</strong></p>
            <div className="jp-modal-field"><label className="jp-modal-label">WITHDRAW AMOUNT</label><input type="number" value={withdrawAmount} onChange={(e) => setWithdrawAmount(e.target.value)} placeholder="Minimum 50" className="jp-modal-input" /></div>
            <button onClick={handleWithdrawExecution} disabled={loadingWithdraw} className="jp-modal-btn jp-btn-orange">{loadingWithdraw ? 'PROCESSING...' : 'WITHDRAW TO M-PESA'}</button>
          </div>
        </div>
      )}

      {/* Provably Fair Modal */}
      {isProvablyModalOpen && (
        <div className="jp-modal-overlay" onClick={() => setIsProvablyModalOpen(false)}>
          <div className="jp-modal-box jp-modal-purple" onClick={(e) => e.stopPropagation()}>
            <button className="jp-modal-close" onClick={() => setIsProvablyModalOpen(false)}><Icon name="x" size={20} /></button>
            <h3 className="jp-modal-title" style={{ color: '#a855f7' }}>Provably Fair Round</h3>
            {provablyLoading ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', color: '#94a3b8', fontSize: '13px' }}><Icon name="refresh-cw" size={16} className="jp-spin" />Loading hash details...</div>
            ) : (
              <>
                <div className="jp-fair-summary">
                  <div className="jp-fair-mini"><span>Round</span><strong>#{provablyData?.nonce ?? '-'}</strong></div>
                  <div className="jp-fair-mini"><span>Crash</span><strong>{provablyData?.revealed ? `${Number(provablyData.crashPoint).toFixed(2)}x` : 'Hidden until crash'}</strong></div>
                </div>
                <HashLine label="Server Seed Hash (published before the round)" value={provablyData?.serverSeedHash || ''} />
                <HashLine label="Round Hash" value={provablyData?.roundHash || 'Revealed after crash'} />
                <HashLine label="Client Seed" value={provablyData?.clientSeed || 'Revealed after crash'} />
                <HashLine label="Verify Input" value={provablyData?.verifyInput || 'Revealed after crash'} />
                <HashLine label="Revealed Server Seed" value={provablyData?.serverSeed || 'Revealed after crash'} />
                <HashLine label="Algorithm" value={provablyData?.algorithm || 'HMAC_SHA256'} />
                <button onClick={openProvablyModal} className="jp-modal-btn jp-btn-purple">REFRESH HASH DETAILS</button>
              </>
            )}
          </div>
        </div>
      )}

      <style>{`
        /* === BASE === */
        .jp-cockpit {
          background: #020617;
          color: #f8fafc;
          min-height: 100vh;
          min-height: 100dvh;
          height: 100dvh;
          font-family: 'Plus Jakarta Sans', system-ui, -apple-system, sans-serif;
          display: flex;
          flex-direction: column;
          overflow: hidden;
        }

        /* === TOASTS === */
        .jp-toast-container {
          position: fixed;
          top: calc(70px + env(safe-area-inset-top, 0px));
          left: 50%;
          transform: translateX(-50%);
          z-index: 99999;
          display: flex;
          flex-direction: column;
          gap: 8px;
          width: 92%;
          max-width: 420px;
          pointer-events: none;
        }
        .jp-toast {
          background: rgba(15, 23, 42, 0.96);
          color: #fff;
          padding: 11px 14px;
          border-radius: 12px;
          box-shadow: 0 12px 28px rgba(0,0,0,0.6);
          font-weight: 750;
          font-size: 12.5px;
          display: flex;
          align-items: center;
          gap: 10px;
          border: 1px solid rgba(255,255,255,0.08);
          backdrop-filter: blur(12px);
          -webkit-backdrop-filter: blur(12px);
          pointer-events: auto;
          animation: jpSlideDown 0.3s ease-out;
        }
        @keyframes jpSlideDown {
          from { opacity: 0; transform: translateY(-16px); }
          to { opacity: 1; transform: translateY(0); }
        }

        /* === HEADER === */
        .jp-header {
          background: rgba(15, 23, 42, 0.88);
          backdrop-filter: blur(16px);
          -webkit-backdrop-filter: blur(16px);
          border-bottom: 1px solid rgba(255,255,255,0.06);
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 10px 16px;
          padding-top: calc(10px + env(safe-area-inset-top, 0px));
          padding-left: calc(16px + env(safe-area-inset-left, 0px));
          padding-right: calc(16px + env(safe-area-inset-right, 0px));
          flex-shrink: 0;
          z-index: 50;
          gap: 8px;
        }
        .jp-header-left {
          display: flex;
          align-items: center;
          gap: 10px;
          flex-shrink: 0;
        }
        .jp-header-right {
          display: flex;
          align-items: center;
          gap: 8px;
          flex-wrap: wrap;
          justify-content: flex-end;
        }
        .jp-brand-text {
          font-size: 20px;
          font-weight: 900;
          letter-spacing: -1px;
          background: linear-gradient(to right, #fff, #94a3b8);
          -webkit-background-clip: text;
          background-clip: text;
          color: transparent;
          white-space: nowrap;
        }
        .jp-brand-accent {
          background: linear-gradient(135deg, #22c55e, #86efac);
          -webkit-background-clip: text;
          background-clip: text;
          color: transparent;
        }
        .jp-fair-btn {
          background: rgba(34,197,94,0.1);
          border: 1px solid rgba(34,197,94,0.3);
          color: #22c55e;
          font-size: 10px;
          font-weight: 800;
          padding: 4px 8px;
          border-radius: 20px;
          cursor: pointer;
          display: flex;
          align-items: center;
          gap: 4px;
          white-space: nowrap;
        }
        .jp-icon-btn {
          background: transparent;
          border: none;
          color: #94a3b8;
          cursor: pointer;
          padding: 6px;
          border-radius: 8px;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .jp-icon-btn:hover { color: #fff; background: rgba(255,255,255,0.05); }
        .jp-rain-btn {
          background: rgba(255,255,255,0.05);
          border: 1px solid rgba(255,255,255,0.08);
          color: #94a3b8;
          padding: 5px 10px;
          border-radius: 20px;
          font-size: 10px;
          font-weight: 900;
          cursor: pointer;
          display: flex;
          align-items: center;
          gap: 4px;
          white-space: nowrap;
        }
        .jp-rain-btn.jp-active { background: #38bdf8; color: #0f172a; border-color: #38bdf8; }
        .jp-profile-btn {
          background: rgba(255,255,255,0.06);
          border: 1px solid rgba(255,255,255,0.08);
          color: #fff;
          padding: 5px 10px;
          border-radius: 20px;
          font-size: 10px;
          font-weight: 900;
          cursor: pointer;
          display: flex;
          align-items: center;
          gap: 4px;
          white-space: nowrap;
        }
        .jp-wallet-pill {
          display: flex;
          align-items: center;
          background: rgba(0,0,0,0.4);
          border: 1px solid rgba(255,255,255,0.08);
          padding: 2px 2px 2px 10px;
          border-radius: 30px;
          gap: 2px;
          flex-shrink: 0;
        }
        .jp-wallet-balance {
          background: transparent;
          border: none;
          color: #22c55e;
          font-weight: 900;
          font-size: 13px;
          cursor: pointer;
          display: flex;
          align-items: center;
          gap: 5px;
          padding: 5px 8px;
          border-radius: 20px;
          white-space: nowrap;
        }
        .jp-wallet-balance:hover { background: rgba(34,197,94,0.1); }
        .jp-deposit-btn {
          background: linear-gradient(135deg, #22c55e, #16a34a);
          border: none;
          color: #fff;
          font-weight: 900;
          padding: 7px 14px;
          border-radius: 20px;
          cursor: pointer;
          font-size: 11px;
          white-space: nowrap;
        }

        /* === HISTORY TAPE === */
        .jp-history-tape {
          display: flex;
          gap: 7px;
          background: radial-gradient(circle at top, rgba(30,41,59,0.72), #020617 70%);
          padding: 8px 16px;
          overflow-x: auto;
          border-bottom: 1px solid rgba(255,255,255,0.06);
          flex-shrink: 0;
          perspective: 700px;
        }
        .jp-history-tape::-webkit-scrollbar { height: 3px; }
        .jp-history-tape::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.1); border-radius: 999px; }
        .jp-history-chip {
          padding: 5px 12px;
          border-radius: 10px;
          font-size: 11px;
          font-weight: 950;
          flex-shrink: 0;
          border: 1px solid rgba(255,255,255,0.12);
          box-shadow: inset 0 1px 0 rgba(255,255,255,0.2), 0 6px 12px rgba(0,0,0,0.4);
        }
        .jp-history-low { background: linear-gradient(145deg, rgba(51,65,85,0.98), rgba(15,23,42,0.98)); color: #cbd5e1; }
        .jp-history-high { background: linear-gradient(145deg, #c084fc, #7e22ce 48%, #3b0764); color: #fff; }
        .jp-history-ultra { background: linear-gradient(145deg, #fde68a, #f59e0b 36%, #7c2d12); color: #fff7ed; }

        /* === LAYOUT === */
        .jp-layout {
          flex: 1;
          display: grid;
          grid-template-columns: 300px minmax(0, 1fr) 300px;
          padding: 12px;
          gap: 12px;
          box-sizing: border-box;
          min-height: 0;
          overflow: hidden;
        }
        .jp-panel {
          background: rgba(15,23,42,0.6);
          border: 1px solid rgba(255,255,255,0.05);
          border-radius: 14px;
          display: flex;
          flex-direction: column;
          height: 100%;
          min-height: 0;
          overflow: hidden;
        }
        .jp-panel-scroll {
          flex: 1;
          overflow-y: auto;
          padding: 8px;
          min-height: 0;
        }
        .jp-panel-scroll::-webkit-scrollbar { width: 5px; }
        .jp-panel-scroll::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.1); border-radius: 999px; }

        /* === TABS === */
        .jp-tab-bar { display: flex; background: rgba(0,0,0,0.2); padding: 3px; flex-shrink: 0; }
        .jp-tab {
          flex: 1; padding: 10px; background: transparent; border: none;
          color: #94a3b8; font-size: 10px; font-weight: 800; border-radius: 8px; cursor: pointer;
        }
        .jp-tab.jp-active { background: rgba(255,255,255,0.06); color: #fff; }

        /* === LIVE BETS === */
        .jp-live-table-head {
          display: grid; grid-template-columns: 1fr 64px 64px; gap: 6px;
          color: #64748b; font-size: 9px; font-weight: 900; text-transform: uppercase; padding: 4px 6px 6px;
        }
        .jp-live-row {
          display: grid; grid-template-columns: 1fr 64px 64px; gap: 6px; align-items: center;
          padding: 7px 8px; background: rgba(15,23,42,0.85); border: 1px solid rgba(255,255,255,0.05);
          border-radius: 10px; font-size: 11px; margin-bottom: 5px;
        }
        .jp-live-user { display: block; color: #e2e8f0; font-weight: 900; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; font-size: 11px; }
        .jp-live-sub { display: block; color: #475569; font-size: 8px; font-weight: 800; margin-top: 1px; }
        .jp-live-stake { color: #fff; font-weight: 900; text-align: right; font-size: 11px; }
        .jp-badge { border-radius: 999px; padding: 3px 6px; font-size: 10px; font-weight: 950; text-align: center; }
        .jp-badge-win { color: #22c55e; background: rgba(34,197,94,0.1); border: 1px solid rgba(34,197,94,0.2); }
        .jp-badge-lost { color: #ef4444; background: rgba(239,68,68,0.1); border: 1px solid rgba(239,68,68,0.2); }
        .jp-badge-flying { color: #38bdf8; background: rgba(56,189,248,0.1); border: 1px solid rgba(56,189,248,0.2); }
        .jp-badge-queue { color: #94a3b8; background: rgba(148,163,184,0.1); border: 1px solid rgba(148,163,184,0.15); }
        .jp-empty-state { height: 70%; display: flex; align-items: center; justify-content: center; flex-direction: column; color: #64748b; font-size: 12px; gap: 6px; text-align: center; }

        /* === BET HISTORY === */
        .jp-bet-history-row { display: flex; justify-content: space-between; padding: 8px; background: rgba(0,0,0,0.15); border-radius: 8px; margin-bottom: 5px; font-size: 11px; border: 1px solid rgba(255,255,255,0.02); }
        .jp-bet-history-round { color: #64748b; display: block; font-size: 9px; }
        .jp-bet-history-stake { font-weight: 800; }
        .jp-bet-history-mult { color: #22c55e; font-weight: 900; display: block; }
        .jp-bet-history-yield { color: #94a3b8; font-size: 10px; }

        /* === CENTER PANEL === */
        .jp-center-panel { display: flex; flex-direction: column; gap: 10px; height: 100%; min-height: 0; }
        .jp-canvas-container {
          flex: 1; background: #020306; border-radius: 16px;
          border: 1px solid rgba(255,255,255,0.05); position: relative;
          overflow: hidden; min-height: 0; box-shadow: inset 0 0 40px rgba(0,0,0,0.9);
        }
        .jp-idle-overlay {
          position: absolute; inset: 0; background: rgba(4,5,9,0.94);
          display: flex; flex-direction: column; align-items: center; justify-content: center; z-index: 10;
        }
        .jp-progress-track { width: 70%; max-width: 280px; background: rgba(255,255,255,0.03); padding: 4px; border-radius: 10px; border: 1px solid rgba(34,197,94,0.2); }
        .jp-progress-fill { height: 6px; background: linear-gradient(to right, #22c55e, #4ade80); border-radius: 6px; transition: width 0.1s linear; box-shadow: 0 0 10px rgba(34,197,94,0.5); }
        .jp-idle-text { color: #fff; font-size: 12px; font-weight: 900; margin-top: 12px; letter-spacing: 0.5px; text-align: center; padding: 0 16px; }
        .jp-idle-sub { color: #475569; font-size: 10px; font-weight: 700; margin-top: 3px; }
        .jp-multiplier-overlay { position: absolute; top: 42%; left: 50%; transform: translate(-50%, -50%); text-align: center; pointer-events: none; }
        .jp-multiplier-text { font-size: clamp(36px, 8vw, 96px); font-weight: 900; color: #fff; margin: 0; letter-spacing: -2px; text-shadow: 0 0 30px rgba(255,255,255,0.2); }
        .jp-crashed-title { color: #e11d48; font-size: clamp(24px, 5vw, 52px); font-weight: 900; margin: 0; display: flex; align-items: center; justify-content: center; gap: 10px; }
        .jp-crash-icon { padding: 6px; background: rgba(239,68,68,0.14); border: 1px solid rgba(239,68,68,0.3); border-radius: 10px; }
        .jp-crashed-sub { color: #475569; font-size: 13px; font-weight: 800; }

        /* === DECK PANEL === */
        .jp-deck-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; background: rgba(15,23,42,0.8); border: 1px solid rgba(255,255,255,0.08); padding: 10px; border-radius: 16px; flex-shrink: 0; }
        .jp-deck-panel { background: rgba(0,0,0,0.28); border: 1px solid rgba(255,255,255,0.06); padding: 10px; border-radius: 12px; display: flex; flex-direction: column; gap: 8px; }
        .jp-spribe-toggle { display: flex; background: #111827; border-radius: 999px; padding: 2px; }
        .jp-spribe-tab { flex: 1; border: none; border-radius: 999px; padding: 6px; font-size: 10px; font-weight: 900; cursor: pointer; color: #64748b; background: transparent; }
        .jp-spribe-tab.jp-active { background: #1e293b; color: #fff; }
        .jp-wager-controls { display: grid; grid-template-columns: 28px 1fr 28px; gap: 4px; align-items: center; }
        .jp-round-btn { height: 28px; border-radius: 50%; border: none; background: #1f2937; color: #fff; cursor: pointer; display: flex; align-items: center; justify-content: center; }
        .jp-wager-input { width: 100%; padding: 6px; background: #0f172a; border: 1px solid rgba(255,255,255,0.1); color: #fff; font-weight: 900; text-align: center; border-radius: 999px; font-size: 14px; box-sizing: border-box; }
        .jp-wager-input:focus { outline: none; border-color: #22c55e; }
        .jp-quick-stake { display: grid; grid-template-columns: repeat(4, 1fr); gap: 3px; }
        .jp-quick-btn { background: #1f2937; border: none; color: #cbd5e1; border-radius: 999px; padding: 4px 2px; font-size: 10px; font-weight: 900; cursor: pointer; }
        .jp-auto-cash-row { display: flex; align-items: center; justify-content: space-between; }
        .jp-auto-cash-label { color: #94a3b8; font-size: 10px; font-weight: 900; }
        .jp-switch-track { width: 36px; height: 20px; border-radius: 999px; border: none; padding: 1px; cursor: pointer; }
        .jp-switch-knob { display: block; width: 18px; height: 18px; border-radius: 50%; background: #fff; transition: transform 0.2s; }
        .jp-auto-cash-input { width: 100%; padding: 6px; background: #0f172a; border: 1px solid rgba(255,255,255,0.1); color: #fff; border-radius: 999px; font-size: 11px; font-weight: 900; text-align: center; box-sizing: border-box; }
        .jp-bet-button, .jp-cashout-button {
          width: 100%; padding: 10px; border: none; color: #fff; font-weight: 950; font-size: 13px;
          border-radius: 10px; cursor: pointer; display: flex; flex-direction: column;
          align-items: center; justify-content: center; line-height: 1.2;
        }
        .jp-bet-button { box-shadow: 0 4px 12px rgba(0,0,0,0.3); }
        .jp-cashout-button { background: linear-gradient(135deg, #f59e0b, #b45309); box-shadow: 0 4px 12px rgba(245,158,11,0.3); }
        .jp-btn-sub { font-size: 14px; margin-top: 1px; }
        .jp-btn-sub-sm { font-size: 11px; margin-top: 1px; }

        /* === CHAT === */
        .jp-right-panel { background: #0b141a; box-shadow: 0 8px 20px rgba(0,0,0,0.4); }
        .jp-chat-header { background: #202c33; padding: 12px 14px; display: flex; align-items: center; gap: 8px; flex-shrink: 0; font-weight: 800; font-size: 13px; color: #e9edef; }
        .jp-chat-dot { width: 8px; height: 8px; border-radius: 50%; background: #00a884; }
        .jp-chat-scroll { flex: 1; padding: 12px; overflow-y: auto; display: flex; flex-direction: column; gap: 8px; background: #0b141a; min-height: 0; }
        .jp-chat-scroll::-webkit-scrollbar { width: 3px; }
        .jp-chat-scroll::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.1); border-radius: 999px; }
        .jp-chat-bubble { max-width: 88%; padding: 7px 10px; border-radius: 10px; box-shadow: 0 1px 2px rgba(0,0,0,0.3); flex-shrink: 0; }
        .jp-chat-bubble:not(.jp-chat-me) { background: #202c33; align-self: flex-start; }
        .jp-chat-bubble.jp-chat-me { background: #005c4b; align-self: flex-end; }
        .jp-chat-user { color: #30d6b5; font-weight: 800; font-size: 10px; }
        .jp-chat-msg { color: #e9edef; font-size: 12px; line-height: 1.4; word-break: break-word; display: block; }
        .jp-chat-time { display: block; text-align: right; font-size: 8px; color: rgba(255,255,255,0.35); margin-top: 3px; }
        .jp-chat-input-row { padding: 8px 10px; background: #202c33; display: flex; align-items: center; gap: 6px; flex-shrink: 0; }
        .jp-chat-input { flex: 1; padding: 9px 12px; background: #2a3942; border: none; color: #fff; border-radius: 8px; font-size: 12px; min-width: 0; }
        .jp-chat-input:focus { outline: 1px solid #00a884; }
        .jp-chat-input:disabled { opacity: 0.5; cursor: not-allowed; }
        .jp-chat-send { background: #00a884; border: none; width: 34px; height: 34px; border-radius: 50%; color: #fff; cursor: pointer; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }

        /* === MOBILE FOOTER === */
        .jp-mobile-footer {
          background: #0c0d12; border-top: 1px solid rgba(255,255,255,0.06);
          display: none; justify-content: space-around; padding: 8px 0;
          padding-bottom: calc(8px + env(safe-area-inset-bottom, 0px));
          position: sticky; bottom: 0; z-index: 999; flex-shrink: 0;
        }
        .jp-mobile-tab {
          background: transparent; border: none; color: #64748b; font-size: 10px; font-weight: 800;
          cursor: pointer; display: flex; flex-direction: column; align-items: center; gap: 3px;
          padding: 4px 10px; border-radius: 8px;
        }
        .jp-mobile-tab.jp-active { color: #22c55e; }

        /* === MODALS === */
        .jp-modal-overlay {
          position: fixed; inset: 0; background: rgba(2,6,23,0.88);
          backdrop-filter: blur(8px); -webkit-backdrop-filter: blur(8px);
          display: flex; align-items: center; justify-content: center;
          z-index: 9999; padding: 16px; animation: jpFadeIn 0.2s ease-out;
        }
        @keyframes jpFadeIn { from { opacity: 0; } to { opacity: 1; } }
        .jp-modal-box {
          background: #0f172a; border-radius: 18px; width: 100%; max-width: 400px;
          padding: 24px; position: relative; box-shadow: 0 24px 60px rgba(0,0,0,0.6);
          border: 1px solid rgba(255,255,255,0.08); animation: jpSlideUp 0.3s cubic-bezier(0.16,1,0.3,1);
          max-height: 90vh; overflow-y: auto;
        }
        @keyframes jpSlideUp { from { opacity: 0; transform: translateY(16px) scale(0.98); } to { opacity: 1; transform: translateY(0) scale(1); } }
        .jp-modal-green { border-color: #22c55e; }
        .jp-modal-blue { border-color: #38bdf8; }
        .jp-modal-orange { border-color: #f59e0b; }
        .jp-modal-purple { border-color: #a855f7; max-width: 500px; }
        .jp-modal-close { position: absolute; top: 12px; right: 14px; background: transparent; border: none; color: #64748b; cursor: pointer; padding: 4px; border-radius: 6px; }
        .jp-modal-close:hover { color: #fff; background: rgba(255,255,255,0.1); }
        .jp-modal-title { margin: 0 0 14px; font-weight: 900; font-size: 17px; }
        .jp-modal-field { margin-bottom: 14px; }
        .jp-modal-label { display: block; font-size: 10px; color: #94a3b8; font-weight: 800; margin-bottom: 5px; }
        .jp-modal-input { width: 100%; padding: 11px; background: #020617; border: 1px solid rgba(255,255,255,0.08); color: #fff; font-size: 14px; border-radius: 10px; box-sizing: border-box; }
        .jp-modal-input:focus { outline: none; border-color: #3b82f6; }
        .jp-modal-input.jp-disabled { opacity: 0.6; cursor: not-allowed; }
        .jp-modal-balance { color: #94a3b8; font-size: 12px; margin-bottom: 12px; }
        .jp-modal-btn { width: 100%; padding: 13px; border: none; color: #fff; font-weight: 900; border-radius: 10px; cursor: pointer; }
        .jp-modal-btn:disabled { opacity: 0.6; cursor: not-allowed; }
        .jp-btn-green { background: linear-gradient(135deg, #22c55e, #16a34a); }
        .jp-btn-blue { background: linear-gradient(135deg, #38bdf8, #0284c7); }
        .jp-btn-orange { background: linear-gradient(135deg, #f59e0b, #b45309); }
        .jp-btn-purple { background: linear-gradient(135deg, #a855f7, #6b21a8); margin-top: 6px; }
        .jp-fair-summary { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; margin: 12px 0; }
        .jp-fair-mini { background: rgba(168,85,247,0.1); border: 1px solid rgba(168,85,247,0.22); border-radius: 10px; padding: 10px; display: flex; flex-direction: column; gap: 3px; color: #c4b5fd; font-size: 10px; font-weight: 900; }
        .jp-hash-line { margin-bottom: 10px; }
        .jp-hash-box { background: #020617; border: 1px solid rgba(255,255,255,0.08); color: #e2e8f0; padding: 8px; border-radius: 8px; font-size: 10px; line-height: 1.4; word-break: break-all; font-family: monospace; }
        .jp-spin { animation: jpSpin 1s linear infinite; }
        @keyframes jpSpin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }

        /* === RESPONSIVE: MEDIUM DESKTOP === */
        @media (max-width: 1180px) {
          .jp-layout { grid-template-columns: 250px minmax(0,1fr) 250px !important; gap: 10px !important; padding: 10px !important; }
        }

        /* === RESPONSIVE: TABLET === */
        @media (max-width: 992px) {
          .jp-layout {
            grid-template-columns: 1fr !important;
            padding: 6px !important;
            padding-bottom: 56px !important;
            overflow: hidden !important;
          }
          .jp-mobile-footer { display: flex !important; }
          .jp-left-panel, .jp-center-panel, .jp-right-panel { display: none !important; }
          .jp-left-panel[data-active="true"],
          .jp-center-panel[data-active="true"],
          .jp-right-panel[data-active="true"] {
            display: flex !important;
            height: 100% !important;
          }
          .jp-canvas-container { min-height: 220px !important; flex: 1 1 auto !important; }
          .jp-deck-grid { max-height: 240px !important; padding: 6px !important; gap: 6px !important; }
          .jp-deck-panel { padding: 6px !important; gap: 6px !important; }
          .jp-bet-button, .jp-cashout-button { padding: 8px 4px !important; min-height: 52px !important; font-size: 12px !important; }
          .jp-header { flex-wrap: wrap; padding: 8px 10px !important; }
          .jp-brand-text { font-size: 18px !important; }
        }

        /* === RESPONSIVE: MOBILE === */
        @media (max-width: 560px) {
          .jp-canvas-container { min-height: 190px !important; border-radius: 12px !important; }
          .jp-deck-grid { gap: 4px !important; border-radius: 12px !important; max-height: 220px !important; }
          .jp-wager-input { font-size: 12px !important; padding: 5px !important; }
          .jp-multiplier-text { font-size: 2.8rem !important; }
          .jp-crashed-title { font-size: 1.8rem !important; }
          .jp-idle-text { font-size: 11px !important; }
          .jp-profile-label, .jp-rain-label, .jp-fair-label { display: none; }
          .jp-fair-btn { padding: 4px 6px !important; }
        }

        /* === RESPONSIVE: TINY PHONES (<380px) === */
        @media (max-width: 380px) {
          .jp-header { gap: 4px !important; padding: 6px 6px !important; }
          .jp-header-right { gap: 4px !important; }
          .jp-wallet-amount { display: none; }
          .jp-wallet-balance { padding: 4px 6px !important; font-size: 11px !important; }
          .jp-deposit-btn { padding: 6px 10px !important; font-size: 10px !important; }
          .jp-brand-text { font-size: 16px !important; }
          .jp-multiplier-text { font-size: 2.2rem !important; }
          .jp-crashed-title { font-size: 1.5rem !important; }
          .jp-deck-grid { max-height: 200px !important; }
        }

        /* === RESPONSIVE: LANDSCAPE MOBILE === */
        @media (max-height: 500px) and (orientation: landscape) {
          .jp-layout { padding-bottom: 48px !important; }
          .jp-canvas-container { min-height: 120px !important; }
          .jp-deck-grid { max-height: 110px !important; gap: 4px !important; padding: 4px !important; }
          .jp-deck-panel { gap: 4px !important; padding: 4px !important; }
          .jp-auto-cash-row, .jp-auto-cash-input { display: none !important; }
          .jp-bet-button, .jp-cashout-button { min-height: 40px !important; padding: 6px !important; }
          .jp-history-tape { padding: 4px 10px !important; }
          .jp-idle-text { font-size: 10px !important; margin-top: 6px !important; }
        }
      `}</style>
    </div>
  );
}

function HashLine({ label, value }) {
  return (
    <div className="jp-hash-line">
      <label className="jp-modal-label">{label}</label>
      <div className="jp-hash-box">{value || 'Unavailable'}</div>
    </div>
  );
}
