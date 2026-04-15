import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs';
import { join } from 'path';
import { homedir } from 'os';

const CACHE_DIR = join(homedir(), '.op-cli', 'cache');
const BASE_URL = 'https://raw.githubusercontent.com/buhbbl/punk-records/main/english';
const ANIME_API = 'https://www.onepieceapi.com/api';
const CACHE_TTL_MS = 1000 * 60 * 60 * 24; // 24 hours

function ensureCacheDir() {
  if (!existsSync(CACHE_DIR)) {
    mkdirSync(CACHE_DIR, { recursive: true });
  }
}

function getCachePath(key) {
  return join(CACHE_DIR, `${key}.json`);
}

function readCache(key) {
  const path = getCachePath(key);
  if (!existsSync(path)) return null;
  try {
    const raw = readFileSync(path, 'utf8');
    const { data, ts } = JSON.parse(raw);
    if (Date.now() - ts > CACHE_TTL_MS) return null;
    return data;
  } catch {
    return null;
  }
}

function writeCache(key, data) {
  ensureCacheDir();
  writeFileSync(getCachePath(key), JSON.stringify({ data, ts: Date.now() }));
}

async function fetchJSON(url, cacheKey) {
  if (cacheKey) {
    const cached = readCache(cacheKey);
    if (cached) return cached;
  }
  const res = await fetch(url);
  if (!res.ok) throw new Error(`HTTP ${res.status}: ${url}`);
  const data = await res.json();
  if (cacheKey) writeCache(cacheKey, data);
  return data;
}

export async function getCardById(cardId) {
  // First try the index
  const index = await getCardsIndex();
  const info = index[cardId];
  if (!info) return null;

  // Fetch full card details
  const packId = info.pack_id;
  const url = `${BASE_URL}/cards/${packId}/${cardId}.json`;
  return fetchJSON(url, `card_${cardId}`);
}

export async function getCardsIndex() {
  return fetchJSON(`${BASE_URL}/index/cards_by_id.json`, 'cards_by_id');
}

export async function getByNameIndex() {
  return fetchJSON(`${BASE_URL}/index/by_name.json`, 'by_name');
}

export async function getPacks() {
  return fetchJSON(`${BASE_URL}/packs.json`, 'packs');
}

export async function searchCardsByName(query) {
  const nameIndex = await getByNameIndex();
  const cardsIndex = await getCardsIndex();

  const normalized = query.toLowerCase().replace(/[^a-z0-9]/g, '');

  // Exact key match
  const exactIds = nameIndex[normalized] || [];

  // Partial matches
  const partialKeys = Object.keys(nameIndex).filter(
    k => k !== normalized && k.includes(normalized)
  );
  const partialIds = partialKeys.flatMap(k => nameIndex[k]);

  const allIds = [...new Set([...exactIds, ...partialIds])];

  return allIds.map(id => ({ id, ...cardsIndex[id] })).filter(Boolean);
}

export async function getCardsInSet(setCode) {
  const index = await getCardsIndex();
  const upperCode = setCode.toUpperCase();
  return Object.entries(index)
    .filter(([id]) => id.startsWith(upperCode + '-'))
    .map(([id, info]) => ({ id, ...info }));
}

export async function getAnimeCharacters() {
  return fetchJSON(`${ANIME_API}/characters`, 'anime_characters');
}

export async function getAnimeDevilFruits() {
  return fetchJSON(`${ANIME_API}/devil-fruits`, 'anime_devil_fruits');
}
