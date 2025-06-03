
"use client"; // This entire file is now a Client Component

import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Button, buttonVariants } from '@/components/ui/button';
import { Icons } from '@/components/icons';
import { ChevronLeft, ChevronRight, ShoppingBag, ArrowRight, Instagram, Send, Users, ImagePlus, Loader2, LayoutGrid, Palette as PaletteIcon, Handshake, Sprout, ImagePlay as ImagePlayIcon, Heart as HeartIcon, Clock, Music, Volume2, VolumeX, Youtube as YoutubeIcon, Timer, TimerOff } from 'lucide-react';
import { NewsletterSignupForm } from '@/components/forms/newsletter-signup-form';
import type { HomepageContent, Product, HeroSlide, AdminCategory as CategoryType, DesignCollaborationGallery, ArtisanalRootsSlide, SocialCommerceItem, PromotionalPost, UserPost, PostComment, SiteSettings } from '@/types';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent } from '@/components/ui/card';
import { AspectRatio } from "@/components/ui/aspect-ratio";
import { InteractiveExternalLink } from '@/components/interactive-external-link';
// MainLayout import is removed as it's used by the parent Server Component (RootPage)
import { formatDisplayDate } from '@/lib/dateUtils';
import { formatDistanceToNow } from 'date-fns';
import { cn } from '@/lib/utils';
import { ProductCard } from '@/components/product/product-card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { UserPostDetailModal } from '@/components/community/user-post-detail-modal';
import { useAuth } from '@/hooks/use-auth';
import { Separator } from '@/components/ui/separator';
import { usePathname } from 'next/navigation';
// Metadata export is removed as this is a Client Component

declare global {
  interface Window {
    onYouTubeIframeAPIReady: () => void;
    YT: any;
  }
}

const fallbackHeroSlide: HeroSlide = {
  id: 'fallback-hero-main-public-page-ts',
  title: "Peak Pulse",
  description: "Experience the fusion of ancient Nepali artistry and modern streetwear. (Default Content)",
  imageUrl: "https://images.unsplash.com/photo-1502823403499-6ccfcf4fb453?ixlib=rb-1.2.1&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=1920&h=1080&q=80",
  altText: "Fallback Peak Pulse Hero Image",
  dataAiHint: "fashion model fallback",
  ctaText: "Explore Collections",
  ctaLink: "/products",
  videoId: undefined,
  audioUrl: undefined,
  duration: 7000,
  displayOrder: 0,
  youtubeAuthorName: undefined,
  youtubeAuthorLink: undefined,
};

const defaultHomepageContent: HomepageContent = {
  heroSlides: [fallbackHeroSlide],
  artisanalRoots: {
    title: "Our Artisanal Roots (Default)",
    description: "Default description about craftsmanship.",
    slides: [],
  },
  socialCommerceItems: [],
  heroVideoId: undefined,
  heroImageUrl: undefined,
  promotionalPostsSection: {
    enabled: false,
    title: "Special Offers",
    maxItems: 3,
  },
};

async function getHomepageContent(): Promise<HomepageContent> {
  const fetchUrl = `/api/content/homepage`;
  try {
    const res = await fetch(fetchUrl, { cache: 'no-store' });

    if (!res.ok) {
      let errorDetail = `Failed to fetch homepage content. Status: ${res.status} ${res.statusText || '(No status text)'}`;
      let rawBodyForLog = "";
      let errorData = null;
      try {
        rawBodyForLog = await res.text();
        errorData = JSON.parse(rawBodyForLog);
        if (errorData && (errorData.error || errorData.message || errorData.rawSupabaseError)) {
          errorDetail = errorData.error || errorData.message || errorData.rawSupabaseError?.message || errorDetail;
          if (errorData.rawSupabaseError) {
            errorDetail += ` Supabase Error: ${errorData.rawSupabaseError.message || ''} Code: ${errorData.rawSupabaseError.code || ''}`;
          }
        }
      } catch (e) {
         errorDetail += ` (Server response was not valid JSON. Raw: ${rawBodyForLog.substring(0,100)})`
      }
      return { ...defaultHomepageContent, error: errorDetail };
    }

    const jsonData: HomepageContent = await res.json();

    const processedData: HomepageContent = {
      heroSlides: Array.isArray(jsonData.heroSlides) && jsonData.heroSlides.length > 0
        ? jsonData.heroSlides.map((slide: Partial<HeroSlide>, index: number) => ({
            ...fallbackHeroSlide,
            ...slide,
            id: slide.id || `hs-fetched-${Date.now()}-${index}`,
            imageUrl: (slide.imageUrl && slide.imageUrl.trim() !== "") ? slide.imageUrl.trim() : undefined,
            videoId: (slide.videoId && slide.videoId.trim() !== "") ? slide.videoId.trim() : undefined,
            audioUrl: (slide.audioUrl && slide.audioUrl.trim() !== "") ? slide.audioUrl.trim() : undefined,
            duration: slide.duration === undefined || slide.duration === null || Number(slide.duration) < 1000 ? fallbackHeroSlide.duration : Number(slide.duration),
            displayOrder: slide.displayOrder === undefined ? index * 10 : Number(slide.displayOrder || 0),
            youtubeAuthorName: (slide.youtubeAuthorName && slide.youtubeAuthorName.trim() !== "") ? slide.youtubeAuthorName.trim() : undefined,
            youtubeAuthorLink: (slide.youtubeAuthorLink && slide.youtubeAuthorLink.trim() !== "") ? slide.youtubeAuthorLink.trim() : undefined,
          }))
        : defaultHomepageContent.heroSlides,
      artisanalRoots: {
        title: jsonData.artisanalRoots?.title || defaultHomepageContent.artisanalRoots!.title,
        description: jsonData.artisanalRoots?.description || defaultHomepageContent.artisanalRoots!.description,
        slides: Array.isArray(jsonData.artisanalRoots?.slides)
          ? jsonData.artisanalRoots.slides.map((slide: Partial<ArtisanalRootsSlide>, index: number) => ({ id: slide.id || `ars-fetched-${Date.now()}-${index}`, imageUrl: slide.imageUrl || '', altText: slide.altText || '', dataAiHint: slide.dataAiHint || '' }))
          : defaultHomepageContent.artisanalRoots!.slides || [],
      },
      socialCommerceItems: Array.isArray(jsonData.socialCommerceItems)
        ? jsonData.socialCommerceItems.map((item: Partial<SocialCommerceItem>, index: number) => ({ id: item.id || `scs-fetched-${Date.now()}-${index}`, imageUrl: item.imageUrl || '', linkUrl: item.linkUrl || '#', altText: item.altText || '', dataAiHint: item.dataAiHint || '', displayOrder: item.displayOrder || 0}))
        : defaultHomepageContent.socialCommerceItems || [],
      heroVideoId: (jsonData.heroVideoId && jsonData.heroVideoId.trim() !== "") ? jsonData.heroVideoId.trim() : undefined,
      heroImageUrl: (jsonData.heroImageUrl && jsonData.heroImageUrl.trim() !== "") ? jsonData.heroImageUrl.trim() : undefined,
      promotionalPostsSection: {
        enabled: jsonData.promotionalPostsSection?.enabled ?? defaultHomepageContent.promotionalPostsSection!.enabled,
        title: jsonData.promotionalPostsSection?.title || defaultHomepageContent.promotionalPostsSection!.title,
        maxItems: jsonData.promotionalPostsSection?.maxItems || defaultHomepageContent.promotionalPostsSection!.maxItems,
      },
    };
    return processedData;
  } catch (error: any) {
    console.error('[Client Fetch] CRITICAL NETWORK/FETCH ERROR in getHomepageContent:', error.name, error.message, error.stack);
    return { ...defaultHomepageContent, error: `Network error: ${error.message || 'Failed to connect to content API.'}` };
  }
}

export default function HomePageContent() {
  const [content, setContent] = useState<HomepageContent>(defaultHomepageContent);
  const [siteSettings, setSiteSettings] = useState<SiteSettings | null>(null);
  const [isLoadingContent, setIsLoadingContent] = useState(true);
  const [isLoadingSiteSettings, setIsLoadingSiteSettings] = useState(true);

  const [featuredProducts, setFeaturedProducts] = useState<Product[]>([]);
  const [isLoadingFeaturedProducts, setIsLoadingFeaturedProducts] = useState(true);

  const [categories, setCategories] = useState<CategoryType[]>([]);
  const [isLoadingCategories, setIsLoadingCategories] = useState(true);

  const [promotionalPosts, setPromotionalPosts] = useState<PromotionalPost[]>([]);
  const [isLoadingPromotionalPosts, setIsLoadingPromotionalPosts] = useState(false);

  const [featuredCollaborations, setFeaturedCollaborations] = useState<DesignCollaborationGallery[]>([]);
  const [isLoadingCollaborations, setIsLoadingCollaborations] = useState(true);

  const [userPosts, setUserPosts] = useState<UserPost[]>([]);
  const [isLoadingUserPosts, setIsLoadingUserPosts] = useState(true);

  const [currentHeroSlide, setCurrentHeroSlide] = useState(0);
  const [isHeroPlaying, setIsHeroPlaying] = useState(true); 
  const [isInitialSlideIntervalPaused, setIsInitialSlideIntervalPaused] = useState(true); 
  const [initialAutoplayConditionsMet, setInitialAutoplayConditionsMet] = useState(false); 

  const heroIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const minPlayTimeTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const audioRef = useRef<HTMLAudioElement>(null);
  const [isDirectAudioMuted, setIsDirectAudioMuted] = useState(true);

  const [isYouTubeApiReady, setIsYouTubeApiReady] = useState(false);
  const playerRefs = useRef<any[]>([]);
  const [isYouTubePlayerMuted, setIsYouTubePlayerMuted] = useState(true); 

  const [currentArtisanalSlide, setCurrentArtisanalSlide] = useState(0);
  const [isArtisanalPlaying, setIsArtisanalPlaying] = useState(true);
  const [artisanalSlideDuration, setArtisanalSlideDuration] = useState(5000);

  const [currentSocialCommerceSlide, setCurrentSocialCommerceSlide] = useState(0);
  const [isSocialCommerceHovered, setIsSocialCommerceHovered] = useState(false);
  const [socialCommerceSlideDuration, setSocialCommerceSlideDuration] = useState(6000);

  const { toast } = useToast();
  const { user, isAuthenticated, refreshUserProfile } = useAuth();

  const [isLikingPostId, setIsLikingPostId] = useState<string | null>(null);
  const [isBookmarkingPostId, setIsBookmarkingPostId] = useState<string | null>(null);

  const [selectedPostForModal, setSelectedPostForModal] = useState<UserPost | null>(null);
  const [isPostModalOpen, setIsPostModalOpen] = useState(false);

  const [menusVisibleOnScroll, setMenusVisibleOnScroll] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  const pathname = usePathname();


  useEffect(() => {
    setIsMounted(true);
    if (!window.YT) {
      const tag = document.createElement('script');
      tag.src = "https://www.youtube.com/iframe_api";
      const firstScriptTag = document.getElementsByTagName('script')[0];
      firstScriptTag.parentNode?.insertBefore(tag, firstScriptTag);
      window.onYouTubeIframeAPIReady = () => {
        setIsYouTubeApiReady(true);
      };
    } else {
      setIsYouTubeApiReady(true);
    }
  }, []);

  useEffect(() => {
    if (!isMounted) return;
    const scrollThreshold = 50;
    const handleScroll = () => setMenusVisibleOnScroll(window.scrollY > scrollThreshold);
    handleScroll();
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [isMounted]);

  useEffect(() => {
    if (isMounted && pathname === '/') {
      document.body.classList.toggle('menus-hidden-on-hero', !menusVisibleOnScroll);
    } else {
      document.body.classList.remove('menus-hidden-on-hero');
    }
    return () => document.body.classList.remove('menus-hidden-on-hero');
  }, [menusVisibleOnScroll, isMounted, pathname]);


  const loadPageData = useCallback(async () => {
     setIsLoadingContent(true);
    setIsLoadingSiteSettings(true);
    setIsLoadingFeaturedProducts(true);
    setIsLoadingCategories(true);
    setIsLoadingCollaborations(true);
    setIsLoadingUserPosts(true);

    try {
      const [fetchedContent, fetchedSiteSettings] = await Promise.all([
        getHomepageContent(),
        fetch('/api/settings').then(res => res.ok ? res.json() : null)
      ]);

      setContent(current => ({...current, ...fetchedContent, heroSlides: fetchedContent.heroSlides || current.heroSlides }));
      if (fetchedContent.error) {
        toast({ title: "Error Loading Homepage Visuals", description: `${fetchedContent.error}. Using defaults.`, variant: "destructive", duration: 7000 });
      }

      if (fetchedSiteSettings) {
        setSiteSettings(fetchedSiteSettings);
      } else {
        toast({ title: "Error Loading Site Settings", description: "Could not load site settings. Autoplay defaults to on.", variant: "default" });
      }
      setIsLoadingSiteSettings(false);


      if (fetchedContent?.promotionalPostsSection?.enabled) {
        setIsLoadingPromotionalPosts(true);
        fetch('/api/promotional-posts')
          .then(res => res.ok ? res.json() : Promise.reject('Failed to fetch promotional posts'))
          .then(data => setPromotionalPosts(data))
          .catch(err => toast({ title: "Error Loading Promotions", description: (err as Error).message, variant: "destructive" }))
          .finally(() => setIsLoadingPromotionalPosts(false));
      } else {
        setPromotionalPosts([]);
        setIsLoadingPromotionalPosts(false);
      }

      fetch('/api/products')
        .then(res => res.ok ? res.json() : Promise.reject('Failed to fetch products'))
        .then((allProducts: Product[]) => {
          const featured = allProducts.filter(p => p.isFeatured).slice(0, 3);
          setFeaturedProducts(featured);
        })
        .catch(err => toast({ title: "Error Loading Featured Products", description: (err as Error).message, variant: "destructive" }))
        .finally(() => setIsLoadingFeaturedProducts(false));

      fetch('/api/categories')
        .then(res => res.ok ? res.json() : Promise.reject('Failed to fetch categories'))
        .then(data => setCategories(data))
        .catch(err => toast({ title: "Error Loading Categories", description: (err as Error).message, variant: "destructive" }))
        .finally(() => setIsLoadingCategories(false));

      fetch('/api/design-collaborations')
        .then(res => res.ok ? res.json() : Promise.reject('Failed to fetch collaborations'))
        .then(data => setFeaturedCollaborations(data.slice(0,3)))
        .catch(err => toast({ title: "Error Loading Collaborations", description: (err as Error).message, variant: "destructive" }))
        .finally(() => setIsLoadingCollaborations(false));

      fetch('/api/user-posts?status=approved')
        .then(res => res.ok ? res.json() : Promise.reject('Failed to fetch user posts'))
        .then(data => setUserPosts(data))
        .catch(err => toast({ title: "Error Loading Community Posts", description: (err as Error).message, variant: "destructive" }))
        .finally(() => setIsLoadingUserPosts(false));

    } catch (error) {
       toast({ title: "Major Error Loading Page Data", description: (error as Error).message, variant: "destructive" });
    } finally {
      setIsLoadingContent(false);
    }
  }, [toast]);

  useEffect(() => { loadPageData(); }, [loadPageData]);
  
  useEffect(() => {
    if (siteSettings && !isLoadingSiteSettings) {
        const globalAutoplay = (siteSettings as any)?.heroVideoAutoplay !== false;
        setIsHeroPlaying(globalAutoplay); 
        setIsInitialSlideIntervalPaused(!globalAutoplay); 
        setInitialAutoplayConditionsMet(true); 
    }
  }, [siteSettings, isLoadingSiteSettings]);


  const combinedHeroSlides = useMemo(() => {
    const sortedBaseSlides = (content.heroSlides || []).filter(slide => slide.id).sort((a, b) => (a.displayOrder || 0) - (b.displayOrder || 0));
    const sortedAdaptedPromoSlides = (content.promotionalPostsSection?.enabled && promotionalPosts.length > 0)
      ? promotionalPosts.slice(0, content.promotionalPostsSection.maxItems || promotionalPosts.length).sort((a,b) => (a.displayOrder || 0) - (b.displayOrder || 0)).map((promo, index) => ({
            id: promo.id || `promo-slide-${index}`, title: promo.title, description: promo.description || '', imageUrl: promo.imageUrl,
            altText: promo.imageAltText || promo.title, dataAiHint: promo.dataAiHint || 'promotion offer sale',
            ctaText: promo.ctaText || 'Learn More', ctaLink: promo.ctaLink || `/products?promo=${promo.slug}`,
            videoId: undefined, audioUrl: undefined, duration: fallbackHeroSlide.duration,
            displayOrder: (sortedBaseSlides.length * 10) + (promo.displayOrder || index * 10),
            youtubeAuthorName: undefined, youtubeAuthorLink: undefined, _isPromo: true,
            _backgroundColor: promo.backgroundColor, _textColor: promo.textColor,
          }))
      : [];
    const slides = [...sortedBaseSlides, ...sortedAdaptedPromoSlides];
    return slides.length > 0 ? slides : [fallbackHeroSlide];
  }, [content.heroSlides, content.promotionalPostsSection, promotionalPosts]);

  const activeHeroSlides = combinedHeroSlides;
  const activeArtisanalSlides = content.artisanalRoots?.slides && content.artisanalRoots.slides.length > 0 ? content.artisanalRoots.slides : [];

  const nextHeroSlide = useCallback(() => {
    if (activeHeroSlides.length > 0) {
      setCurrentHeroSlide((prev) => (prev === activeHeroSlides.length - 1 ? 0 : prev + 1));
    }
  }, [activeHeroSlides.length]);

  const prevHeroSlide = () => {
     if (isInitialSlideIntervalPaused && currentHeroSlide === 0) setIsInitialSlideIntervalPaused(false);
     if (activeHeroSlides.length > 0) {
      setCurrentHeroSlide((prev) => (prev === 0 ? activeHeroSlides.length - 1 : prev - 1));
    }
  };
  const goToHeroSlide = (index: number) => {
    if (isInitialSlideIntervalPaused && currentHeroSlide === 0) setIsInitialSlideIntervalPaused(false);
    if (activeHeroSlides.length > 0) { setCurrentHeroSlide(index % activeHeroSlides.length); }
  };

  const toggleHeroPlayPause = () => { 
    if (isInitialSlideIntervalPaused && currentHeroSlide === 0) {
        setIsInitialSlideIntervalPaused(false);
    }
    setIsHeroPlaying(prev => !prev);
  };
  
  const handleMuteToggleClick = () => { 
    const currentSlide = activeHeroSlides[currentHeroSlide];
    const player = playerRefs.current[currentHeroSlide];

    if (currentSlide?.audioUrl && audioRef.current) {
        const newMutedState = !audioRef.current.muted;
        audioRef.current.muted = newMutedState;
        setIsDirectAudioMuted(newMutedState);
        if (!newMutedState && player && typeof player.mute === 'function') player.mute();
        if (newMutedState && player && typeof player.unMute === 'function' && !isYouTubePlayerMuted) player.unMute();


    } else if (player && typeof player.isMuted === 'function' && typeof player.mute === 'function' && typeof player.unMute === 'function') {
        const currentlyPlayerMuted = player.isMuted();
        if (currentlyPlayerMuted) {
            player.unMute();
            setIsYouTubePlayerMuted(false);
        } else {
            player.mute();
            setIsYouTubePlayerMuted(true);
        }
    }
  };

  useEffect(() => {
    if (!isMounted || !initialAutoplayConditionsMet || !isHeroPlaying || currentHeroSlide !== 0 || !isInitialSlideIntervalPaused) return;
    const globalAutoplayEnabled = (siteSettings as any)?.heroVideoAutoplay !== false;
    if (globalAutoplayEnabled) {
      const initialIntervalStartTimeout = setTimeout(() => {
        if (isMounted && isInitialSlideIntervalPaused) { 
          setIsInitialSlideIntervalPaused(false); 
        }
      }, 200); 
      return () => clearTimeout(initialIntervalStartTimeout);
    }
  }, [isMounted, initialAutoplayConditionsMet, siteSettings, isHeroPlaying, currentHeroSlide, isInitialSlideIntervalPaused]);


  const activeHeroSlidesVideoIds = useMemo(() => JSON.stringify(activeHeroSlides.map(s => s.videoId)), [activeHeroSlides]);
  useEffect(() => {
    if (!isYouTubeApiReady || activeHeroSlides.length === 0 || !isMounted) return;

    activeHeroSlides.forEach((slideData, index) => {
      const targetDivId = `youtube-player-${index}`;
      const playerContainer = document.getElementById(targetDivId);
      let existingPlayer = playerRefs.current[index];
      const useVideoForVisual = !slideData.imageUrl && !!slideData.videoId;

      if (useVideoForVisual && playerContainer) {
        if (!existingPlayer || (typeof existingPlayer.getVideoData === 'function' && existingPlayer.getVideoData().video_id !== slideData.videoId)) {
          if (existingPlayer && typeof existingPlayer.destroy === 'function') {
            try { existingPlayer.destroy(); } catch (e) { console.warn("Error destroying YT player", e); }
          }
          const newPlayer = new window.YT.Player(targetDivId, {
            videoId: slideData.videoId,
            playerVars: { autoplay: 0, controls: 0, loop: 1, playlist: slideData.videoId, modestbranding: 1, playsinline: 1, showinfo: 0, rel: 0, mute: 1 },
            events: {
              onReady: (event: any) => {
                playerRefs.current[index] = event.target;
                event.target.mute(); 
              },
              onStateChange: (event: any) => {
                const currentSlideData = activeHeroSlides[index]; // Use slideData from forEach scope
                if (index === currentHeroSlide && event.data === window.YT?.PlayerState?.ENDED) {
                  event.target.seekTo(0);
                  const globalAutoplayEnabled = (siteSettings as any)?.heroVideoAutoplay !== false;
                  
                  if (isHeroPlaying && globalAutoplayEnabled && initialAutoplayConditionsMet && !currentSlideData?.audioUrl) {
                    nextHeroSlide();
                  } else if (globalAutoplayEnabled && initialAutoplayConditionsMet && isHeroPlaying) {
                    event.target.playVideo(); 
                  } else {
                     event.target.pauseVideo();
                  }
                } else if (index === currentHeroSlide && event.data === window.YT?.PlayerState?.PLAYING) {
                  const effectiveYouTubeMute = isYouTubePlayerMuted || (currentSlideData?.audioUrl && audioRef.current && !audioRef.current.muted);
                  if (effectiveYouTubeMute) event.target.mute(); else event.target.unMute();
                }
              }
            }
          });
        }
      } else if (existingPlayer && !useVideoForVisual) {
        if (typeof existingPlayer.destroy === 'function') {
          try { existingPlayer.destroy(); } catch (e) { console.warn("Error destroying YT player for non-video slide", e); }
          playerRefs.current[index] = null;
        }
      }
    });
  }, [isYouTubeApiReady, activeHeroSlidesVideoIds, isMounted, currentHeroSlide, siteSettings, isHeroPlaying, initialAutoplayConditionsMet, nextHeroSlide, isYouTubePlayerMuted, activeHeroSlides]);


  // Main Media and Interval Control Effect
  useEffect(() => {
    if (heroIntervalRef.current) clearInterval(heroIntervalRef.current);
    if (minPlayTimeTimeoutRef.current) clearTimeout(minPlayTimeTimeoutRef.current);

    const currentSlideData = activeHeroSlides[currentHeroSlide];
    if (!currentSlideData || !initialAutoplayConditionsMet || !isMounted) return;
    
    const globalAutoplayEnabled = (siteSettings as any)?.heroVideoAutoplay !== false;
    
    const currentSlideIsVideo = !!currentSlideData.videoId && !currentSlideData.imageUrl;
    const currentSlideIsDirectAudio = !!currentSlideData.audioUrl;
    const activePlayerInstance = playerRefs.current[currentHeroSlide];

    // HTML5 Audio control
    if (audioRef.current) {
      if (currentSlideIsDirectAudio && isHeroPlaying && globalAutoplayEnabled) {
        if (audioRef.current.src !== currentSlideData.audioUrl) {
          audioRef.current.src = currentSlideData.audioUrl!;
          audioRef.current.load();
        }
        audioRef.current.muted = isDirectAudioMuted;
        audioRef.current.play().catch(e => console.warn("HTML5 audio play failed:", e));
      } else {
        audioRef.current.pause();
      }
    }

    // YouTube Video Player control for ACTIVE slide
    if (isYouTubeApiReady && activePlayerInstance && typeof activePlayerInstance.playVideo === 'function') {
      if (currentSlideIsVideo) {
        const shouldThisVideoAutoplay = globalAutoplayEnabled && isHeroPlaying && initialAutoplayConditionsMet;
        if (shouldThisVideoAutoplay) {
          activePlayerInstance.playVideo();
        } else {
           if (activePlayerInstance.getPlayerState && activePlayerInstance.getPlayerState() !== window.YT?.PlayerState?.PAUSED) {
               activePlayerInstance.pauseVideo();
           }
        }
        const effectiveYouTubeMute = isYouTubePlayerMuted || (currentSlideIsDirectAudio && audioRef.current && !audioRef.current.muted);
        if (effectiveYouTubeMute) activePlayerInstance.mute(); else activePlayerInstance.unMute();
      } else { 
        if (typeof activePlayerInstance.pauseVideo === 'function') activePlayerInstance.pauseVideo();
        if (typeof activePlayerInstance.mute === 'function') activePlayerInstance.mute();
      }
    }

    // Slideshow Interval Logic
    const canIntervalRunForAutoAdvance = isHeroPlaying && globalAutoplayEnabled && (currentHeroSlide !== 0 || !isInitialSlideIntervalPaused);
    if (canIntervalRunForAutoAdvance) {
      const isNonVideoSlideOrVideoWithAudio = !currentSlideIsVideo || (currentSlideIsVideo && currentSlideIsDirectAudio);
      if (isNonVideoSlideOrVideoWithAudio) {
        heroIntervalRef.current = setInterval(nextHeroSlide, currentSlideData.duration || 7000);
      }
      // For video-only slides, YT.PlayerState.ENDED handles nextHeroSlide (if isHeroPlaying & globalAutoplayEnabled & !currentSlideIsDirectAudio)
    }

    // Pause and mute other non-active YouTube players
    playerRefs.current.forEach((player, idx) => {
      if (player && idx !== currentHeroSlide && typeof player.pauseVideo === 'function' && typeof player.mute === 'function') {
        try { player.pauseVideo(); player.mute(); }
        catch (e) { console.warn(`Error managing non-current YT player ${idx}`, e); }
      }
    });

    return () => {
      if (heroIntervalRef.current) clearInterval(heroIntervalRef.current);
      if (minPlayTimeTimeoutRef.current) clearTimeout(minPlayTimeTimeoutRef.current);
    };
  }, [
    currentHeroSlide, activeHeroSlides, isHeroPlaying, initialAutoplayConditionsMet,
    isYouTubeApiReady, siteSettings, isMounted,
    isDirectAudioMuted, isYouTubePlayerMuted, nextHeroSlide, isInitialSlideIntervalPaused
  ]);


  const nextArtisanalSlide = useCallback(() => {
    if (activeArtisanalSlides.length > 0) {
      setCurrentArtisanalSlide((prev) => (prev === activeArtisanalSlides.length - 1 ? 0 : prev + 1));
    }
  }, [activeArtisanalSlides.length]);

  useEffect(() => {
    let artisanalSlideInterval: NodeJS.Timeout | undefined;
    if (isArtisanalPlaying && activeArtisanalSlides.length > 1) {
      artisanalSlideInterval = setInterval(nextArtisanalSlide, artisanalSlideDuration);
    }
    return () => { if (artisanalSlideInterval) clearInterval(artisanalSlideInterval); };
  }, [isArtisanalPlaying, nextArtisanalSlide, activeArtisanalSlides.length, artisanalSlideDuration]);

  const activeSocialCommerceItems = content.socialCommerceItems || [];
  const nextSocialCommerceSlide = useCallback(() => {
    if (activeSocialCommerceItems.length > 0) {
      setCurrentSocialCommerceSlide(prev => (prev === activeSocialCommerceItems.length - 1 ? 0 : prev + 1));
    }
  }, [activeSocialCommerceItems.length]);

  const prevSocialCommerceSlide = useCallback(() => {
    if (activeSocialCommerceItems.length > 0) {
      setCurrentSocialCommerceSlide(prev => (prev === 0 ? activeSocialCommerceItems.length - 1 : prev - 1));
    }
  }, [activeSocialCommerceItems.length]);
  const goToSocialCommerceSlide = (index: number) => {
    if (activeSocialCommerceItems.length > 0) setCurrentSocialCommerceSlide(index % activeSocialCommerceItems.length);
  };
  useEffect(() => {
    let socialInterval: NodeJS.Timeout | undefined;
    if (activeSocialCommerceItems.length > 1 && !isSocialCommerceHovered) {
      socialInterval = setInterval(nextSocialCommerceSlide, socialCommerceSlideDuration);
    }
    return () => { if (socialInterval) clearInterval(socialInterval); };
  }, [activeSocialCommerceItems.length, nextSocialCommerceSlide, isSocialCommerceHovered, socialCommerceSlideDuration]);

  const handleCommunityPostClick = (post: UserPost) => {
    if (!isAuthenticated) {
      toast({ title: "Login to Interact", description: "Please log in to view post details and interact.", action: <Button asChild variant="outline"><Link href="/login?redirect=/">Login</Link></Button> });
      return;
    }
    setSelectedPostForModal(post);
    setIsPostModalOpen(true);
  };
  const handleLikeToggle = useCallback(async (postId: string) => { if (!isAuthenticated || !user?.id) { toast({ title: "Please Login", description: "You need to be logged in to like posts.", variant: "default", action: <Button asChild variant="outline"><Link href="/login?redirect=/">Login</Link></Button> }); return; } setIsLikingPostId(postId); const originalPosts = [...userPosts]; const postIndex = userPosts.findIndex(p => p.id === postId); if (postIndex === -1) { setIsLikingPostId(null); return; } const postToUpdate = { ...userPosts[postIndex] }; const alreadyLiked = postToUpdate.liked_by_user_ids?.includes(user.id); const newLikedBy = alreadyLiked ? postToUpdate.liked_by_user_ids?.filter(id => id !== user.id) : [...(postToUpdate.liked_by_user_ids || []), user.id]; postToUpdate.liked_by_user_ids = newLikedBy; postToUpdate.like_count = newLikedBy?.length || 0; setUserPosts(prev => prev.map(p => p.id === postId ? postToUpdate : p)); if (selectedPostForModal?.id === postId) setSelectedPostForModal(postToUpdate); try { const response = await fetch(`/api/user-posts/${postId}/like`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ userId: user.id }), }); if (!response.ok) { const errorData = await response.json(); throw new Error(errorData.message || 'Failed to update like status.'); } const updatedPostFromServer: UserPost = await response.json(); setUserPosts(prev => prev.map(p => p.id === postId ? updatedPostFromServer : p)); if (selectedPostForModal?.id === postId) setSelectedPostForModal(updatedPostFromServer); } catch (error) { toast({ title: "Error", description: (error as Error).message, variant: "destructive" }); setUserPosts(originalPosts); if (selectedPostForModal?.id === postId) setSelectedPostForModal(originalPosts[postIndex]); } finally { setIsLikingPostId(null); } }, [isAuthenticated, user, userPosts, selectedPostForModal, toast]);
  const handleBookmarkToggle = useCallback(async (postId: string) => { if (!isAuthenticated || !user?.id) { toast({ title: "Please Login", description: "You need to be logged in to bookmark posts.", variant: "default", action: <Button asChild variant="outline"><Link href="/login?redirect=/">Login</Link></Button> }); return; } setIsBookmarkingPostId(postId); try { const response = await fetch(`/api/user-posts/${postId}/bookmark`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ userId: user.id }), }); if (!response.ok) { const errorData = await response.json(); throw new Error(errorData.message || 'Failed to update bookmark status.'); } await refreshUserProfile(); toast({ title: "Bookmark status updated!" }); } catch (error) { toast({ title: "Error", description: (error as Error).message, variant: "destructive" }); } finally { setIsBookmarkingPostId(null); } }, [isAuthenticated, user, toast, refreshUserProfile]);
  const handleCommentPosted = useCallback((postId: string, newComment: PostComment) => { setUserPosts(prevPosts => prevPosts.map(p => { if (p.id === postId) { return { ...p, comment_count: (p.comment_count || 0) + 1, comments: p.comments ? [...p.comments, newComment] : [newComment] }; } return p; })); if (selectedPostForModal?.id === postId) { setSelectedPostForModal(prev => prev ? ({ ...prev, comment_count: (prev.comment_count || 0) + 1, comments: prev.comments ? [...prev.comments, newComment] : [newComment] }) : null); } }, [selectedPostForModal]);


  if (isLoadingContent || isLoadingSiteSettings || isLoadingFeaturedProducts || isLoadingCategories || isLoadingCollaborations || (content.promotionalPostsSection?.enabled && isLoadingPromotionalPosts) || isLoadingUserPosts) {
    return ( <div className="flex items-center justify-center min-h-screen bg-background"> <div className="flex flex-col items-center"> <Icons.Logo className="h-20 w-20 text-primary animate-pulse mb-4" /> <p className="text-muted-foreground">Loading Peak Pulse...</p> </div> </div> );
  }

  const currentDisplayedHeroSlide = activeHeroSlides[currentHeroSlide];
  const heroVideoIdForFallbackVisuals = content.heroVideoId;
  const heroImageUrlForFallbackVisuals = content.heroImageUrl;

  let isCurrentSlideDirectAudio = !!currentDisplayedHeroSlide?.audioUrl;
  let isCurrentSlideYouTubeAudio = !currentDisplayedHeroSlide?.audioUrl && !!currentDisplayedHeroSlide?.videoId && !currentDisplayedHeroSlide?.imageUrl;
  const showMuteButton = isCurrentSlideDirectAudio || isCurrentSlideYouTubeAudio;
  
  let currentCombinedMuteState = true; 
  if (isCurrentSlideDirectAudio) {
    currentCombinedMuteState = isDirectAudioMuted;
  } else if (isCurrentSlideYouTubeAudio) {
    currentCombinedMuteState = isYouTubePlayerMuted;
  }


  return (
    <>
      <section style={{ backgroundColor: 'black' }} className="relative h-screen w-full overflow-hidden">
        <audio ref={audioRef} loop muted={isDirectAudioMuted} className="hidden" />
        <div className="absolute inset-0 z-0 pointer-events-none">
          {activeHeroSlides.map((slide, index) => {
            const isCurrent = index === currentHeroSlide;
            const useImageForVisual = !!slide.imageUrl;
            const useYouTubeForVisual = !slide.imageUrl && !!slide.videoId;

            return (
              <div
                key={slide.id || `hero-bg-${index}`}
                className={cn( "absolute inset-0 transition-opacity duration-1000 ease-in-out", isCurrent ? "opacity-100" : "opacity-0" )}
                style={{ backgroundColor: useYouTubeForVisual ? 'transparent' : (slide._isPromo ? (slide._backgroundColor || 'rgba(0,0,0,0.3)') : 'transparent') }}
              >
                {useImageForVisual && slide.imageUrl && (
                  <>
                    <Image src={slide.imageUrl} alt={slide.altText || "Peak Pulse Hero Background"} fill sizes="100vw" priority={index === 0} className="absolute inset-0 w-full h-full object-cover" data-ai-hint={slide.dataAiHint || "fashion mountains nepal"} />
                    <div className="absolute inset-0 bg-black/30 z-[1]" />
                  </>
                )}
                {useYouTubeForVisual && slide.videoId && (
                  <>
                    <div id={`youtube-player-${index}`} className={cn("absolute top-1/2 left-1/2 w-full h-full min-w-[177.77vh] min-h-[56.25vw] transform -translate-x-1/2 -translate-y-1/2", isCurrent ? "visible" : "invisible")} />
                    <div className="absolute inset-0 bg-black/30 z-[1]" />
                  </>
                )}
                {!useImageForVisual && !useYouTubeForVisual && !slide._isPromo && <div className="absolute inset-0 bg-black" /> }
              </div>
            );
          })}
           {activeHeroSlides.length === 0 && heroVideoIdForFallbackVisuals && (
             <>
                <div id="youtube-player-fallback" className="absolute top-1/2 left-1/2 w-full h-full min-w-[177.77vh] min-h-[56.25vw] transform -translate-x-1/2 -translate-y-1/2" />
                <div className="absolute inset-0 bg-black/30 z-[1]" />
             </>
           )}
           {activeHeroSlides.length === 0 && !heroVideoIdForFallbackVisuals && heroImageUrlForFallbackVisuals && (
                <>
                    <Image src={heroImageUrlForFallbackVisuals} alt={"Peak Pulse Hero Background"} fill sizes="100vw" priority className="absolute inset-0 w-full h-full object-cover" data-ai-hint={"fashion mountains nepal"} />
                    <div className="absolute inset-0 bg-black/30 z-[1]" />
                </>
           )}
           {activeHeroSlides.length === 0 && !heroVideoIdForFallbackVisuals && !heroImageUrlForFallbackVisuals && (
                <div className="absolute inset-0 bg-black" />
           )}
        </div>

        {activeHeroSlides.map((slide, index) => {
            const isCurrent = index === currentHeroSlide;
            const showVideoAttribution = isCurrent && !slide.imageUrl && slide.videoId && slide.youtubeAuthorName && slide.youtubeAuthorLink;
            const slideTextColor = slide._isPromo && slide._textColor ? slide._textColor : 'text-white';
            const slideDescriptionColor = slide._isPromo && slide._textColor ? slide._textColor : 'text-neutral-200';
            const slideButtonVariant = slide._isPromo ? "secondary" : "default";


            return (
              <div key={slide.id || `hero-content-${index}`} className={cn("absolute inset-0 transition-opacity duration-1000 ease-in-out", isCurrent ? "opacity-100" : "opacity-0 pointer-events-none")} style={{ pointerEvents: isCurrent ? 'auto' : 'none' }}>
                <div className="relative z-20 flex flex-col items-center justify-center h-full pt-[calc(theme(spacing.20)_+_theme(spacing.6))] pb-12 px-6 md:px-8 text-center max-w-3xl mx-auto">
                    <h1 className={cn("text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold tracking-tight mb-6 text-shadow-lg", slideTextColor)} dangerouslySetInnerHTML={{ __html: slide.title }} />
                    <p className={cn("text-lg md:text-xl lg:text-2xl mb-10 max-w-2xl mx-auto text-shadow-lg", slideDescriptionColor)} dangerouslySetInnerHTML={{ __html: slide.description }} />
                    {slide.ctaText && slide.ctaLink && ( <Link href={slide.ctaLink} className={cn(buttonVariants({ variant: slideButtonVariant, size: "lg", className: "text-base md:text-lg py-3 px-8" }))}> <span className="flex items-center"> {slide.ctaText} <ShoppingBag className="ml-2 h-5 w-5" /> </span> </Link> )}
                    {showVideoAttribution && ( <div className="absolute bottom-20 left-1/2 -translate-x-1/2 md:bottom-24 lg:bottom-28 p-2 bg-black/40 backdrop-blur-sm rounded-md text-xs md:text-sm"> <InteractiveExternalLink href={slide.youtubeAuthorLink!} className="text-neutral-300 hover:text-white transition-colors flex items-center" target="_blank" rel="noopener noreferrer" showDialog={true}> <YoutubeIcon className="h-4 w-4 mr-1.5" /> Video by: {slide.youtubeAuthorName} </InteractiveExternalLink> </div> )}
                </div>
              </div>
            );
        })}

        {activeHeroSlides.length > 1 && (
          <>
            <Button variant="ghost" size="icon" className="absolute left-2 md:left-4 top-1/2 -translate-y-1/2 z-30 h-10 w-10 md:h-14 md:w-14 rounded-full bg-black/25 text-white/80 hover:bg-black/50 hover:text-white focus-visible:bg-black/50 focus-visible:ring-2 focus-visible:ring-white/50 focus-visible:ring-offset-2 focus-visible:ring-offset-transparent transition-all duration-200 flex items-center justify-center" onClick={prevHeroSlide} aria-label="Previous slide"> <ChevronLeft className="h-6 w-6 md:h-7 md:w-7" /> </Button>
            <Button variant="ghost" size="icon" className="absolute right-2 md:right-4 top-1/2 -translate-y-1/2 z-30 h-10 w-10 md:h-14 md:w-14 rounded-full bg-black/25 text-white/80 hover:bg-black/50 hover:text-white focus-visible:bg-black/50 focus-visible:ring-2 focus-visible:ring-white/50 focus-visible:ring-offset-2 focus-visible:ring-offset-transparent transition-all duration-200 flex items-center justify-center" onClick={nextHeroSlide} aria-label="Next slide"> <ChevronRight className="h-6 w-6 md:h-7 md:w-7" /> </Button>
            <div className="absolute bottom-6 md:bottom-8 left-1/2 -translate-x-1/2 z-30 flex items-center space-x-3 bg-black/20 p-1.5 rounded-full backdrop-blur-sm">
               <Button variant="ghost" size="icon" onClick={toggleHeroPlayPause} className="h-7 w-7 text-white/70 hover:text-white p-1" aria-label={isHeroPlaying ? "Pause slideshow" : "Play slideshow"} > {isHeroPlaying ? <TimerOff className="h-4 w-4" /> : <Timer className="h-4 w-4" />} </Button>
              {activeHeroSlides.map((_, index) => ( <button key={`dot-${index}`} onClick={() => goToHeroSlide(index)} className={`h-2 w-2 md:h-2.5 md:w-2.5 rounded-full cursor-pointer transition-all duration-300 ease-in-out hover:bg-white/90 ${currentHeroSlide === index ? 'bg-white scale-125 w-5 md:w-6' : 'bg-white/40 hover:bg-white/70'}`} aria-label={`Go to slide ${index + 1}`} /> ))}
              {showMuteButton && (
                  <Button variant="ghost" size="icon" onClick={handleMuteToggleClick} className="h-7 w-7 text-white/70 hover:text-white p-1" aria-label={currentCombinedMuteState ? "Unmute audio" : "Mute audio"}>
                      {currentCombinedMuteState ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
                  </Button>
              )}
            </div>
          </>
        )}
      </section>

      <section className="section-padding container-wide relative z-[1] bg-background">
        <h2 className="text-3xl font-bold tracking-tight text-center mb-12 text-foreground">Featured Collection</h2>
        {isLoadingFeaturedProducts ? ( <div className="flex justify-center items-center py-10"> <Loader2 className="h-10 w-10 animate-spin text-primary" /> </div>
        ) : featuredProducts.length > 0 ? ( <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8"> {featuredProducts.map(product => ( <ProductCard key={product.id} product={product} /> ))} </div>
        ) : ( <p className="text-center text-muted-foreground">No featured products available at the moment. Check back soon!</p> )}
        <div className="text-center mt-12"> <Link href="/products" className={cn(buttonVariants({ variant: "outline", size: "lg", className: "text-base" }))}> View All Products <ArrowRight className="ml-2 h-5 w-5" /> </Link> </div>
      </section>

      <section className="bg-card section-padding relative z-[1] overflow-hidden">
        <div className="absolute inset-0 z-0 pointer-events-none"> {activeArtisanalSlides.map((slide, index) => ( <div key={slide.id || `ars-bg-${index}`} className={cn( "absolute inset-0 transition-opacity duration-1000 ease-in-out", index === currentArtisanalSlide ? "opacity-100" : "opacity-0" )} > <Image src={slide.imageUrl} alt={slide.altText || "Artisanal background"} fill sizes="100vw" className="object-cover" data-ai-hint={slide.dataAiHint || "nepal craft texture"} /> <div className="absolute inset-0 bg-gradient-to-t from-card via-card/80 to-card/50 md:bg-gradient-to-r md:from-card md:via-card/70 md:to-transparent z-[1]"></div> </div> ))} {activeArtisanalSlides.length === 0 && <div className="absolute inset-0 bg-primary/5"></div>} </div>
        <div className="container-slim text-center md:text-left relative z-10"> <div className="md:w-1/2 lg:w-3/5"> <Sprout className="h-10 w-10 text-primary mb-4 mx-auto md:mx-0"/> <h2 className="text-3xl font-bold tracking-tight mb-6 text-foreground" dangerouslySetInnerHTML={{ __html: content.artisanalRoots?.title || "Our Artisanal Roots"}} /> <p className="text-lg text-muted-foreground mb-8 leading-relaxed prose dark:prose-invert" dangerouslySetInnerHTML={{ __html: content.artisanalRoots?.description || "Details loading..."}} /> <Link href="/our-story" className={cn(buttonVariants({ variant: "default", size: "lg", className: "text-base" }))}> <span className="flex items-center">Discover Our Story <ArrowRight className="ml-2 h-5 w-5" /></span> </Link> </div> </div>
      </section>

      {isLoadingCategories ? ( <section className="section-padding container-wide relative z-[1] bg-background"> <div className="flex justify-center items-center py-10"><Loader2 className="h-10 w-10 animate-spin text-primary" /></div></section>
      ) : categories && categories.length > 0 && (
        <section className="section-padding container-wide relative z-[1] bg-background">
          <div className="text-center mb-12"> <LayoutGrid className="h-10 w-10 text-primary mx-auto mb-3" /> <h2 className="text-3xl font-bold tracking-tight text-foreground">Shop by Category</h2> </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 md:gap-8"> {categories.slice(0, 4).map((category) => ( <Link key={category.id} href={`/products?category=${category.slug}`} className="block group"> <Card className="overflow-hidden rounded-xl shadow-lg hover:shadow-2xl transition-all duration-300 ease-in-out transform hover:-translate-y-1 h-full"> <AspectRatio ratio={1/1} className="relative bg-muted"> {category.imageUrl ? ( <Image src={category.imageUrl} alt={category.name || 'Category image'} fill sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw" className="object-cover transition-transform duration-500 group-hover:scale-110" data-ai-hint={category.aiImagePrompt || category.name.toLowerCase()} /> ) : ( <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary/10 to-secondary/10"> <LayoutGrid className="w-16 h-16 text-primary/30" /> </div> )} <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent p-4 flex flex-col justify-end"> <h3 className="text-xl md:text-2xl font-bold text-white tracking-tight text-shadow-lg group-hover:text-primary transition-colors"> {category.name} </h3> </div> </AspectRatio> </Card> </Link> ))} </div>
          {categories.length > 4 && ( <div className="text-center mt-12"> <Link href="/categories" className={cn(buttonVariants({ variant: "outline", size: "lg", className: "text-base" }))}> View All Categories <ArrowRight className="ml-2 h-5 w-5" /> </Link> </div> )}
        </section>
      )}

      {!isLoadingContent && (
        <section className="section-padding container-wide relative z-[1] bg-muted/30 overflow-hidden" onMouseEnter={() => setIsSocialCommerceHovered(true)} onMouseLeave={() => setIsSocialCommerceHovered(false)}>
          <div className="text-center mb-12"> <Instagram className="h-10 w-10 text-pink-600 mx-auto mb-3" /> <h2 className="text-3xl font-bold tracking-tight text-foreground">#PeakPulseStyle on Social</h2> <p className="text-muted-foreground mt-1 max-w-xl mx-auto"> Get inspired by our community. Tag us <code className="font-mono bg-primary/10 text-primary px-1.5 py-0.5 rounded-sm text-sm">@peakpulsenp</code> to be featured! </p> </div>
          {activeSocialCommerceItems.length > 0 ? ( <div className="relative"> <div className="overflow-hidden"> <div className="flex transition-transform duration-700 ease-in-out" style={{ transform: `translateX(-${currentSocialCommerceSlide * 100 / (activeSocialCommerceItems.length > 0 ? Math.min(activeSocialCommerceItems.length, 1) : 1)}%)` }} > {activeSocialCommerceItems.map((item, index) => ( <div key={item.id || `scs-slide-${index}`} className="w-full flex-shrink-0 px-2 md:px-4"> <Card className="overflow-hidden rounded-xl shadow-lg group mx-auto max-w-md"> <InteractiveExternalLink href={item.linkUrl} target="_blank" rel="noopener noreferrer" showDialog={true}> <div className="relative"> <AspectRatio ratio={1/1} className="relative bg-card"> <Image src={item.imageUrl} alt={item.altText || "Peak Pulse style on social media"} fill sizes="(max-width: 640px) 100vw, (max-width: 768px) 80vw, (max-width: 1024px) 50vw, 33vw" className="object-cover" data-ai-hint={item.dataAiHint || "social fashion instagram"} /> </AspectRatio> <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end p-3"> <Instagram className="h-5 w-5 text-white" /> </div> </div> </InteractiveExternalLink> </Card> </div> ))} </div> </div> {activeSocialCommerceItems.length > 1 && ( <> <Button variant="outline" size="icon" className="absolute left-0 sm:left-4 top-1/2 -translate-y-1/2 z-10 h-10 w-10 rounded-full bg-background/70 hover:bg-background" onClick={prevSocialCommerceSlide} aria-label="Previous social post"> <ChevronLeft className="h-6 w-6" /> </Button> <Button variant="outline" size="icon" className="absolute right-0 sm:right-4 top-1/2 -translate-y-1/2 z-10 h-10 w-10 rounded-full bg-background/70 hover:bg-background" onClick={nextSocialCommerceSlide} aria-label="Next social post"> <ChevronRight className="h-6 w-6" /> </Button> <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-10 flex space-x-2"> {activeSocialCommerceItems.map((_, index) => ( <button key={`social-dot-${index}`} onClick={() => goToSocialCommerceSlide(index)} className={cn( "h-2 w-2 rounded-full transition-all", currentSocialCommerceSlide === index ? "bg-primary scale-125 w-4" : "bg-muted-foreground/50 hover:bg-primary/70" )} aria-label={`Go to social post ${index + 1}`} /> ))} </div> </> )} </div>
          ) : ( <p className="text-center text-muted-foreground py-8">No social posts to display at the moment. Add some in the Admin Panel! (Admin &gt; Content &gt; Homepage)</p> )}
        </section>
      )}

      {isLoadingCollaborations ? ( <section className="section-padding container-wide relative z-[1] bg-background"><div className="flex justify-center items-center py-10"><Loader2 className="h-10 w-10 animate-spin text-primary" /></div></section>
      ): featuredCollaborations.length > 0 && (
        <section className="section-padding container-wide relative z-[1] bg-background"> <Separator className="my-0 mb-16" /> <div className="text-center mb-12"> <Handshake className="h-10 w-10 text-primary mx-auto mb-3" /> <h2 className="text-3xl font-bold tracking-tight text-foreground">Featured Collaborations</h2> <p className="text-muted-foreground mt-1 max-w-xl mx-auto">Discover unique artistic visions and creative partnerships.</p> </div> <div className="grid grid-cols-1 md:grid-cols-3 gap-8"> {featuredCollaborations.map(collab => ( <Link key={collab.id} href={`/collaborations/${collab.slug}`} className="block group"> <Card className="overflow-hidden rounded-xl shadow-lg hover:shadow-2xl transition-all duration-300 ease-in-out transform hover:-translate-y-1 h-full flex flex-col"> <AspectRatio ratio={16/10} className="relative bg-card"> {collab.cover_image_url ? ( <Image src={collab.cover_image_url} alt={collab.title || 'Collaboration cover image'} fill sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw" className="object-cover transition-transform duration-500 group-hover:scale-105" data-ai-hint={collab.ai_cover_image_prompt || collab.title.toLowerCase() || 'design art gallery'} /> ) : ( <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-accent/10 to-secondary/10"> <PaletteIcon className="w-16 h-16 text-accent/30" /> </div> )} </AspectRatio> <CardContent className="p-4 flex-grow flex flex-col justify-between"> <div> <h3 className="text-lg font-semibold text-foreground group-hover:text-primary transition-colors mb-1 line-clamp-2">{collab.title}</h3> {collab.artist_name && <p className="text-xs text-muted-foreground mb-1">By: {collab.artist_name}</p>} {collab.collaboration_date && <p className="text-xs text-muted-foreground"> {formatDisplayDate(collab.collaboration_date)}</p>} </div> <span className="text-primary text-sm font-medium mt-2 self-start group-hover:underline">View Gallery &rarr;</span> </CardContent> </Card> </Link> ))} </div> <div className="text-center mt-12"> <Link href="/collaborations" className={cn(buttonVariants({ variant: "outline", size: "lg", className: "text-base" }))}> View All Collaborations <ArrowRight className="ml-2 h-5 w-5" /> </Link> </div>
        </section>
      )}

      <section className="bg-card section-padding relative z-[1]">
        <div className="text-center mb-12"> <ImagePlayIcon className="h-10 w-10 text-primary mx-auto mb-3" /> <h2 className="text-3xl font-bold tracking-tight text-foreground">Community Spotlights</h2> <p className="text-muted-foreground mt-1 max-w-xl mx-auto">See how others are styling Peak Pulse. Share your look with #PeakPulseStyle!</p> </div>
        {isLoadingUserPosts ? ( <div className="flex justify-center items-center py-10"><Loader2 className="h-10 w-10 animate-spin text-primary" /></div>
        ) : userPosts.length > 0 ? ( <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 md:gap-8"> {userPosts.slice(0, 4).map(post => { 
            const userNameDisplay = post.user_name || 'Anonymous';
            const userProfileLink = post.user_id ? `/users/${post.user_id}` : '#'; 
            const hasLiked = user?.id && post.liked_by_user_ids?.includes(user.id); 
            return ( <Card key={post.id} className="overflow-hidden rounded-xl shadow-lg group hover:shadow-2xl transition-shadow cursor-pointer" onClick={() => handleCommunityPostClick(post)}> <AspectRatio ratio={1/1} className="relative bg-muted"> <Image src={post.image_url} alt={post.caption || `Style post by ${userNameDisplay}`} fill sizes="(max-width: 640px) 100vw, (max-width: 768px) 50vw, (max-width: 1024px) 33vw, 25vw" className="object-cover transition-transform duration-500 group-hover:scale-105" data-ai-hint="user fashion style" /> </AspectRatio> <div className="p-3 bg-background/80 backdrop-blur-sm"> <div className="flex items-center space-x-2 mb-1.5"> <Avatar className="h-7 w-7 border-border"> <AvatarImage src={post.user_avatar_url || undefined} alt={userNameDisplay} data-ai-hint="user avatar small"/> <AvatarFallback>{userNameDisplay.charAt(0).toUpperCase()}</AvatarFallback> </Avatar> {post.user_id ? ( <Link href={userProfileLink} className="text-xs font-medium text-foreground hover:text-primary truncate" onClick={(e) => e.stopPropagation()}> {userNameDisplay} </Link> ) : ( <span className="text-xs font-medium text-foreground truncate">{userNameDisplay}</span> )} </div> {post.caption && <p className="text-xs text-muted-foreground line-clamp-2 mb-1.5">{post.caption}</p>} <div className="flex items-center justify-between text-xs text-muted-foreground"> <button onClick={(e) => { e.stopPropagation(); handleLikeToggle(post.id); }} disabled={isLikingPostId === post.id || !isAuthenticated} className={cn( "flex items-center gap-1 hover:text-destructive p-1 -ml-1 rounded-md transition-colors", hasLiked ? "text-destructive" : "text-muted-foreground" )} aria-label={hasLiked ? "Unlike post" : "Like post"} > {isLikingPostId === post.id ? <Loader2 className="h-3.5 w-3.5 animate-spin"/> : <HeartIcon className={cn("h-3.5 w-3.5", hasLiked && "fill-destructive")}/>} <span>{post.like_count || 0}</span> </button> <span>{formatDistanceToNow(new Date(post.created_at), { addSuffix: true, includeSeconds: false })}</span> </div> </div> </Card> ); })} </div>
        ) : ( <p className="text-center text-muted-foreground py-8">No community posts yet. Be the first to share your style!</p> )}
        <div className="text-center mt-12"> <Link href="/community" className={cn(buttonVariants({ variant: "outline", size: "lg", className: "text-base mr-4" }))}> Explore Community </Link> <Link href="/community/create-post" className={cn(buttonVariants({ variant: "default", size: "lg", className: "text-base" }))}> <ImagePlus className="mr-2 h-5 w-5" /> Share Your Style </Link> </div>
      </section>

      {selectedPostForModal && ( <UserPostDetailModal isOpen={isPostModalOpen} onOpenChange={setIsPostModalOpen} post={userPosts.find(p => p.id === selectedPostForModal.id) || selectedPostForModal} currentUserId={user?.id} currentUser={user} onLikeToggle={handleLikeToggle} onBookmarkToggle={handleBookmarkToggle} onCommentPosted={handleCommentPosted} isLikingPostId={isLikingPostId} isBookmarkingPostId={isBookmarkingPostId} /> )}
    </>
  );
}
