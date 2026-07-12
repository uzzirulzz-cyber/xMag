'use client'

import { Tv, Film, Clapperboard } from 'lucide-react'
import { ChannelsAndPackages } from './channels-and-packages'

export function LiveStreamsView() {
  return <ContentShell icon={Tv} title="Live Streams" subtitle="Browse all live TV channels across every package." type="live" />
}
export function MoviesView() {
  return <ContentShell icon={Film} title="Movies & VOD" subtitle="On-demand movies — Hollywood, Bollywood, 4K and more." type="vod" />
}
export function SeriesView() {
  return <ContentShell icon={Clapperboard} title="Series & Shows" subtitle="TV series — English, Hindi, Turkish, Arabic and more." type="series" />
}

function ContentShell({
  icon: Icon,
  title,
  subtitle,
  type,
}: {
  icon: React.ElementType
  title: string
  subtitle: string
  type: string
}) {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10 text-primary">
          <Icon className="h-6 w-6" />
        </span>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">{title}</h1>
          <p className="text-sm text-muted-foreground">{subtitle}</p>
        </div>
      </div>
      <ChannelsAndPackages forceType={type} />
    </div>
  )
}
