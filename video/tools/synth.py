"""Procedural sound: crack SFX, ambience and the background score. numpy only, deterministic."""
import numpy as np

SR = 48000


def _t(dur):
    return np.arange(int(dur * SR)) / SR


def _norm(x, peak):
    m = np.max(np.abs(x)) or 1.0
    return x * (peak / m)


def _lowpass(x, cutoff):
    """Cheap FIR low-pass (windowed sinc)."""
    n = 101
    k = np.arange(n) - (n - 1) / 2
    h = np.sinc(2 * cutoff / SR * k) * np.hamming(n)
    h /= h.sum()
    return np.convolve(x, h, mode="same")


def _highpass(x, cutoff):
    return x - _lowpass(x, cutoff)


def crack(seed=1, size=1.0):
    """A ceramic 'crack': sharp transient, crackle run, low thump, glassy ring."""
    rng = np.random.default_rng(seed)
    dur = 0.7
    t = _t(dur)
    out = np.zeros_like(t)
    # transient
    out += _highpass(rng.standard_normal(len(t)), 1500) * np.exp(-t / 0.004) * 1.0
    # crackle: a run of tiny clicks that speeds up then stops
    tc = 0.0
    for i in range(14):
        tc += rng.uniform(0.006, 0.022)
        i0 = int(tc * SR)
        n = int(0.003 * SR)
        if i0 + n >= len(t):
            break
        burst = rng.standard_normal(n) * np.exp(-np.arange(n) / (0.0008 * SR))
        out[i0:i0 + n] += np.diff(np.concatenate([[0], burst])) * (0.9 - i * 0.05)
    # thump
    f = 95 * np.exp(-t / 0.15) + 45
    out += np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t / 0.07) * 0.55 * size
    # glassy ring
    for fr, a in [(2310, 0.10), (3470, 0.07), (5120, 0.05)]:
        out += np.sin(2 * np.pi * fr * t) * np.exp(-t / 0.10) * a
    return _norm(out, 0.9 * size)


def tick(seed=7):
    rng = np.random.default_rng(seed)
    t = _t(0.25)
    out = np.zeros_like(t)
    tc = 0.0
    for i in range(4):
        tc += rng.uniform(0.01, 0.03)
        i0 = int(tc * SR)
        n = int(0.002 * SR)
        burst = rng.standard_normal(n) * np.exp(-np.arange(n) / (0.0006 * SR))
        out[i0:i0 + n] += np.diff(np.concatenate([[0], burst]))
    out += np.sin(2 * np.pi * 2900 * t) * np.exp(-t / 0.05) * 0.05
    return _norm(out, 0.35)


def _bell(freq, dur, decay):
    t = _t(dur)
    s = np.zeros_like(t)
    for k, a in [(1, 1.0), (2.76, 0.35), (5.4, 0.18), (8.93, 0.08)]:
        s += a * np.sin(2 * np.pi * freq * k * t) * np.exp(-t * k / decay)
    return s * np.minimum(1, t / 0.003)


def chime(dur=2.4):
    """Ascending golden shimmer (E major arpeggio, bell partials)."""
    out = np.zeros(int(dur * SR))
    for i, midi in enumerate([76, 80, 83, 88, 92]):
        f = 440 * 2 ** ((midi - 69) / 12)
        b = _bell(f, dur, 1.4)
        i0 = int(i * 0.055 * SR)
        out[i0:] += b[: len(out) - i0] * (0.5 - i * 0.05)
    return _norm(out, 0.45)


def goldcrack():
    c = crack(seed=3, size=0.75)
    ch = chime()
    out = np.zeros(max(len(c), len(ch)))
    out[: len(c)] += c
    out[: len(ch)] += ch
    return _norm(out, 0.9)


def shimmer(dur):
    """Soft rising sparkle bed for the golden-crack reveal."""
    t = _t(dur)
    rng = np.random.default_rng(11)
    out = np.zeros_like(t)
    for i in range(int(dur * 9)):
        midi = rng.choice([76, 78, 80, 83, 85, 88, 90, 92])
        f = 440 * 2 ** ((midi - 69) / 12)
        i0 = int(rng.uniform(0, dur - 0.3) * SR)
        b = _bell(f, 1.2, 0.9) * rng.uniform(0.05, 0.12)
        n = min(len(b), len(out) - i0)
        out[i0:i0 + n] += b[:n]
    env = np.minimum(1, t / (dur * 0.6))
    return out * env * 0.6


def monitor(dur, period=0.9):
    """Hospital heart-monitor beeps."""
    out = np.zeros(int(dur * SR))
    bt = _t(0.11)
    beep = np.sin(2 * np.pi * 1046 * bt) * np.minimum(1, bt / 0.004) * np.minimum(1, (0.11 - bt) / 0.02)
    k = 0.25
    while k < dur - 0.12:
        i0 = int(k * SR)
        out[i0:i0 + len(beep)] += beep
        k += period
    return out * 0.10


def hum(dur):
    """Fridge hum + a faint fluorescent buzz."""
    t = _t(dur)
    s = (np.sin(2 * np.pi * 60 * t) * 0.6 + np.sin(2 * np.pi * 120 * t) * 0.35
         + np.sin(2 * np.pi * 180 * t) * 0.12)
    s *= 1 + 0.05 * np.sin(2 * np.pi * 0.7 * t)
    fade = np.minimum(1, np.minimum(t / 0.6, (dur - t) / 0.4))
    return s * fade * 0.045


def door_thunk():
    t = _t(0.35)
    rng = np.random.default_rng(5)
    f = 140 * np.exp(-t / 0.05) + 60
    s = np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t / 0.06)
    s += _lowpass(rng.standard_normal(len(t)), 900) * np.exp(-t / 0.03) * 0.8
    return _norm(s, 0.35)


def despawn(seed=1):
    """Soft 'poof': airy noise swell + descending sparkle (no game sounds, all synthesized)."""
    rng = np.random.default_rng(seed)
    dur = 1.3
    t = _t(dur)
    air = _lowpass(rng.standard_normal(len(t)), 3500) * np.exp(-t / 0.25) * np.minimum(1, t / 0.02)
    out = air * 0.6
    for i, midi in enumerate([93, 88, 84, 81, 76]):
        f = 440 * 2 ** ((midi - 69) / 12)
        b = _bell(f, dur, 0.7) * (0.35 - i * 0.04)
        i0 = int((0.03 + i * 0.045) * SR)
        out[i0:] += b[: len(out) - i0]
    thump = np.sin(2 * np.pi * np.cumsum(120 * np.exp(-t / 0.08) + 50) / SR) * np.exp(-t / 0.06) * 0.5
    return _norm(out + thump, 0.85)


def spawn_in():
    """Rising shimmer for appearing on the spawn pad."""
    dur = 2.4
    out = np.zeros(int(dur * SR))
    for i, midi in enumerate([72, 76, 79, 84, 88, 91, 96]):
        f = 440 * 2 ** ((midi - 69) / 12)
        b = _bell(f, dur, 1.2) * 0.32
        i0 = int(i * 0.07 * SR)
        out[i0:] += b[: len(out) - i0]
    t = _t(dur)
    sweep = np.sin(2 * np.pi * np.cumsum(300 + 900 * np.minimum(1, t / 0.6)) / SR) * np.exp(-t / 0.5) * 0.12
    return _norm(out + sweep, 0.8)


def reveal():
    """The twist sting: low boom + dissonant high cluster that hangs."""
    dur = 3.0
    t = _t(dur)
    boom = np.sin(2 * np.pi * np.cumsum(70 * np.exp(-t / 0.4) + 35) / SR) * np.exp(-t / 0.7)
    cl = sum(np.sin(2 * np.pi * f * t) for f in (987.8, 1046.5, 1108.7)) * np.exp(-t / 1.4) * 0.08
    cl *= np.minimum(1, t / 0.15)
    return _norm(boom * 0.9 + cl, 0.85)


def heartbeat(n=2, period=0.85):
    dur = n * period + 0.4
    out = np.zeros(int(dur * SR))
    bt = _t(0.18)
    def thud(f0):
        return np.sin(2 * np.pi * np.cumsum(f0 * np.exp(-bt / 0.05) + 40) / SR) * np.exp(-bt / 0.05)
    for k in range(n):
        for off, f0, g in ((0.0, 70, 1.0), (0.22, 60, 0.7)):
            i0 = int((k * period + off) * SR)
            out[i0:i0 + len(bt)] += thud(f0) * g
    return _norm(out, 0.8)


def scribble(seed=1, dur=0.35):
    """Pen strike across paper."""
    rng = np.random.default_rng(seed)
    t = _t(dur)
    n = _highpass(rng.standard_normal(len(t)), 2000)
    env = np.minimum(1, t / 0.02) * np.minimum(1, (dur - t) / 0.05) * (0.6 + 0.4 * np.sin(2 * np.pi * 14 * t) ** 2)
    return _norm(n * env, 0.3)


def crickets(dur):
    t = _t(dur)
    out = np.zeros_like(t)
    for f, rate, ph in ((4300, 2.1, 0.0), (4700, 1.7, 0.4)):
        chirp = (np.sin(2 * np.pi * rate * t + ph) > 0.6).astype(float)
        trill = 0.5 + 0.5 * np.sin(2 * np.pi * 32 * t)
        out += np.sin(2 * np.pi * f * t) * chirp * trill
    fade = np.minimum(1, np.minimum(t / 0.8, (dur - t) / 0.8))
    return out * fade * 0.018


# ---------------------------------------------------------------- music

def _midi(n):
    return 440 * 2 ** ((n - 69) / 12)


def _piano(freq, dur, vel):
    t = _t(dur)
    s = np.zeros_like(t)
    for k in range(1, 7):
        s += (1 / k ** 1.6) * np.sin(2 * np.pi * freq * k * t * (1 + 0.0004 * k * k)) * np.exp(-t * (0.9 + 0.6 * k) / 1.0)
    att = np.minimum(1, t / 0.006)
    rel = np.minimum(1, (dur - t) / 0.08)
    return s * att * rel * vel


def _pad(freqs, dur):
    t = _t(dur)
    s = np.zeros_like(t)
    for f in freqs:
        for det in (-0.0015, 0.0015):
            s += np.sin(2 * np.pi * f * (1 + det) * t) + 0.25 * np.sin(2 * np.pi * 2 * f * (1 + det) * t)
    env = np.minimum(1, np.minimum(t / 0.9, (dur - t) / 0.9))
    return s * env / (len(freqs) * 2)


# chord = (bass midi, [chord tones midi])
SECTIONS = {
    "main":    [(45, [57, 60, 64]), (41, [57, 60, 65]), (48, [55, 60, 64]), (43, [55, 59, 62])],   # Am F C G
    "swell":   [(41, [57, 60, 65]), (43, [55, 59, 62]), (40, [55, 59, 64]), (45, [57, 60, 64])],   # F G Em Am
    "resolve": [(41, [57, 60, 65]), (43, [55, 59, 62]), (48, [55, 60, 64]), (48, [55, 60, 64, 62])],  # F G C Cadd9
    "mystery": [(38, [57, 62, 65]), (34, [58, 62, 65]), (41, [57, 60, 65]), (45, [57, 61, 64])],      # Dm Bb F A
    "tense":   [(38, [57, 62, 65]), (39, [58, 63, 67]), (38, [57, 62, 65]), (37, [56, 61, 64])],      # Dm Eb Dm C#dim-ish
    "sorrow":  [(34, [58, 62, 65]), (41, [57, 60, 65]), (36, [55, 60, 64]), (38, [57, 62, 65])],      # Bb F C Dm
    "hope":    [(41, [57, 60, 65]), (36, [55, 60, 64]), (38, [57, 62, 65]), (34, [58, 62, 65, 69])],  # F C Dm Bbmaj7
}
MELODY = {
    "mystery": [None, 74, None, 72, 69, None, None, 73, None, 74, None, 77, 76, None, None, None],
    "hope": [None, 72, 77, None, 76, None, 74, 72, None, 69, 72, None, 74, None, None, None],
    "swell": [None, 76, 77, None, 74, None, 76, 79, None, 76, 71, None, 72, None, None, None],
    "resolve": [None, 77, 76, None, 74, None, 79, None, 76, None, None, 74, 76, None, None, None],
}


def score(section, dur, bpm=70):
    """Soft felt-piano arpeggios + pad. Returns mono float array of length dur."""
    beat = 60 / bpm
    bar = beat * 4
    out = np.zeros(int((dur + 4) * SR))
    prog = SECTIONS[section]
    nbars = int(np.ceil(dur / bar)) + 1
    mel = MELODY.get(section)
    for b in range(nbars):
        bass, tones = prog[b % len(prog)]
        t0 = b * bar
        # pad
        p = _pad([_midi(n) for n in tones], bar + 0.9)
        i0 = int(t0 * SR)
        n = min(len(p), len(out) - i0)
        if n > 0:
            out[i0:i0 + n] += p[:n] * 0.10
        # arpeggio in 8ths: bass, 5th, tones...
        pattern = [bass, bass + 7, tones[0], tones[1], tones[2], tones[1], tones[0], bass + 12]
        for k, m in enumerate(pattern):
            ts = t0 + k * beat / 2
            if ts > dur:
                break
            vel = 0.22 if k == 0 else 0.13
            nn = _piano(_midi(m), 2.2, vel)
            j0 = int(ts * SR)
            n = min(len(nn), len(out) - j0)
            out[j0:j0 + n] += nn[:n]
        if mel:
            for k in range(2):
                m = mel[(b * 2 + k) % len(mel)]
                if m is None:
                    continue
                ts = t0 + k * bar / 2
                if ts > dur:
                    break
                nn = _piano(_midi(m), 2.6, 0.11)
                j0 = int(ts * SR)
                n = min(len(nn), len(out) - j0)
                out[j0:j0 + n] += nn[:n]
    return out[: int(dur * SR)]
