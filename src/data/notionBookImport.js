import notionBooksCsv from '../../ExportBlock-95d87cd6-cd12-427d-833c-f203d4547d14-Part-1/無標題 2c4cbef6488581fd85c4d94057f42728_漫畫收藏庫 2c4cbef6488581d7955a000b9ee72b57.csv?raw'
import { getCurrentLocalDateTime } from '../utils/dateTime.js'

function parseCsv(source) {
  const rows = []
  let row = []
  let value = ''
  let quoted = false

  for (let index = 0; index < source.length; index += 1) {
    const character = source[index]
    const nextCharacter = source[index + 1]

    if (character === '"' && quoted && nextCharacter === '"') {
      value += '"'
      index += 1
    } else if (character === '"') {
      quoted = !quoted
    } else if (character === ',' && !quoted) {
      row.push(value)
      value = ''
    } else if ((character === '\n' || character === '\r') && !quoted) {
      if (character === '\r' && nextCharacter === '\n') index += 1
      row.push(value)
      if (row.some((cell) => cell !== '')) rows.push(row)
      row = []
      value = ''
    } else {
      value += character
    }
  }

  if (value || row.length) {
    row.push(value)
    rows.push(row)
  }

  const [headers, ...dataRows] = rows
  return dataRows.map((cells) =>
    Object.fromEntries(headers.map((header, index) => [header.trim(), cells[index]?.trim() ?? ''])),
  )
}

const chineseDigits = {
  零: 0,
  〇: 0,
  一: 1,
  二: 2,
  兩: 2,
  三: 3,
  四: 4,
  五: 5,
  六: 6,
  七: 7,
  八: 8,
  九: 9,
}

function chineseNumberToInteger(value) {
  if (!value.includes('十')) return Number([...value].map((character) => chineseDigits[character]).join(''))
  const [tens, units] = value.split('十')
  return (tens ? chineseDigits[tens] : 1) * 10 + (units ? chineseDigits[units] : 0)
}

function normalizeNumbers(value) {
  return value.replace(/[零〇一二兩三四五六七八九十]+/g, (number) =>
    String(chineseNumberToInteger(number)),
  )
}

function countVolumes(value) {
  let text = normalizeNumbers(value)
    .replace(/[，、]/g, ',')
    .replace(/[－–—~～]/g, '-')
  let count = 0

  text = text.replace(/(\d+)\s*-\s*(\d+)\s*(?:卷|冊)/g, (_, start, end) => {
    count += Math.max(0, Number(end) - Number(start) + 1)
    return ' '
  })

  text = text.replace(/(?:\d+\s*,\s*)+\d+\s*(?:卷|冊)/g, (list) => {
    count += list.match(/\d+/g)?.length ?? 0
    return ' '
  })

  text = text.replace(/(\d+)\s*(?:卷|冊)/g, (_, number) => {
    count += Number(number)
    return ' '
  })

  if (count === 0) {
    const fallback = text.match(/\d+/)
    count = fallback ? Number(fallback[0]) : 0
  }

  const missing = normalizeNumbers(value).match(/缺\s*(\d+)/)
  return Math.max(0, count - (missing ? Number(missing[1]) : 0))
}

function parseOwnedVolumes(value) {
  const markerPattern = /(台版|日版)/g
  const markers = [...value.matchAll(markerPattern)]
  const result = { tw: 0, jp: 0 }

  if (markers.length === 0) {
    result.tw = countVolumes(value)
    return result
  }

  markers.forEach((marker, index) => {
    const start = marker.index + marker[0].length
    const end = markers[index + 1]?.index ?? value.length
    const edition = marker[0] === '日版' ? 'jp' : 'tw'
    result[edition] += countVolumes(value.slice(start, end))
  })

  return result
}

function cleanText(value) {
  return value.replace(/\s+/g, ' ').trim()
}

function titleFromValue(value) {
  const title = cleanText(value)
  if (!/^https?:\/\//i.test(title)) return title

  try {
    const pathname = decodeURIComponent(new URL(title).pathname)
    return cleanText(pathname.split('/').filter(Boolean).at(-1)?.replaceAll('_', ' ') ?? title)
  } catch {
    return title
  }
}

function dateFromValue(value, fallback) {
  const matchedDate = value.match(/(\d{4})\/(\d{1,2})\/(\d{1,2})/)
  if (!matchedDate) return fallback
  const [, year, month, day] = matchedDate
  return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}T00:00`
}

function isCompleted(value) {
  return /已收完全套/.test(value) || /(?:\(完\)|（完）|\(全\)|（全）)\s*$/.test(value)
}

function normalizeTitleKey(value) {
  return cleanText(value).normalize('NFKC').toLocaleLowerCase('zh-TW')
}

function buildCandidates() {
  const now = getCurrentLocalDateTime()
  const rows = parseCsv(notionBooksCsv).filter((row) => cleanText(row['擁有卷數'] ?? ''))
  const merged = new Map()

  rows.forEach((row) => {
    const title = titleFromValue(row.Name ?? '')
    if (!title) return

    const owned = parseOwnedVolumes(cleanText(row['擁有卷數']))
    const originalTitleValue = cleanText(row['原名'] ?? '')
    const originalTitle = /^https?:\/\//i.test(originalTitleValue) ? '' : originalTitleValue
    const updateTime = dateFromValue(row['更新時間'] ?? '', now)
    const key = normalizeTitleKey(title)
    const previous = merged.get(key)

    if (previous) {
      previous.originalTitle ||= originalTitle
      previous.tw.current = Math.max(previous.tw.current, owned.tw)
      previous.jp.current = Math.max(previous.jp.current, owned.jp)
      previous.updateTime = previous.updateTime > updateTime ? previous.updateTime : updateTime
      previous.updateTimeMode = previous.updateTime === now ? 'auto' : 'manual'
      previous.isCompleted ||= isCompleted(row['擁有卷數'])
      return
    }

    merged.set(key, {
      title,
      originalTitle,
      genre: '',
      author: '',
      publisher: '',
      shelf: '',
      jp: { current: owned.jp, total: null },
      tw: { current: owned.tw, total: null },
      coverUrl: '',
      coverPosX: 50,
      coverPosY: 50,
      coverFit: 'cover',
      legacySingleEdition: false,
      progressClass: '',
      updateTime,
      updateTimeMode: updateTime === now ? 'auto' : 'manual',
      isCompleted: isCompleted(row['擁有卷數']),
    })
  })

  return [...merged.values()].map((book) => ({
    ...book,
    jp: { ...book.jp, total: book.isCompleted && book.jp.current ? book.jp.current : null },
    tw: { ...book.tw, total: book.isCompleted && book.tw.current ? book.tw.current : null },
  }))
}

export const notionBookImportCandidates = buildCandidates()
export const notionBookImportSourceCount = parseCsv(notionBooksCsv).length
