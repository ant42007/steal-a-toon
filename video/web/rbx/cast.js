// Recurring cast for every Roblox story. LEO IS THE MAIN CHARACTER OF EVERY VIDEO:
// always build him with CAST.leo() (or one of his outfit variants) so he looks the same everywhere.
// His voice lives in video/scripts/cast-voices.json ("LEO").
import { makeAvatar, rng } from './avatar.js';

const SKIN = '#f3d2b1';
export const LEO_LOOK = {
  skin: SKIN, scale: 0.82, seed: 11, hair: 'swoop', hairColor: '#4a2c19',
  shirt: { kind: 'hoodie', color: '#2f7de1', accent: '#f4f4f4' },
  pants: { kind: 'jeans', color: '#3b5a8c', shoes: '#f2f2f2', sole: '#d9d9d9' },
};

export const CAST = {
  // --- Leo (main character, every video) ---
  leo: (o = {}) => makeAvatar({ ...LEO_LOOK, ...o }),
  leoPJ: (o = {}) => makeAvatar({ ...LEO_LOOK, shirt: { kind: 'pajama', color: '#5d8fd8', accent: '#ffffff' }, pants: { kind: 'pjpants', color: '#5d8fd8', shoes: '#5d8fd8', sole: '#5d8fd8' }, ...o }),
  // --- supporting cast (THE NUMBERS) ---
  ellie: (o = {}) => makeAvatar({ skin: SKIN, scale: 0.68, seed: 21, hair: 'pigtails', hairColor: '#8a4a26', number: '21',
    shirt: { kind: 'dress', color: '#ff8fc2', graphic: 'heart', accent: '#ff3d7f' }, pants: { kind: 'skirt', color: '#9b59d0', shoes: '#ff5ca8', sole: '#ffffff', socks: '#ffffff' }, ...o }),
  elliePJ: (o = {}) => makeAvatar({ skin: SKIN, scale: 0.68, seed: 21, hair: 'pigtails', hairColor: '#8a4a26', number: '21',
    shirt: { kind: 'pajama', color: '#f7a8cf', accent: '#ffffff' }, pants: { kind: 'pjpants', color: '#f7a8cf', shoes: '#f7a8cf', sole: '#f7a8cf' }, ...o }),
  mom: (o = {}) => makeAvatar({ skin: '#f0c8a4', seed: 31, hair: 'bob', hairColor: '#3d2618', number: '4,000,112',
    shirt: { kind: 'sweater', color: '#c85a7c' }, pants: { kind: 'slacks', color: '#3b3f5c', shoes: '#2b2b2b' }, ...o }),
  mailman: (o = {}) => makeAvatar({ skin: '#c98e6a', seed: 41, hair: 'cap', capColor: '#2a3f8f', hairColor: '#1d1d1d', number: '17',
    shirt: { kind: 'uniform', color: '#9cc6ea', accent: '#2a3f8f' }, pants: { kind: 'slacks', color: '#2a3f6f', shoes: '#1d1d1d' }, ...o }),
  driver: (o = {}) => makeAvatar({ skin: '#8d5a3b', seed: 51, hair: 'curly', hairColor: '#1b1b1b', number: '18',
    shirt: { kind: 'tee', color: '#6c7a89', graphic: 'stripe', accent: '#f5b800' }, pants: { kind: 'jeans', color: '#2f3d55', shoes: '#3b2a1e' }, ...o }),
  guard: (o = {}) => makeAvatar({ skin: '#f0c8a4', seed: 61, hair: 'bun', hairColor: '#b9b9b9', number: '19',
    shirt: { kind: 'vest', color: '#ff7a1a', inner: '#f4f4f4' }, pants: { kind: 'slacks', color: '#30343c', shoes: '#1d1d1d' }, ...o }),
  scientist: (o = {}) => makeAvatar({ skin: '#e2b08a', seed: 71, hair: 'bald', hairColor: '#8a8a8a', face: { glasses: true },
    shirt: { kind: 'labcoat', color: '#f4f4f4', inner: '#9cc6ea', accent: '#c0392b' }, pants: { kind: 'slacks', color: '#3c3c44', shoes: '#1d1d1d' }, ...o }),
  townie: (i, number) => {
    const R = rng(300 + i);
    const shirts = [
      { kind: 'tee', color: '#e74c3c', graphic: 'star', accent: '#ffd23f' }, { kind: 'hoodie', color: '#27ae60', accent: '#f4f4f4' },
      { kind: 'tee', color: '#f1c40f', graphic: 'stripe', accent: '#1d1d1d' }, { kind: 'suit', color: '#1f2a44', inner: '#f4f4f4', accent: '#c0392b' },
      { kind: 'hoodie', color: '#8e44ad', accent: '#f4f4f4' }, { kind: 'tee', color: '#1abc9c', graphic: 'heart', accent: '#ffffff' },
      { kind: 'sweater', color: '#e67e22' }, { kind: 'tee', color: '#ecf0f1', graphic: 'star', accent: '#3498db' },
      { kind: 'suit', color: '#7a1f2b', inner: '#f4f4f4', accent: '#1d1d1d' }, { kind: 'hoodie', color: '#34495e', accent: '#f4f4f4' },
    ];
    const pants = [{ kind: 'jeans', color: '#3b5a8c', shoes: '#f2f2f2' }, { kind: 'slacks', color: '#2b2b2b', shoes: '#111' }, { kind: 'jeans', color: '#4a6fa5', shoes: '#c0392b' }, { kind: 'shorts', color: '#c8a46e', shoes: '#ffffff' }, { kind: 'skirt', color: '#2c3e50', shoes: '#111' }];
    const hairs = ['spiky', 'long', 'curly', 'swoop', 'bob', 'cap', 'pigtails', 'bun'];
    const skins = ['#f3d2b1', '#e2b08a', '#c98e6a', '#8d5a3b', '#f0c8a4', '#6b4430'];
    const hairCols = ['#2a1d16', '#c49a63', '#111111', '#8a3b1f', '#d9c37a', '#5a3825'];
    return makeAvatar({ skin: skins[Math.floor(R() * skins.length)], shirt: shirts[i % shirts.length], pants: pants[i % pants.length],
      hair: hairs[i % hairs.length], hairColor: hairCols[i % hairCols.length], seed: 400 + i, number, scale: i % 4 === 3 ? 0.8 : 1, capColor: '#c0392b' });
  },
};
