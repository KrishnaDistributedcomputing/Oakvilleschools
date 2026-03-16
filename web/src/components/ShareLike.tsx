'use client';

import { useState, useEffect } from 'react';

interface ShareLikeProps {
  schoolName: string;
  schoolSlug: string;
  compact?: boolean;
}

export default function ShareLike({ schoolName, schoolSlug, compact = false }: ShareLikeProps) {
  const [liked, setLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(0);
  const [showShareMenu, setShowShareMenu] = useState(false);
  const [copied, setCopied] = useState(false);

  const storageKey = `liked_${schoolSlug}`;
  const countKey = `likes_${schoolSlug}`;

  useEffect(() => {
    setLiked(localStorage.getItem(storageKey) === 'true');
    setLikeCount(parseInt(localStorage.getItem(countKey) || '0', 10));
  }, [storageKey, countKey]);

  const toggleLike = () => {
    const newLiked = !liked;
    setLiked(newLiked);
    const newCount = newLiked ? likeCount + 1 : Math.max(0, likeCount - 1);
    setLikeCount(newCount);
    localStorage.setItem(storageKey, String(newLiked));
    localStorage.setItem(countKey, String(newCount));
  };

  const pageUrl = typeof window !== 'undefined'
    ? `${window.location.origin}/schools/${schoolSlug}`
    : `/schools/${schoolSlug}`;

  const shareText = `Check out ${schoolName} on Oakville Schools Directory`;

  const shareLinks = {
    facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(pageUrl)}`,
    twitter: `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(pageUrl)}`,
    whatsapp: `https://wa.me/?text=${encodeURIComponent(shareText + ' ' + pageUrl)}`,
    linkedin: `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(pageUrl)}`,
    email: `mailto:?subject=${encodeURIComponent(schoolName + ' — Oakville Schools')}&body=${encodeURIComponent(shareText + '\n\n' + pageUrl)}`,
  };

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(pageUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // fallback
      const input = document.createElement('input');
      input.value = pageUrl;
      document.body.appendChild(input);
      input.select();
      document.execCommand('copy');
      document.body.removeChild(input);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const nativeShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({ title: schoolName, text: shareText, url: pageUrl });
      } catch {}
    } else {
      setShowShareMenu(!showShareMenu);
    }
  };

  if (compact) {
    return (
      <div className="share-like-compact">
        <button
          className={`like-btn-sm ${liked ? 'liked' : ''}`}
          onClick={(e) => { e.preventDefault(); e.stopPropagation(); toggleLike(); }}
          aria-label={liked ? `Unlike ${schoolName}` : `Like ${schoolName}`}
          title={liked ? 'Remove from favourites' : 'Add to favourites'}
        >
          {liked ? '❤️' : '🤍'}
        </button>
        <button
          className="share-btn-sm"
          onClick={(e) => { e.preventDefault(); e.stopPropagation(); nativeShare(); }}
          aria-label={`Share ${schoolName}`}
          title="Share"
        >
          📤
        </button>
      </div>
    );
  }

  return (
    <div className="share-like-bar">
      <button
        className={`like-btn ${liked ? 'liked' : ''}`}
        onClick={toggleLike}
        aria-label={liked ? `Unlike ${schoolName}` : `Like ${schoolName}`}
        aria-pressed={liked}
      >
        <span className="like-icon">{liked ? '❤️' : '🤍'}</span>
        <span className="like-text">{liked ? 'Saved' : 'Save'}</span>
        {likeCount > 0 && <span className="like-count">{likeCount}</span>}
      </button>

      <div className="share-wrap">
        <button
          className="share-btn"
          onClick={nativeShare}
          aria-label="Share this school"
          aria-expanded={showShareMenu}
        >
          📤 Share
        </button>

        {showShareMenu && (
          <div className="share-menu" role="menu" aria-label="Share options">
            <a href={shareLinks.facebook} target="_blank" rel="noopener noreferrer" role="menuitem" className="share-option">
              <span className="share-icon">📘</span> Facebook
            </a>
            <a href={shareLinks.twitter} target="_blank" rel="noopener noreferrer" role="menuitem" className="share-option">
              <span className="share-icon">🐦</span> Twitter / X
            </a>
            <a href={shareLinks.whatsapp} target="_blank" rel="noopener noreferrer" role="menuitem" className="share-option">
              <span className="share-icon">💬</span> WhatsApp
            </a>
            <a href={shareLinks.linkedin} target="_blank" rel="noopener noreferrer" role="menuitem" className="share-option">
              <span className="share-icon">💼</span> LinkedIn
            </a>
            <a href={shareLinks.email} role="menuitem" className="share-option">
              <span className="share-icon">📧</span> Email
            </a>
            <button onClick={copyLink} role="menuitem" className="share-option share-copy">
              <span className="share-icon">🔗</span> {copied ? 'Copied!' : 'Copy Link'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
