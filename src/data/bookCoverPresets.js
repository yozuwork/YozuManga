// Taiwan-edition volume 1 covers from BOOK☆WALKER TW / 博客來. Both hosts block
// hotlinking by Referer, so covers are served through the images.weserv.nl proxy.
function proxied(imagePath) {
  return `https://images.weserv.nl/?url=${imagePath}`
}

function bookWalkerCover(productId) {
  return proxied(`taiwan-image.bookwalker.com.tw/product/${productId}/${productId}_1.jpg`)
}

export const bookCoverPresets = {
  男裝女孩與嬌嬌女: bookWalkerCover(176686),
  我的推是壞人大小姐: bookWalkerCover(136141),
  關於我在無意間被隔壁的天使變成廢柴這件事: bookWalkerCover(305193),
  坂本日常: bookWalkerCover(157540),
  '無意間變成狗，被喜歡的女生撿回家': bookWalkerCover(153880),
  請聽我的聲音: bookWalkerCover(125755),
  廣井菊裡的深酒日記: bookWalkerCover(247999),
  迷宮飯: bookWalkerCover(67998),
  '歡迎回來,爸爸': bookWalkerCover(194387),
  群花綻放彷如修羅: bookWalkerCover(163651),
  銀莉的告白: bookWalkerCover(172458),
  銀荊的告白: bookWalkerCover(172458),
  天敵抗戰記: bookWalkerCover(192585),
  我想要成為影之強者: bookWalkerCover(85792),
  我想成為影之強者: bookWalkerCover(85792),
  葬送的芙莉蓮: bookWalkerCover(120580),
  shrink精神科醫生弱井: proxied('www.books.com.tw/img/001/088/49/0010884905.jpg'),
  '今泉家似乎成了辣妹聚集地~Deep~': bookWalkerCover(183035),
  女兒的朋友: bookWalkerCover(155803),
  年下學姊: bookWalkerCover(175836),
}

function normalizeTitleKey(value) {
  return value
    .normalize('NFKC')
    .replace(/[\s。.!！?？,，、「」~～]+/g, '')
    .toLocaleLowerCase('zh-TW')
}

const presetsByKey = new Map(
  Object.entries(bookCoverPresets).map(([title, url]) => [normalizeTitleKey(title), url]),
)

export function findBookCoverPreset(title = '') {
  return presetsByKey.get(normalizeTitleKey(title)) ?? ''
}
