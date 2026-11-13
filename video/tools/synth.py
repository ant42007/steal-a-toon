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
}
MELODY = {
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
