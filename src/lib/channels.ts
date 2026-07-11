import { db } from '@/lib/db'

export interface ChannelSeed {
  name: string
  type: 'live' | 'vod' | 'series'
  category: string
  country: string
  logoText: string
  color: string
  epgNow: string
  epgNext: string
  currentViewers: number
  hd: boolean
}

export interface PackageSeed {
  name: string
  type: 'live' | 'vod' | 'series'
  description: string
  color: string
  icon: string
  channels: ChannelSeed[]
}

/**
 * Seed packages (bouquets) and channels with realistic viewer counts.
 * Channel names are representative of real IPTV lineups; viewer counts
 * simulate concurrent connections from the reseller's client lines.
 */
export async function ensurePackagesAndChannels() {
  const pkgCount = await db.package.count()
  if (pkgCount > 0) return

  for (let i = 0; i < PACKAGES.length; i++) {
    const p = PACKAGES[i]
    const channels = p.channels
    const created = await db.package.create({
      data: {
        name: p.name,
        type: p.type,
        description: p.description,
        color: p.color,
        icon: p.icon,
        channelCount: channels.length,
        sortOrder: i + 1,
      },
    })
    for (let j = 0; j < channels.length; j++) {
      const c = channels[j]
      await db.channel.create({
        data: {
          packageId: created.id,
          name: c.name,
          type: c.type,
          category: c.category,
          country: c.country,
          logoText: c.logoText,
          color: c.color,
          epgNow: c.epgNow,
          epgNext: c.epgNext,
          streamUrl: `http://stariptv.pk:8080/live/line/{username}/{password}/${j + 1}.ts`,
          currentViewers: c.currentViewers,
          hd: c.hd,
          sortOrder: j + 1,
        },
      })
    }
  }
}

// ── Colour palette per category ──
const C = {
  sports: '#16a34a',
  news: '#dc2626',
  entertainment: '#7c3aed',
  movies: '#0891b2',
  kids: '#ea580c',
  documentary: '#0d9488',
  music: '#db2777',
  religious: '#65a30d',
}

const PACKAGES: PackageSeed[] = [
  {
    name: 'Pakistani Channels',
    type: 'live',
    description: 'All major Pakistani TV channels — news, drama, sports and entertainment.',
    color: '#16a34a',
    icon: 'Flag',
    channels: [
      { name: 'ARY Digital', type: 'live', category: 'Entertainment', country: 'PK', logoText: 'ARY', color: C.entertainment, epgNow: 'Mere Humnasheen', epgNext: 'Bhool', currentViewers: 184, hd: true },
      { name: 'Geo Entertainment', type: 'live', category: 'Entertainment', country: 'PK', logoText: 'GEO', color: C.entertainment, epgNow: 'Tere Bin', epgNext: 'Khaani', currentViewers: 156, hd: true },
      { name: 'Hum TV', type: 'live', category: 'Entertainment', country: 'PK', logoText: 'HUM', color: C.entertainment, epgNow: 'Sinf-e-Aahan', epgNext: 'Yunhi', currentViewers: 142, hd: true },
      { name: 'PTV Sports', type: 'live', category: 'Sports', country: 'PK', logoText: 'PTV', color: C.sports, epgNow: 'Live: PAK vs AUS T20', epgNext: 'Cricket Show', currentViewers: 412, hd: true },
      { name: 'Geo News', type: 'live', category: 'News', country: 'PK', logoText: 'GN', color: C.news, epgNow: 'Aaj Shahzeb Khanzada Kay Sath', epgNext: 'Capital Talk', currentViewers: 98, hd: true },
      { name: 'ARY News', type: 'live', category: 'News', country: 'PK', logoText: 'AN', color: C.news, epgNow: 'Live with Dr Shahid Masood', epgNext: 'Off the Record', currentViewers: 87, hd: true },
      { name: 'Dunya News', type: 'live', category: 'News', country: 'PK', logoText: 'DN', color: C.news, epgNow: 'Dunya Kamran Khan Kay Sath', epgNext: 'Hasb e Haal', currentViewers: 64, hd: true },
      { name: 'Samaa TV', type: 'live', category: 'News', country: 'PK', logoText: 'SM', color: C.news, epgNow: 'Nadeem Malik Live', epgNext: 'Awam Ki Awaz', currentViewers: 52, hd: true },
      { name: 'Express Entertainment', type: 'live', category: 'Entertainment', country: 'PK', logoText: 'EX', color: C.entertainment, epgNow: 'Dastaan', epgNext: 'Qurban', currentViewers: 38, hd: false },
      { name: 'Bol Entertainment', type: 'live', category: 'Entertainment', country: 'PK', logoText: 'BOL', color: C.entertainment, epgNow: 'Bol Nights', epgNext: 'Game Show', currentViewers: 45, hd: true },
      { name: 'PTV Home', type: 'live', category: 'Entertainment', country: 'PK', logoText: 'PTV', color: C.entertainment, epgNow: 'Drama Hour', epgNext: 'News', currentViewers: 29, hd: false },
      { name: 'Madani Channel', type: 'live', category: 'Religious', country: 'PK', logoText: 'MD', color: C.religious, epgNow: 'Sehratul Mustaqeem', epgNext: 'Dars-e-Quran', currentViewers: 18, hd: false },
    ],
  },
  {
    name: 'Indian Channels',
    type: 'live',
    description: 'Top Indian entertainment, sports and news channels.',
    color: '#dc2626',
    icon: 'Tv',
    channels: [
      { name: 'Star Plus', type: 'live', category: 'Entertainment', country: 'IN', logoText: 'SP', color: C.entertainment, epgNow: 'Anupamaa', epgNext: 'Yeh Rishta', currentViewers: 234, hd: true },
      { name: 'Sony TV', type: 'live', category: 'Entertainment', country: 'IN', logoText: 'SNY', color: C.entertainment, epgNow: 'CID', epgNext: 'Indian Idol', currentViewers: 198, hd: true },
      { name: 'Colors TV', type: 'live', category: 'Entertainment', country: 'IN', logoText: 'CL', color: C.entertainment, epgNow: 'Bigg Boss', epgNext: 'Udaariyaan', currentViewers: 176, hd: true },
      { name: 'Zee TV', type: 'live', category: 'Entertainment', country: 'IN', logoText: 'ZEE', color: C.entertainment, epgNow: 'Kumkum Bhagya', epgNext: 'Kundali', currentViewers: 165, hd: true },
      { name: 'Star Sports 1', type: 'live', category: 'Sports', country: 'IN', logoText: 'SS', color: C.sports, epgNow: 'Live: IND vs ENG ODI', epgNext: 'Cricket Live', currentViewers: 521, hd: true },
      { name: 'Sony Ten 1', type: 'live', category: 'Sports', country: 'IN', logoText: 'T1', color: C.sports, epgNow: 'Live: WWE Raw', epgNext: 'Wrestling', currentViewers: 287, hd: true },
      { name: 'Aaj Tak', type: 'live', category: 'News', country: 'IN', logoText: 'AT', color: C.news, epgNow: 'Dangal', epgNext: 'Halla Bol', currentViewers: 89, hd: true },
      { name: 'NDTV India', type: 'live', category: 'News', country: 'IN', logoText: 'ND', color: C.news, epgNow: 'Prime Time', epgNext: 'Muqabla', currentViewers: 67, hd: true },
      { name: 'Star Gold', type: 'live', category: 'Movies', country: 'IN', logoText: 'SG', color: C.movies, epgNow: 'Bahubali 2', epgNext: 'Dangal', currentViewers: 143, hd: true },
      { name: 'Zee Cinema', type: 'live', category: 'Movies', country: 'IN', logoText: 'ZC', color: C.movies, epgNow: '3 Idiots', epgNext: 'PK', currentViewers: 112, hd: true },
      { name: 'Cartoon Network', type: 'live', category: 'Kids', country: 'IN', logoText: 'CN', color: C.kids, epgNow: 'Tom & Jerry', epgNext: 'Ben 10', currentViewers: 76, hd: true },
      { name: 'Pogo', type: 'live', category: 'Kids', country: 'IN', logoText: 'PG', color: C.kids, epgNow: 'Chhota Bheem', epgNext: 'Mighty Raju', currentViewers: 54, hd: false },
    ],
  },
  {
    name: 'UK & USA Channels',
    type: 'live',
    description: 'Premium English-language channels from the UK and United States.',
    color: '#0891b2',
    icon: 'Globe',
    channels: [
      { name: 'Sky Sports Main Event', type: 'live', category: 'Sports', country: 'UK', logoText: 'SKY', color: C.sports, epgNow: 'Live: Premier League', epgNext: 'Football Show', currentViewers: 398, hd: true },
      { name: 'Sky Sports Cricket', type: 'live', category: 'Sports', country: 'UK', logoText: 'SKY', color: C.sports, epgNow: 'Live: The Ashes', epgNext: 'Cricket Debate', currentViewers: 245, hd: true },
      { name: 'BT Sport 1', type: 'live', category: 'Sports', country: 'UK', logoText: 'BT', color: C.sports, epgNow: 'Live: UFC', epgNext: 'Boxing', currentViewers: 178, hd: true },
      { name: 'BBC One', type: 'live', category: 'Entertainment', country: 'UK', logoText: 'BBC', color: C.entertainment, epgNow: 'EastEnders', epgNext: 'BBC News', currentViewers: 134, hd: true },
      { name: 'BBC News', type: 'live', category: 'News', country: 'UK', logoText: 'BBC', color: C.news, epgNow: 'World News', epgNext: 'Business Live', currentViewers: 102, hd: true },
      { name: 'Sky News', type: 'live', category: 'News', country: 'UK', logoText: 'SN', color: C.news, epgNow: 'Press Preview', epgNext: 'The World', currentViewers: 91, hd: true },
      { name: 'ESPN', type: 'live', category: 'Sports', country: 'US', logoText: 'ESP', color: C.sports, epgNow: 'Live: NFL', epgNext: 'SportsCenter', currentViewers: 312, hd: true },
      { name: 'Fox Sports 1', type: 'live', category: 'Sports', country: 'US', logoText: 'FS1', color: C.sports, epgNow: 'Live: MLB', epgNext: 'Skip & Shannon', currentViewers: 198, hd: true },
      { name: 'CNN', type: 'live', category: 'News', country: 'US', logoText: 'CNN', color: C.news, epgNow: 'Anderson Cooper 360', epgNext: 'Situation Room', currentViewers: 87, hd: true },
      { name: 'Fox News', type: 'live', category: 'News', country: 'US', logoText: 'FN', color: C.news, epgNow: 'Tucker Carlson', epgNext: 'Hannity', currentViewers: 76, hd: true },
      { name: 'AMC', type: 'live', category: 'Movies', country: 'US', logoText: 'AMC', color: C.movies, epgNow: 'The Walking Dead', epgNext: 'Better Call Saul', currentViewers: 89, hd: true },
      { name: 'HBO', type: 'live', category: 'Movies', country: 'US', logoText: 'HBO', color: C.movies, epgNow: 'House of the Dragon', epgNext: 'Succession', currentViewers: 167, hd: true },
      { name: 'Showtime', type: 'live', category: 'Movies', country: 'US', logoText: 'SHO', color: C.movies, epgNow: 'Yellowjackets', epgNext: 'Billions', currentViewers: 56, hd: true },
      { name: 'Disney Channel', type: 'live', category: 'Kids', country: 'US', logoText: 'DIS', color: C.kids, epgNow: 'Bluey', epgNext: 'Miraculous', currentViewers: 84, hd: true },
    ],
  },
  {
    name: 'Arabic Channels',
    type: 'live',
    description: 'Arabic entertainment, news, sports and religious channels.',
    color: '#ea580c',
    icon: 'Globe2',
    channels: [
      { name: 'beIN Sports 1 HD', type: 'live', category: 'Sports', country: 'AR', logoText: 'b1', color: C.sports, epgNow: 'Live: AFC Champions League', epgNext: 'Sports News', currentViewers: 367, hd: true },
      { name: 'beIN Sports 2 HD', type: 'live', category: 'Sports', country: 'AR', logoText: 'b2', color: C.sports, epgNow: 'Live: La Liga', epgNext: 'Match Analysis', currentViewers: 234, hd: true },
      { name: 'Al Jazeera', type: 'live', category: 'News', country: 'AR', logoText: 'AJ', color: C.news, epgNow: 'News Hour', epgNext: 'Inside Story', currentViewers: 145, hd: true },
      { name: 'Al Arabiya', type: 'live', category: 'News', country: 'AR', logoText: 'AA', color: C.news, epgNow: 'Bulletins', epgNext: 'Documentary', currentViewers: 98, hd: true },
      { name: 'MBC 1', type: 'live', category: 'Entertainment', country: 'AR', logoText: 'MBC', color: C.entertainment, epgNow: 'Arab Idol', epgNext: 'Drama', currentViewers: 123, hd: true },
      { name: 'MBC 2', type: 'live', category: 'Movies', country: 'AR', logoText: 'MBC', color: C.movies, epgNow: 'Fast & Furious 7', epgNext: 'Jurassic World', currentViewers: 89, hd: true },
      { name: 'MBC Action', type: 'live', category: 'Movies', country: 'AR', logoText: 'MBC', color: C.movies, epgNow: 'Mission Impossible', epgNext: 'John Wick', currentViewers: 67, hd: true },
      { name: 'MBC3', type: 'live', category: 'Kids', country: 'AR', logoText: 'MBC', color: C.kids, epgNow: 'Bakra Qisto', epgNext: 'Cartoons', currentViewers: 45, hd: false },
      { name: 'Al Majd Quran', type: 'live', category: 'Religious', country: 'AR', logoText: 'MQ', color: C.religious, epgNow: 'Tilawat', epgNext: 'Tafseer', currentViewers: 34, hd: false },
      { name: 'Saudi TV', type: 'live', category: 'Entertainment', country: 'AR', logoText: 'ST', color: C.entertainment, epgNow: 'Drama', epgNext: 'News', currentViewers: 28, hd: true },
    ],
  },
  {
    name: 'Sports Pack',
    type: 'live',
    description: 'Dedicated sports package — cricket, football, UFC, wrestling and more.',
    color: '#16a34a',
    icon: 'Trophy',
    channels: [
      { name: 'Sky Sports Premier League', type: 'live', category: 'Sports', country: 'UK', logoText: 'SKY', color: C.sports, epgNow: 'Live: Man City vs Arsenal', epgNext: 'PL Review', currentViewers: 445, hd: true },
      { name: 'Sky Sports F1', type: 'live', category: 'Sports', country: 'UK', logoText: 'F1', color: C.sports, epgNow: 'Live: Grand Prix', epgNext: 'F1 Show', currentViewers: 198, hd: true },
      { name: 'beIN Sports 3', type: 'live', category: 'Sports', country: 'AR', logoText: 'b3', color: C.sports, epgNow: 'Live: Serie A', epgNext: 'Highlights', currentViewers: 156, hd: true },
      { name: 'Willow Cricket', type: 'live', category: 'Sports', country: 'US', logoText: 'WL', color: C.sports, epgNow: 'Live: BBL', epgNext: 'Cricket Wrap', currentViewers: 234, hd: true },
      { name: 'Tennis Channel', type: 'live', category: 'Sports', country: 'US', logoText: 'TC', color: C.sports, epgNow: 'Live: ATP Finals', epgNext: 'Tennis Talk', currentViewers: 67, hd: true },
      { name: 'Eurosport 1', type: 'live', category: 'Sports', country: 'UK', logoText: 'ES', color: C.sports, epgNow: 'Live: Tour de France', epgNext: 'Cycling', currentViewers: 89, hd: true },
      { name: 'WWE Network', type: 'live', category: 'Sports', country: 'US', logoText: 'WWE', color: C.sports, epgNow: 'Live: Raw', epgNext: 'SmackDown', currentViewers: 167, hd: true },
      { name: 'OSN Sports', type: 'live', category: 'Sports', country: 'AR', logoText: 'OSN', color: C.sports, epgNow: 'Live: NBA', epgNext: 'NBA Jam', currentViewers: 112, hd: true },
    ],
  },
  {
    name: 'Movies & VOD',
    type: 'vod',
    description: 'On-demand movies — Hollywood, Bollywood and regional cinema.',
    color: '#7c3aed',
    icon: 'Film',
    channels: [
      { name: 'Netflix Movies', type: 'vod', category: 'Movies', country: 'US', logoText: 'NF', color: C.movies, epgNow: 'Extraction 2', epgNext: 'Red Notice', currentViewers: 312, hd: true },
      { name: 'Prime Video', type: 'vod', category: 'Movies', country: 'US', logoText: 'PV', color: C.movies, epgNow: 'The Tomorrow War', epgNext: 'Air', currentViewers: 198, hd: true },
      { name: 'Disney+ Hotstar', type: 'vod', category: 'Movies', country: 'IN', logoText: 'D+', color: C.movies, epgNow: 'Pathaan', epgNext: 'Jawan', currentViewers: 245, hd: true },
      { name: 'HBO Max', type: 'vod', category: 'Movies', country: 'US', logoText: 'MAX', color: C.movies, epgNow: 'Dune', epgNext: 'The Batman', currentViewers: 178, hd: true },
      { name: '4K UHD Movies', type: 'vod', category: 'Movies', country: 'US', logoText: '4K', color: C.movies, epgNow: 'Avatar 2', epgNext: 'Top Gun Maverick', currentViewers: 134, hd: true },
      { name: 'Bollywood Classics', type: 'vod', category: 'Movies', country: 'IN', logoText: 'BC', color: C.movies, epgNow: 'Sholay', epgNext: 'Deewar', currentViewers: 89, hd: false },
      { name: 'Lollywood Movies', type: 'vod', category: 'Movies', country: 'PK', logoText: 'LL', color: C.movies, epgNow: 'The Legend of Maula Jatt', epgNext: 'Joyland', currentViewers: 67, hd: true },
      { name: 'Arabic Cinema', type: 'vod', category: 'Movies', country: 'AR', logoText: 'AC', color: C.movies, epgNow: 'Wadjda', epgNext: 'The Square', currentViewers: 34, hd: false },
      { name: 'Animation Movies', type: 'vod', category: 'Kids', country: 'US', logoText: 'AN', color: C.kids, epgNow: 'Spider-Verse', epgNext: 'Elemental', currentViewers: 76, hd: true },
      { name: 'Documentary Vault', type: 'vod', category: 'Documentary', country: 'UK', logoText: 'DV', color: C.documentary, epgNow: 'Planet Earth II', epgNext: 'Blue Planet', currentViewers: 45, hd: true },
    ],
  },
  {
    name: 'Series & Shows',
    type: 'series',
    description: 'Binge-worthy TV series — English, Hindi, Turkish and Arabic.',
    color: '#db2777',
    icon: 'Clapperboard',
    channels: [
      { name: 'Netflix Series', type: 'series', category: 'Entertainment', country: 'US', logoText: 'NF', color: C.entertainment, epgNow: 'Stranger Things S5', epgNext: 'Wednesday', currentViewers: 287, hd: true },
      { name: 'HBO Series', type: 'series', category: 'Entertainment', country: 'US', logoText: 'HBO', color: C.entertainment, epgNow: 'House of the Dragon', epgNext: 'The Last of Us', currentViewers: 234, hd: true },
      { name: 'Turkish Series', type: 'series', category: 'Entertainment', country: 'AR', logoText: 'TR', color: C.entertainment, epgNow: 'Dirilis Ertugrul', epgNext: 'Kurulus Osman', currentViewers: 198, hd: true },
      { name: 'Hindi Series', type: 'series', category: 'Entertainment', country: 'IN', logoText: 'HS', color: C.entertainment, epgNow: 'Sacred Games', epgNext: 'Mirzapur', currentViewers: 167, hd: true },
      { name: 'Pakistani Dramas', type: 'series', category: 'Entertainment', country: 'PK', logoText: 'PD', color: C.entertainment, epgNow: 'Tere Bin', epgNext: 'Mere Paas Tum Ho', currentViewers: 134, hd: true },
      { name: 'Anime Series', type: 'series', category: 'Entertainment', country: 'IN', logoText: 'AN', color: C.entertainment, epgNow: 'One Piece', epgNext: 'Demon Slayer', currentViewers: 112, hd: true },
      { name: 'K-Drama', type: 'series', category: 'Entertainment', country: 'IN', logoText: 'KD', color: C.entertainment, epgNow: 'Squid Game', epgNext: 'All of Us Are Dead', currentViewers: 89, hd: true },
      { name: 'Arabic Series', type: 'series', category: 'Entertainment', country: 'AR', logoText: 'AS', color: C.entertainment, epgNow: 'Bab Al Hara', epgNext: 'Al Hayba', currentViewers: 56, hd: true },
    ],
  },
]
