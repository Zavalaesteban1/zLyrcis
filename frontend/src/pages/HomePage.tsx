import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import styled, { keyframes, createGlobalStyle, css } from 'styled-components';
import { getUserVideos, extractSpotifyTrackId, getSpotifyAlbumArtwork, VideoJob } from '../services/api';
import { useUser } from '../contexts/UserContext';
import { CgProfile } from 'react-icons/cg';
import { MdAdd, MdCheckCircle, MdMusicNote, MdPlayArrow, MdAutoAwesome } from 'react-icons/md';
import { IconAgentOrbit } from '../components/icons/IconAgentOrbit';
import { BsMusicNoteList, BsSpotify, BsLightningCharge, BsBarChartLine } from 'react-icons/bs';
import { FiTrendingUp, FiChevronRight } from 'react-icons/fi';
import { AiOutlineClockCircle } from 'react-icons/ai';
import { IoSchool } from 'react-icons/io5';
import { ProfileDropdown } from '../components/profile/ProfileDropdown';
import { AppSidebar } from '../components/layout/AppSidebar';
import { AppLayout } from '../styles/AppLayoutStyles';
import { APP_SIDEBAR_WIDTH } from '../constants/layout';

// ─── Global keyframes ─────────────────────────────────────────────────────────

const GlobalStyle = createGlobalStyle`
  @keyframes pulse {
    0%, 100% { opacity: 0.4; }
    50% { opacity: 0.8; }
  }
  @keyframes fadeIn {
    from { opacity: 0; }
    to { opacity: 1; }
  }
  @keyframes barPulse {
    0%, 100% { transform: scaleY(0.5); }
    50% { transform: scaleY(1); }
  }
  @keyframes spin {
    from { transform: rotate(0deg); }
    to { transform: rotate(360deg); }
  }
`;

const rotate = keyframes`from { transform: rotate(0deg); } to { transform: rotate(360deg); }`;
const barBounce = keyframes`0%, 100% { transform: scaleY(0.45); } 50% { transform: scaleY(1); }`;
const shimmer = keyframes`0% { background-position: -400px 0; } 100% { background-position: 400px 0; }`;

// ─── Layout ────────────────────────────────────────────────────────────────────

const MainContent = styled.main`
  flex: 1;
  margin-left: ${APP_SIDEBAR_WIDTH}px;
  padding: 36px 48px 56px;
  width: calc(100% - ${APP_SIDEBAR_WIDTH}px);
  max-width: 100%;
  transition: all 0.2s ease;

  @media (max-width: 1200px) { padding: 28px 32px 48px; }
  @media (max-width: 768px) { margin-left: 0; width: 100%; padding: 20px 16px 40px; }
`;

const PageHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 32px;
  flex-wrap: wrap;
  gap: 12px;
  @media (max-width: 768px) { margin-bottom: 24px; }
`;

const PageTitle = styled.h1`
  font-size: 26px;
  font-weight: 700;
  color: #1a1a2e;
  margin: 0;
  letter-spacing: -0.3px;
  @media (max-width: 768px) { font-size: 22px; }
`;

const UserActions = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
`;

const HomeContainer = styled.div`
  display: flex;
  flex-direction: column;
  width: 100%;
  max-width: 100%;
  gap: 32px;
`;

// ─── Shared card base ──────────────────────────────────────────────────────────

const PremiumCard = styled.div`
  background: #ffffff;
  border-radius: 20px;
  box-shadow: 0 2px 20px rgba(0, 0, 0, 0.055);
  border: 1px solid rgba(0, 0, 0, 0.042);
  padding: 28px;
  width: 100%;
`;

// ─── HERO CARD — Split layout ──────────────────────────────────────────────────

const HeroCard = styled.div`
  border-radius: 24px;
  width: 100%;
  background: linear-gradient(135deg, #1db954 0%, #128f40 55%, #0e7233 100%);
  color: white;
  box-shadow: 0 16px 48px rgba(29, 185, 84, 0.3), 0 2px 8px rgba(0, 0, 0, 0.06);
  position: relative;
  overflow: hidden;
  display: grid;
  grid-template-columns: 1fr 340px;

  /* Decorative orbs */
  &::before {
    content: '';
    position: absolute;
    top: -50px; right: -50px;
    width: 260px; height: 260px;
    background: rgba(255, 255, 255, 0.06);
    border-radius: 50%;
    pointer-events: none;
  }
  &::after {
    content: '';
    position: absolute;
    bottom: -70px; left: 35%;
    width: 200px; height: 200px;
    background: rgba(255, 255, 255, 0.04);
    border-radius: 50%;
    pointer-events: none;
  }

  @media (max-width: 1100px) { grid-template-columns: 1fr; }
  @media (max-width: 768px) { border-radius: 18px; }
`;

// Left half — welcome + metrics + CTA
const HeroLeft = styled.div`
  padding: 44px 48px;
  display: flex;
  flex-direction: column;
  justify-content: center;
  position: relative;
  z-index: 1;

  @media (max-width: 1100px) { padding: 36px 40px 28px; }
  @media (max-width: 768px) { padding: 28px 24px 24px; }
`;

const WelcomeLabel = styled.span`
  display: inline-block;
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 1.8px;
  text-transform: uppercase;
  opacity: 0.72;
  margin-bottom: 10px;
`;

const WelcomeTitle = styled.h2`
  font-size: 28px;
  font-weight: 800;
  margin: 0 0 12px;
  letter-spacing: -0.4px;
  line-height: 1.2;
  @media (max-width: 768px) { font-size: 22px; }
`;

const WelcomeText = styled.p`
  font-size: 15px;
  line-height: 1.65;
  margin: 0 0 24px;
  opacity: 0.88;
  max-width: 480px;
  @media (max-width: 768px) { font-size: 14px; margin-bottom: 20px; }
`;

// Inline learning metric pills inside hero
const HeroMetrics = styled.div`
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
  margin-bottom: 28px;
  @media (max-width: 768px) { margin-bottom: 22px; }
`;

const MetricPill = styled.div`
  display: flex;
  align-items: center;
  gap: 6px;
  background: rgba(255, 255, 255, 0.15);
  backdrop-filter: blur(8px);
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 50px;
  padding: 7px 14px;
  font-size: 13px;
  font-weight: 600;
`;

const MetricPillIcon = styled.span`
  opacity: 0.85;
  display: flex;
  align-items: center;
`;

const ActionButton = styled(Link)`
  display: inline-flex;
  align-items: center;
  gap: 8px;
  background-color: #ffffff;
  color: #1db954;
  border: none;
  border-radius: 50px;
  padding: 13px 28px;
  font-size: 14px;
  font-weight: 700;
  text-decoration: none;
  cursor: pointer;
  transition: transform 0.18s ease, box-shadow 0.18s ease;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.14);
  position: relative;
  z-index: 1;
  width: fit-content;

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 8px 24px rgba(0, 0, 0, 0.18);
  }

  @media (max-width: 768px) { padding: 11px 22px; font-size: 13px; }
`;

// Right half — Continue Learning module
const HeroRight = styled.div`
  padding: 32px 36px 32px 0;
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
  z-index: 1;

  @media (max-width: 1100px) {
    padding: 0 40px 36px;
    justify-content: flex-start;
  }
  @media (max-width: 768px) { padding: 0 24px 28px; }
`;

const ContinueLearningPanel = styled.div`
  background: rgba(0, 0, 0, 0.18);
  backdrop-filter: blur(12px);
  border: 1px solid rgba(255, 255, 255, 0.15);
  border-radius: 20px;
  padding: 24px;
  width: 100%;
  max-width: 280px;
  display: flex;
  flex-direction: column;
  gap: 16px;

  @media (max-width: 1100px) { max-width: 360px; }
`;

const CLPanelLabel = styled.span`
  font-size: 10px;
  font-weight: 700;
  letter-spacing: 1.6px;
  text-transform: uppercase;
  opacity: 0.65;
`;

const CLAlbumRow = styled.div`
  display: flex;
  align-items: center;
  gap: 14px;
`;

const CLAlbumArt = styled.div<{ hasImage: boolean }>`
  width: 64px;
  height: 64px;
  border-radius: 12px;
  flex-shrink: 0;
  overflow: hidden;
  background: ${p => p.hasImage ? 'transparent' : 'rgba(255,255,255,0.12)'};
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.25);
`;

const CLAlbumImg = styled.img`
  width: 100%;
  height: 100%;
  object-fit: cover;
`;

const CLSongInfo = styled.div`
  flex: 1;
  min-width: 0;
`;

const CLSongTitle = styled.div`
  font-size: 14px;
  font-weight: 700;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  margin-bottom: 3px;
`;

const CLArtist = styled.div`
  font-size: 12px;
  opacity: 0.72;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`;

const CLProgressBar = styled.div`
  width: 100%;
`;

const CLProgressLabel = styled.div`
  display: flex;
  justify-content: space-between;
  font-size: 11px;
  opacity: 0.7;
  margin-bottom: 6px;
`;

const CLTrack = styled.div`
  height: 4px;
  background: rgba(255, 255, 255, 0.2);
  border-radius: 4px;
  overflow: hidden;
`;

const CLFill = styled.div<{ pct: number }>`
  height: 100%;
  width: ${p => p.pct}%;
  background: rgba(255, 255, 255, 0.85);
  border-radius: 4px;
  transition: width 0.6s ease;
`;

const CLActions = styled.div`
  display: flex;
  gap: 10px;
`;

const CLBtn = styled(Link)`
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  background: rgba(255, 255, 255, 0.18);
  border: 1px solid rgba(255, 255, 255, 0.22);
  border-radius: 50px;
  padding: 9px 16px;
  font-size: 12px;
  font-weight: 700;
  color: white;
  text-decoration: none;
  transition: background 0.18s ease, transform 0.15s ease;

  &:hover {
    background: rgba(255, 255, 255, 0.28);
    transform: translateY(-1px);
  }
`;

// Ambient music bars animation
const MusicBars = styled.div`
  display: flex;
  align-items: flex-end;
  gap: 3px;
  height: 18px;
  opacity: 0.7;
`;

const Bar = styled.div<{ delay: string; height: string }>`
  width: 3px;
  height: ${p => p.height};
  background: rgba(255, 255, 255, 0.8);
  border-radius: 2px;
  transform-origin: bottom;
  animation: ${barBounce} 1s ease-in-out ${p => p.delay} infinite;
`;

const CLEmptyMsg = styled.div`
  font-size: 13px;
  opacity: 0.72;
  text-align: center;
  padding: 8px 0;
  line-height: 1.5;
`;

// ─── Dashboard grid ────────────────────────────────────────────────────────────

const DashboardGrid = styled.div`
  display: grid;
  grid-template-columns: 3fr 1fr;
  gap: 24px;
  width: 100%;

  @media (max-width: 1200px) { grid-template-columns: 1fr; }
  @media (max-width: 768px) { gap: 16px; }
`;

// ─── Recent Activity card ──────────────────────────────────────────────────────

const RecentActivityCard = styled(PremiumCard)`
  grid-column: span 2;
  @media (max-width: 1200px) { grid-column: span 1; }
`;

const SectionHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 20px;
`;

const SectionTitle = styled.h3`
  font-size: 16px;
  font-weight: 700;
  color: #1a1a2e;
  margin: 0;
  display: flex;
  align-items: center;
  gap: 8px;
  letter-spacing: -0.1px;
`;

const SectionIcon = styled.span`
  color: #1db954;
  display: flex;
  align-items: center;
`;

const SeeAllLink = styled(Link)`
  font-size: 13px;
  font-weight: 600;
  color: #1db954;
  text-decoration: none;
  display: flex;
  align-items: center;
  gap: 2px;
  &:hover { text-decoration: underline; }
`;

const ActivityGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(1, 1fr);
  gap: 12px;

  @media (min-width: 1100px) { grid-template-columns: repeat(2, 1fr); }
`;

const ActivityCard = styled.div`
  display: flex;
  align-items: center;
  padding: 14px 16px;
  border-radius: 14px;
  background: #f8f9fb;
  border: 1px solid rgba(0, 0, 0, 0.046);
  transition: transform 0.18s ease, box-shadow 0.18s ease;
  cursor: default;
  gap: 14px;

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 6px 24px rgba(0, 0, 0, 0.09);
  }
`;

const ActivityArt = styled.div`
  width: 52px;
  height: 52px;
  border-radius: 10px;
  overflow: hidden;
  background: #e4e8ef;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #b8c0cc;
  flex-shrink: 0;
`;

const ActivityImg = styled.img`
  width: 100%;
  height: 100%;
  object-fit: cover;
`;

const ActivityBody = styled.div`
  flex: 1;
  min-width: 0;
`;

const ActivityTitle2 = styled.div`
  font-size: 14px;
  font-weight: 700;
  color: #1a1a2e;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  margin-bottom: 3px;
`;

const ActivityArtist = styled.div`
  font-size: 12px;
  color: #7a7f8a;
  font-weight: 500;
  margin-bottom: 6px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`;

const ActivityMeta = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
`;

const ActivityDate = styled.span`
  font-size: 11px;
  color: #b0b8c4;
  display: flex;
  align-items: center;
  gap: 3px;
`;

const LearnedBadge = styled.span`
  font-size: 11px;
  color: #1db954;
  font-weight: 700;
  background: rgba(29, 185, 84, 0.1);
  padding: 2px 8px;
  border-radius: 20px;
  display: flex;
  align-items: center;
  gap: 3px;
`;

const MiniProgress = styled.div`
  width: 60px;
  height: 3px;
  background: #e4e8ef;
  border-radius: 3px;
  overflow: hidden;
  flex-shrink: 0;
`;

const MiniProgressFill = styled.div<{ pct: number }>`
  height: 100%;
  width: ${p => p.pct}%;
  background: #1db954;
  border-radius: 3px;
`;

const SongImage = styled.img`width: 100%; height: 100%; object-fit: cover;`;

// ─── Stats card (tile grid) ────────────────────────────────────────────────────

const StatsCard = styled(PremiumCard)``;

const StatsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 12px;
`;

const StatTile = styled.div`
  background: #f8f9fb;
  border: 1px solid rgba(0, 0, 0, 0.044);
  border-radius: 14px;
  padding: 16px 14px;
  display: flex;
  flex-direction: column;
  gap: 6px;
`;

const StatTileIcon = styled.div`
  color: #1db954;
  display: flex;
  align-items: center;
  margin-bottom: 4px;
`;

const StatTileValue = styled.div`
  font-size: 22px;
  font-weight: 800;
  color: #1a1a2e;
  letter-spacing: -0.5px;
  line-height: 1;
`;

const StatTileLabel = styled.div`
  font-size: 11px;
  font-weight: 600;
  color: #9499a4;
  text-transform: uppercase;
  letter-spacing: 0.5px;
`;

// ─── Quick Actions (Creator Tools) ────────────────────────────────────────────

const QuickActionsCard = styled(PremiumCard)``;

const CreatorGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 10px;
  @media (min-width: 1400px) { grid-template-columns: repeat(4, 1fr); }
`;

const CreatorTool = styled(Link)`
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  padding: 18px 16px;
  background: #f8f9fb;
  border: 1px solid rgba(0, 0, 0, 0.046);
  border-radius: 16px;
  text-decoration: none;
  color: #1a1a2e;
  transition: transform 0.18s ease, box-shadow 0.18s ease, border-color 0.18s ease;
  gap: 12px;

  &:hover {
    transform: translateY(-3px);
    box-shadow: 0 10px 28px rgba(0, 0, 0, 0.09);
    border-color: rgba(29, 185, 84, 0.22);
  }
`;

const ToolIconWrap = styled.div`
  width: 40px;
  height: 40px;
  border-radius: 12px;
  background: rgba(29, 185, 84, 0.1);
  display: flex;
  align-items: center;
  justify-content: center;
  color: #1db954;
`;

const ToolName = styled.div`
  font-size: 13px;
  font-weight: 700;
  color: #1a1a2e;
`;

const ToolDesc = styled.div`
  font-size: 11px;
  color: #9499a4;
  font-weight: 500;
  line-height: 1.4;
`;

// ─── Empty state ───────────────────────────────────────────────────────────────

const EmptyState = styled.div`
  padding: 40px 24px;
  text-align: center;
  color: #9499a4;
`;

const EmptyStateIcon = styled.div`
  font-size: 44px;
  margin-bottom: 16px;
  color: #c8d0da;
  display: flex;
  align-items: center;
  justify-content: center;
`;

const EmptyStateText = styled.p`
  font-size: 15px;
  margin: 0 0 22px;
  color: #9499a4;
`;

// ─── Discovery Section ─────────────────────────────────────────────────────────

const DiscoverySection = styled.div`
  display: flex;
  flex-direction: column;
  gap: 32px;
`;

const CarouselBlock = styled.div``;

const CarouselHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 16px;
`;

const CarouselTitle = styled.h3`
  font-size: 16px;
  font-weight: 700;
  color: #1a1a2e;
  margin: 0;
  display: flex;
  align-items: center;
  gap: 8px;
`;

const CarouselTitleIcon = styled.span`
  color: #1db954;
  display: flex;
  align-items: center;
`;

const CarouselScroll = styled.div`
  display: flex;
  gap: 14px;
  overflow-x: auto;
  padding-bottom: 8px;
  scrollbar-width: none;
  -ms-overflow-style: none;
  &::-webkit-scrollbar { display: none; }
`;

const CarouselCard = styled.div`
  flex: 0 0 160px;
  background: #ffffff;
  border: 1px solid rgba(0, 0, 0, 0.044);
  border-radius: 16px;
  overflow: hidden;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.05);
  transition: transform 0.18s ease, box-shadow 0.18s ease;
  cursor: default;

  &:hover {
    transform: translateY(-4px);
    box-shadow: 0 12px 32px rgba(0, 0, 0, 0.1);
  }
`;

const CarouselArt = styled.div`
  width: 100%;
  aspect-ratio: 1;
  background: #e4e8ef;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #b8c0cc;
  overflow: hidden;
  position: relative;
`;

const CarouselArtImg = styled.img`
  width: 100%;
  height: 100%;
  object-fit: cover;
`;

const CarouselCardBody = styled.div`
  padding: 12px 12px 14px;
`;

const CarouselCardTitle = styled.div`
  font-size: 13px;
  font-weight: 700;
  color: #1a1a2e;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  margin-bottom: 3px;
`;

const CarouselCardSub = styled.div`
  font-size: 11px;
  color: #9499a4;
  font-weight: 500;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  margin-bottom: 8px;
`;

const CarouselBadge = styled.span<{ variant?: 'learned' | 'new' | 'ai' }>`
  display: inline-flex;
  align-items: center;
  gap: 3px;
  font-size: 10px;
  font-weight: 700;
  padding: 3px 8px;
  border-radius: 20px;
  background: ${p =>
    p.variant === 'learned'
      ? 'rgba(29,185,84,0.1)'
      : p.variant === 'ai'
      ? 'rgba(99,102,241,0.1)'
      : 'rgba(245,158,11,0.1)'};
  color: ${p =>
    p.variant === 'learned'
      ? '#1db954'
      : p.variant === 'ai'
      ? '#6366f1'
      : '#f59e0b'};
`;

const CarouselEmptyCard = styled.div`
  flex: 0 0 160px;
  height: 214px;
  border-radius: 16px;
  background: linear-gradient(135deg, #f3f4f6, #e9ebef);
  border: 1px dashed rgba(0, 0, 0, 0.1);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 8px;
  color: #b0b8c4;
  font-size: 12px;
  font-weight: 500;
  text-align: center;
  padding: 16px;
`;

// ─── Extended type ─────────────────────────────────────────────────────────────

interface SongWithLearningData extends VideoJob {
  learned: boolean;
  lastPracticed?: string | null;
  difficultyRating?: number | null;
}

// ─── Sub-components ────────────────────────────────────────────────────────────

const RecentActivityItem: React.FC<{ song: SongWithLearningData; albumCover: string | null }> = ({ song, albumCover }) => {
  const learnPct = song.learned ? 100 : song.difficultyRating ? Math.min(song.difficultyRating * 20, 90) : 0;
  return (
    <ActivityCard>
      <ActivityArt>
        {albumCover
          ? <ActivityImg src={albumCover} alt={song.song_title} />
          : MdMusicNote({ size: 24 })}
      </ActivityArt>
      <ActivityBody>
        <ActivityTitle2>{song.song_title}</ActivityTitle2>
        <ActivityArtist>{song.artist || 'Unknown Artist'}</ActivityArtist>
        <ActivityMeta>
          <ActivityDate>
            {AiOutlineClockCircle({ size: 11 })} {new Date(song.created_at).toLocaleDateString()}
          </ActivityDate>
          {song.learned && (
            <LearnedBadge>
              {MdCheckCircle({ size: 10 })} Learned
            </LearnedBadge>
          )}
        </ActivityMeta>
      </ActivityBody>
      {learnPct > 0 && (
        <MiniProgress>
          <MiniProgressFill pct={learnPct} />
        </MiniProgress>
      )}
    </ActivityCard>
  );
};

interface CarouselSongCardProps {
  song: SongWithLearningData;
  albumCover: string | null;
  badge?: 'learned' | 'new' | 'ai';
  badgeLabel?: string;
}

const CarouselSongCard: React.FC<CarouselSongCardProps> = ({ song, albumCover, badge = 'new', badgeLabel }) => (
  <CarouselCard>
    <CarouselArt>
      {albumCover
        ? <CarouselArtImg src={albumCover} alt={song.song_title} />
        : MdMusicNote({ size: 28 })}
    </CarouselArt>
    <CarouselCardBody>
      <CarouselCardTitle>{song.song_title}</CarouselCardTitle>
      <CarouselCardSub>{song.artist || 'Unknown Artist'}</CarouselCardSub>
      <CarouselBadge variant={badge}>{badgeLabel || (badge === 'learned' ? '✓ Learned' : badge === 'ai' ? '✦ AI' : '↻ In Progress')}</CarouselBadge>
    </CarouselCardBody>
  </CarouselCard>
);

// ─── Page component ────────────────────────────────────────────────────────────

const HomePage: React.FC = () => {
  const { userData } = useUser();
  const [songs, setSongs] = useState<SongWithLearningData[]>([]);
  const [loading, setLoading] = useState(true);
  const [albumCovers, setAlbumCovers] = useState<{ [key: string]: string | null }>({});
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Fetch songs when component mounts
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const videosData = await getUserVideos();

        // Add learning data from localStorage
        const songsWithLearningData: SongWithLearningData[] = videosData.map(video => {
          const learningData = JSON.parse(localStorage.getItem(`song_learning_${video.id}`) || 'null');
          return {
            ...video,
            learned: learningData?.learned || false,
            lastPracticed: learningData?.lastPracticed || null,
            difficultyRating: learningData?.difficultyRating || null,
          };
        });

        // Sort songs by creation date (newest first)
        const sortedSongs = songsWithLearningData.sort(
          (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        );

        setSongs(sortedSongs);

        // Fetch album covers — extended to 8 to support discovery carousels
        const recentSongs = sortedSongs.slice(0, 8);
        const coverPromises = recentSongs.map(async song => {
          try {
            if (song.spotify_url) {
              const trackId = extractSpotifyTrackId(song.spotify_url);
              if (trackId) {
                const coverUrl = await getSpotifyAlbumArtwork(trackId);
                return { id: song.id, coverUrl };
              }
            }
            return { id: song.id, coverUrl: null };
          } catch (error) {
            console.error('Error fetching album cover:', error);
            return { id: song.id, coverUrl: null };
          }
        });

        const covers = await Promise.all(coverPromises);
        const coverMap = covers.reduce((acc, { id, coverUrl }) => {
          acc[id] = coverUrl;
          return acc;
        }, {} as { [key: string]: string | null });

        setAlbumCovers(coverMap);
        setLoading(false);
      } catch (error) {
        console.error('Error fetching data:', error);
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // ─── Stats calculations (ALL PRESERVED) ──────────────────────────────────────

  const getVideosCreated = (): number => songs.length;

  const getTotalDuration = (): number => songs.length * 180;

  const getSongsLearned = (): number => songs.filter(s => s.learned).length;

  const getLearningProgress = (): number => {
    if (songs.length === 0) return 0;
    return Math.round((getSongsLearned() / songs.length) * 100);
  };

  const getMemberSince = (): string => {
    if (!userData?.created_at) return 'N/A';
    return new Date(userData.created_at).toLocaleDateString();
  };

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);
    if (diffMins < 60) return `${diffMins} minute${diffMins !== 1 ? 's' : ''} ago`;
    if (diffHours < 24) return `${diffHours} hour${diffHours !== 1 ? 's' : ''} ago`;
    if (diffDays < 7) return `${diffDays} day${diffDays !== 1 ? 's' : ''} ago`;
    return date.toLocaleDateString();
  };

  // ─── Derived data for discovery sections ─────────────────────────────────────

  const unlearnedSongs = songs.filter(s => !s.learned);
  const learnedSongs = songs.filter(s => s.learned);
  // Most recent unlearned song for the hero "Continue Learning" module
  const continueSong = unlearnedSongs[0] || null;
  const continueSongCover = continueSong ? (albumCovers[continueSong.id] ?? null) : null;
  const continuePct = continueSong?.difficultyRating ? Math.min(continueSong.difficultyRating * 20, 90) : 15;

  // ─── Loading ──────────────────────────────────────────────────────────────────

  if (loading) {
    return (
      <>
        <GlobalStyle />
        <AppLayout>
          <AppSidebar isOpen={sidebarOpen} onToggle={() => setSidebarOpen(v => !v)} onClose={() => setSidebarOpen(false)} />
          <MainContent>
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '80vh' }} />
          </MainContent>
        </AppLayout>
      </>
    );
  }

  // ─── Full render ──────────────────────────────────────────────────────────────

  return (
    <>
      <GlobalStyle />
      <AppLayout>
        <AppSidebar
          isOpen={sidebarOpen}
          onToggle={() => setSidebarOpen(v => !v)}
          onClose={() => setSidebarOpen(false)}
        />

        <MainContent>
          {/* ── Page header ── */}
          <PageHeader>
            <PageTitle>Dashboard</PageTitle>
            <UserActions>
              <ProfileDropdown userData={userData} />
            </UserActions>
          </PageHeader>

          <HomeContainer>
            {/* ── HERO — split: welcome left / continue learning right ── */}
            <HeroCard>
              <HeroLeft>
                <WelcomeLabel>Overview</WelcomeLabel>
                <WelcomeTitle>Welcome back, {userData?.name || 'User'}!</WelcomeTitle>
                <WelcomeText>
                  {songs.length > 0
                    ? `You have created ${songs.length} lyric video${songs.length !== 1 ? 's' : ''} and learned ${getSongsLearned()} song${getSongsLearned() !== 1 ? 's' : ''}. Keep up the great work!`
                    : 'Create beautiful lyric videos from your favorite Spotify tracks with just a few clicks.'}
                  {getLearningProgress() > 0 && ` Your learning progress is at ${getLearningProgress()}%.`}
                </WelcomeText>

                {/* Inline learning metric pills */}
                {songs.length > 0 && (
                  <HeroMetrics>
                    <MetricPill>
                      <MetricPillIcon>{BsMusicNoteList({ size: 13 })}</MetricPillIcon>
                      {getVideosCreated()} video{getVideosCreated() !== 1 ? 's' : ''}
                    </MetricPill>
                    <MetricPill>
                      <MetricPillIcon>{IoSchool({ size: 13 })}</MetricPillIcon>
                      {getSongsLearned()} learned
                    </MetricPill>
                    {getLearningProgress() > 0 && (
                      <MetricPill>
                        <MetricPillIcon>{FiTrendingUp({ size: 13 })}</MetricPillIcon>
                        {getLearningProgress()}% progress
                      </MetricPill>
                    )}
                  </HeroMetrics>
                )}

                <ActionButton to="/agent">
                  {MdAdd({ size: 16 })}
                  Create New Video
                </ActionButton>
              </HeroLeft>

              {/* Right — Continue Learning module */}
              <HeroRight>
                <ContinueLearningPanel>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <CLPanelLabel>
                      {continueSong ? 'Continue Learning' : 'Your Library'}
                    </CLPanelLabel>
                    <MusicBars aria-hidden="true">
                      {['0s', '0.2s', '0.4s', '0.1s', '0.3s'].map((d, i) => (
                        <Bar key={i} delay={d} height={`${8 + (i % 3) * 4}px`} />
                      ))}
                    </MusicBars>
                  </div>

                  {continueSong ? (
                    <>
                      <CLAlbumRow>
                        <CLAlbumArt hasImage={!!continueSongCover}>
                          {continueSongCover
                            ? <CLAlbumImg src={continueSongCover} alt={continueSong.song_title} />
                            : MdMusicNote({ size: 28 })}
                        </CLAlbumArt>
                        <CLSongInfo>
                          <CLSongTitle>{continueSong.song_title}</CLSongTitle>
                          <CLArtist>{continueSong.artist || 'Unknown Artist'}</CLArtist>
                        </CLSongInfo>
                      </CLAlbumRow>

                      <CLProgressBar>
                        <CLProgressLabel>
                          <span>Learning progress</span>
                          <span>{continuePct}%</span>
                        </CLProgressLabel>
                        <CLTrack>
                          <CLFill pct={continuePct} />
                        </CLTrack>
                      </CLProgressBar>

                      <CLActions>
                        <CLBtn to="/songs">
                          {MdPlayArrow({ size: 14 })} Continue
                        </CLBtn>
                        <CLBtn to="/agent">
                          {MdAutoAwesome({ size: 13 })} New
                        </CLBtn>
                      </CLActions>
                    </>
                  ) : (
                    <CLEmptyMsg>
                      {songs.length > 0
                        ? "You've learned all your songs! Generate a new one."
                        : 'Generate your first lyric video to start learning.'}
                    </CLEmptyMsg>
                  )}
                </ContinueLearningPanel>
              </HeroRight>
            </HeroCard>

            {/* ── Main dashboard grid ── */}
            <DashboardGrid>
              {/* Recent Activity */}
              <RecentActivityCard>
                <SectionHeader>
                  <SectionTitle>
                    <SectionIcon>{AiOutlineClockCircle({ size: 18 })}</SectionIcon>
                    Recent Activity
                  </SectionTitle>
                  {songs.length > 0 && (
                    <SeeAllLink to="/songs">
                      See all {FiChevronRight({ size: 14 })}
                    </SeeAllLink>
                  )}
                </SectionHeader>

                {songs.length > 0 ? (
                  <ActivityGrid>
                    {songs.slice(0, 4).map(song => (
                      <RecentActivityItem
                        key={song.id}
                        song={song}
                        albumCover={albumCovers[song.id] ?? null}
                      />
                    ))}
                  </ActivityGrid>
                ) : (
                  <EmptyState>
                    <EmptyStateIcon>{MdMusicNote({ size: 44 })}</EmptyStateIcon>
                    <EmptyStateText>No recent activity yet</EmptyStateText>
                    <ActionButton to="/agent" style={{ backgroundColor: '#1DB954', color: 'white', margin: '0 auto' }}>
                      Create Your First Video
                    </ActionButton>
                  </EmptyState>
                )}
              </RecentActivityCard>

              {/* Stats (tile grid — same data sources) */}
              <StatsCard>
                <SectionHeader>
                  <SectionTitle>
                    <SectionIcon>{FiTrendingUp({ size: 18 })}</SectionIcon>
                    Your Stats
                  </SectionTitle>
                </SectionHeader>
                <StatsGrid>
                  <StatTile>
                    <StatTileIcon>{BsMusicNoteList({ size: 18 })}</StatTileIcon>
                    <StatTileValue>{getVideosCreated()}</StatTileValue>
                    <StatTileLabel>Videos Created</StatTileLabel>
                  </StatTile>
                  <StatTile>
                    <StatTileIcon>{IoSchool({ size: 18 })}</StatTileIcon>
                    <StatTileValue>{getSongsLearned()}</StatTileValue>
                    <StatTileLabel>Songs Learned</StatTileLabel>
                  </StatTile>
                  <StatTile>
                    <StatTileIcon>{BsBarChartLine({ size: 17 })}</StatTileIcon>
                    <StatTileValue>{getLearningProgress()}%</StatTileValue>
                    <StatTileLabel>Progress</StatTileLabel>
                  </StatTile>
                  <StatTile>
                    <StatTileIcon>{AiOutlineClockCircle({ size: 18 })}</StatTileIcon>
                    <StatTileValue style={{ fontSize: '14px', paddingTop: '4px' }}>{getMemberSince()}</StatTileValue>
                    <StatTileLabel>Member Since</StatTileLabel>
                  </StatTile>
                </StatsGrid>
              </StatsCard>

              {/* Quick Actions / Creator Tools */}
              <QuickActionsCard>
                <SectionHeader>
                  <SectionTitle>Creator Tools</SectionTitle>
                </SectionHeader>
                <CreatorGrid>
                  <CreatorTool to="/agent">
                    <ToolIconWrap><IconAgentOrbit size={20} /></ToolIconWrap>
                    <div>
                      <ToolName>AI Agent</ToolName>
                      <ToolDesc>Generate lyric videos with AI</ToolDesc>
                    </div>
                  </CreatorTool>
                  <CreatorTool to="/songs">
                    <ToolIconWrap>{BsMusicNoteList({ size: 20 })}</ToolIconWrap>
                    <div>
                      <ToolName>My Songs</ToolName>
                      <ToolDesc>Browse your library</ToolDesc>
                    </div>
                  </CreatorTool>
                  <CreatorTool to="/profile">
                    <ToolIconWrap>{CgProfile({ size: 20 })}</ToolIconWrap>
                    <div>
                      <ToolName>Edit Profile</ToolName>
                      <ToolDesc>Update your details</ToolDesc>
                    </div>
                  </CreatorTool>
                  <CreatorTool to="https://spotify.com" target="_blank">
                    <ToolIconWrap>{BsSpotify({ size: 20 })}</ToolIconWrap>
                    <div>
                      <ToolName>Open Spotify</ToolName>
                      <ToolDesc>Find your next song</ToolDesc>
                    </div>
                  </CreatorTool>
                </CreatorGrid>
              </QuickActionsCard>
            </DashboardGrid>

            {/* ── DISCOVERY SECTION — horizontal carousels from existing data ── */}
            {songs.length > 0 && (
              <DiscoverySection>
                {/* Recently Generated */}
                <CarouselBlock>
                  <CarouselHeader>
                    <CarouselTitle>
                      <CarouselTitleIcon>{AiOutlineClockCircle({ size: 18 })}</CarouselTitleIcon>
                      Recently Generated
                    </CarouselTitle>
                    <SeeAllLink to="/songs">
                      View all {FiChevronRight({ size: 14 })}
                    </SeeAllLink>
                  </CarouselHeader>
                  <CarouselScroll>
                    {songs.slice(0, 6).map(song => (
                      <CarouselSongCard
                        key={song.id}
                        song={song}
                        albumCover={albumCovers[song.id] ?? null}
                        badge={song.learned ? 'learned' : 'new'}
                        badgeLabel={song.learned ? '✓ Learned' : 'Generated'}
                      />
                    ))}
                    {songs.length < 3 && (
                      <CarouselEmptyCard>
                        {MdAdd({ size: 24 })}
                        <span>Generate more videos</span>
                      </CarouselEmptyCard>
                    )}
                  </CarouselScroll>
                </CarouselBlock>

                {/* Continue Learning — unlearned songs */}
                {unlearnedSongs.length > 0 && (
                  <CarouselBlock>
                    <CarouselHeader>
                      <CarouselTitle>
                        <CarouselTitleIcon>{IoSchool({ size: 18 })}</CarouselTitleIcon>
                        Continue Learning
                      </CarouselTitle>
                      <SeeAllLink to="/songs">
                        View all {FiChevronRight({ size: 14 })}
                      </SeeAllLink>
                    </CarouselHeader>
                    <CarouselScroll>
                      {unlearnedSongs.slice(0, 6).map(song => (
                        <CarouselSongCard
                          key={song.id}
                          song={song}
                          albumCover={albumCovers[song.id] ?? null}
                          badge="new"
                          badgeLabel="↻ In Progress"
                        />
                      ))}
                    </CarouselScroll>
                  </CarouselBlock>
                )}

                {/* Learned Songs */}
                {learnedSongs.length > 0 && (
                  <CarouselBlock>
                    <CarouselHeader>
                      <CarouselTitle>
                        <CarouselTitleIcon>{MdCheckCircle({ size: 18 })}</CarouselTitleIcon>
                        Mastered Songs
                      </CarouselTitle>
                      <SeeAllLink to="/songs">
                        View all {FiChevronRight({ size: 14 })}
                      </SeeAllLink>
                    </CarouselHeader>
                    <CarouselScroll>
                      {learnedSongs.slice(0, 6).map(song => (
                        <CarouselSongCard
                          key={song.id}
                          song={song}
                          albumCover={albumCovers[song.id] ?? null}
                          badge="learned"
                          badgeLabel="✓ Mastered"
                        />
                      ))}
                    </CarouselScroll>
                  </CarouselBlock>
                )}

                {/* AI Agent promo entry-point */}
                <CarouselBlock>
                  <CarouselHeader>
                    <CarouselTitle>
                      <CarouselTitleIcon>{MdAutoAwesome({ size: 18 })}</CarouselTitleIcon>
                      AI Suggestions
                    </CarouselTitle>
                    <SeeAllLink to="/agent">
                      Open Agent {FiChevronRight({ size: 14 })}
                    </SeeAllLink>
                  </CarouselHeader>
                  <CarouselScroll>
                    {/* Repurpose recent songs as AI-suggested tracks */}
                    {songs.slice(0, 4).map(song => (
                      <CarouselSongCard
                        key={`ai-${song.id}`}
                        song={song}
                        albumCover={albumCovers[song.id] ?? null}
                        badge="ai"
                        badgeLabel="✦ AI Pick"
                      />
                    ))}
                    <CarouselEmptyCard>
                      <IconAgentOrbit size={24} />
                      <span>Ask AI for suggestions</span>
                    </CarouselEmptyCard>
                  </CarouselScroll>
                </CarouselBlock>
              </DiscoverySection>
            )}
          </HomeContainer>
        </MainContent>
      </AppLayout>
    </>
  );
};

export default HomePage;
