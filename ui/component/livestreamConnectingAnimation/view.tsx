import React from 'react';
import classnames from 'classnames';
import './style.scss';

// Pick a random animation variant on mount
const VARIANTS = ['signal', 'pulse-rings', 'orbit', 'waveform', 'countdown'] as const;
type Variant = (typeof VARIANTS)[number];

function pickRandom(): Variant {
  return VARIANTS[Math.floor(Math.random() * VARIANTS.length)];
}

type Props = {
  status: 'connecting' | 'requesting_permission';
  onLive?: boolean; // true when transitioning to live
};

export default function LivestreamConnectingAnimation({ status, onLive }: Props) {
  const [variant] = React.useState<Variant>(pickRandom);
  const [dots, setDots] = React.useState('');
  const [countdownValue, setCountdownValue] = React.useState(3);

  // Animated dots
  React.useEffect(() => {
    const interval = setInterval(() => {
      setDots((d) => (d.length >= 3 ? '' : d + '.'));
    }, 500);
    return () => clearInterval(interval);
  }, []);

  // Countdown timer for the countdown variant
  React.useEffect(() => {
    if (variant !== 'countdown') return;
    setCountdownValue(3);
    const interval = setInterval(() => {
      setCountdownValue((v) => (v > 1 ? v - 1 : 3));
    }, 1000);
    return () => clearInterval(interval);
  }, [variant]);

  const message =
    status === 'requesting_permission'
      ? __('Activating camera') + dots
      : __('Going live') + dots;

  if (onLive) {
    // Smooth reveal: content shrinks away, overlay dissolves, subtle glow appears
    return (
      <div className="livestream-connecting livestream-connecting--live-reveal">
        <div className="livestream-connecting__live-badge">
          {__('LIVE')}
        </div>
      </div>
    );
  }

  return (
    <div className="livestream-connecting">
      <div className="livestream-connecting__content">
        <div className={`livestream-connecting__anim livestream-connecting__anim--${variant}`}>
          {variant === 'signal' && <SignalAnimation />}
          {variant === 'pulse-rings' && <PulseRingsAnimation />}
          {variant === 'orbit' && <OrbitAnimation />}
          {variant === 'waveform' && <WaveformAnimation />}
          {variant === 'countdown' && <CountdownAnimation value={countdownValue} />}
        </div>
        <p className="livestream-connecting__message">{message}</p>
      </div>
    </div>
  );
}

// ---- Animation variants ----

function SignalAnimation() {
  return (
    <div className="signal-anim">
      <svg width="64" height="64" viewBox="0 0 64 64" fill="none">
        {/* Center dot */}
        <circle cx="32" cy="32" r="4" fill="currentColor" className="signal-anim__dot" />
        {/* Expanding signal arcs */}
        <circle cx="32" cy="32" r="14" stroke="currentColor" strokeWidth="2" fill="none" className="signal-anim__ring signal-anim__ring--1" />
        <circle cx="32" cy="32" r="22" stroke="currentColor" strokeWidth="1.5" fill="none" className="signal-anim__ring signal-anim__ring--2" />
        <circle cx="32" cy="32" r="30" stroke="currentColor" strokeWidth="1" fill="none" className="signal-anim__ring signal-anim__ring--3" />
      </svg>
    </div>
  );
}

function PulseRingsAnimation() {
  return (
    <div className="pulse-rings-anim">
      <div className="pulse-rings-anim__center">
        <svg width="28" height="28" viewBox="0 0 24 24" fill="currentColor">
          <path d="M23 7l-7 5 7 5V7z" />
          <rect x="1" y="5" width="15" height="14" rx="2" ry="2" />
        </svg>
      </div>
      <div className="pulse-rings-anim__ring pulse-rings-anim__ring--1" />
      <div className="pulse-rings-anim__ring pulse-rings-anim__ring--2" />
      <div className="pulse-rings-anim__ring pulse-rings-anim__ring--3" />
    </div>
  );
}

function OrbitAnimation() {
  return (
    <div className="orbit-anim">
      <div className="orbit-anim__center" />
      <div className="orbit-anim__track orbit-anim__track--1">
        <div className="orbit-anim__particle" />
      </div>
      <div className="orbit-anim__track orbit-anim__track--2">
        <div className="orbit-anim__particle" />
      </div>
      <div className="orbit-anim__track orbit-anim__track--3">
        <div className="orbit-anim__particle" />
      </div>
    </div>
  );
}

function WaveformAnimation() {
  return (
    <div className="waveform-anim">
      {[0, 1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
        <div
          key={i}
          className="waveform-anim__bar"
          style={{ animationDelay: `${i * 0.08}s` }}
        />
      ))}
    </div>
  );
}

function CountdownAnimation({ value }: { value: number }) {
  return (
    <div className="countdown-anim">
      <svg width="72" height="72" viewBox="0 0 72 72">
        {/* Background circle */}
        <circle cx="36" cy="36" r="30" fill="none" stroke="currentColor" strokeWidth="2" opacity="0.15" />
        {/* Animated progress arc */}
        <circle
          cx="36"
          cy="36"
          r="30"
          fill="none"
          stroke="currentColor"
          strokeWidth="3"
          strokeLinecap="round"
          strokeDasharray={`${2 * Math.PI * 30}`}
          className="countdown-anim__arc"
        />
      </svg>
      <span className="countdown-anim__number" key={value}>
        {value}
      </span>
    </div>
  );
}
