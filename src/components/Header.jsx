import React, { useState, useRef, useEffect } from 'react';
import { Search, Upload, User, ChevronLeft, ChevronRight, LogIn, LogOut, Sparkles, History, ChevronDown, Moon } from 'lucide-react';

export default function Header({ 
  searchTerm, 
  setSearchTerm, 
  onOpenUpload,
  canGoBack,
  canGoForward,
  onGoBack,
  onGoForward,
  currentUser,
  onOpenAuthModal,
  onLogout,
  onSelectRecommendationsTab,
  isChillMode,
  onToggleChillMode
}) {
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <header className="app-header">
      <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
        <div style={{ display: 'flex', gap: '6px' }}>
          <button 
            className="cyber-circle-btn"
            onClick={onGoBack}
            disabled={!canGoBack}
            style={{
              opacity: canGoBack ? 1 : 0.35,
              cursor: canGoBack ? 'pointer' : 'not-allowed',
              transition: 'all 0.2s ease'
            }}
            title="Trở lại trang trước"
          >
            <ChevronLeft size={18} />
          </button>
          <button 
            className="cyber-circle-btn"
            onClick={onGoForward}
            disabled={!canGoForward}
            style={{
              opacity: canGoForward ? 1 : 0.35,
              cursor: canGoForward ? 'pointer' : 'not-allowed',
              transition: 'all 0.2s ease'
            }}
            title="Đến trang tiếp theo"
          >
            <ChevronRight size={18} />
          </button>
        </div>

        <div className="search-bar">
          <Search size={16} color="var(--accent-secondary)" />
          <input 
            type="text"
            placeholder="Tìm bài hát, nghệ sĩ, video YouTube..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          {searchTerm && (
            <button 
              onClick={() => setSearchTerm('')}
              style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: '0.8rem' }}
            >
              ✕
            </button>
          )}
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        {/* Toggle Mode Chill */}
        <button
          onClick={onToggleChillMode}
          title={isChillMode ? "Tắt Chế độ Chill" : "Bật Chế độ Chill: Bầu trời sao đêm & sao băng rơi"}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '7px',
            padding: '7px 16px',
            borderRadius: '24px',
            border: isChillMode ? '1px solid #c084fc' : '1px solid rgba(255, 255, 255, 0.15)',
            background: isChillMode 
              ? 'linear-gradient(135deg, rgba(168, 85, 247, 0.35), rgba(99, 102, 241, 0.25))' 
              : 'rgba(255, 255, 255, 0.05)',
            color: isChillMode ? '#e9d5ff' : 'var(--text-secondary)',
            boxShadow: isChillMode ? '0 0 20px rgba(168, 85, 247, 0.5), inset 0 0 10px rgba(192, 132, 252, 0.3)' : 'none',
            cursor: 'pointer',
            fontSize: '0.84rem',
            fontWeight: 700,
            transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
            backdropFilter: 'blur(8px)'
          }}
        >
          <Moon size={15} color={isChillMode ? '#c084fc' : '#94a3b8'} />
          <span>{isChillMode ? '🌌 Mode Chill: Bật' : '🌙 Mode Chill'}</span>
        </button>

        <button className="btn-cyber-action" onClick={onOpenUpload}>
          <Upload size={16} />
          <span>Upload Nhạc</span>
        </button>

        {currentUser ? (
          /* User is Logged In */
          <div style={{ position: 'relative' }} ref={dropdownRef}>
            <button
              onClick={() => setDropdownOpen(!dropdownOpen)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                background: 'rgba(255, 255, 255, 0.08)',
                border: '1px solid rgba(0, 242, 254, 0.3)',
                borderRadius: '30px',
                padding: '4px 12px 4px 4px',
                cursor: 'pointer',
                color: '#ffffff',
                transition: 'all 0.2s ease'
              }}
              onMouseEnter={(e) => e.currentTarget.style.borderColor = '#00f2fe'}
              onMouseLeave={(e) => e.currentTarget.style.borderColor = 'rgba(0, 242, 254, 0.3)'}
            >
              <img
                src={currentUser.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&auto=format&fit=crop&q=80'}
                alt={currentUser.name}
                style={{
                  width: '32px',
                  height: '32px',
                  borderRadius: '50%',
                  objectFit: 'cover',
                  border: '1.5px solid #00f2fe'
                }}
              />
              <span style={{ fontSize: '0.86rem', fontWeight: 700, maxWidth: '120px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {currentUser.name}
              </span>
              <ChevronDown size={14} color="rgba(255, 255, 255, 0.7)" />
            </button>

            {/* User Dropdown Menu */}
            {dropdownOpen && (
              <div style={{
                position: 'absolute',
                top: 'calc(100% + 8px)',
                right: 0,
                width: '240px',
                background: 'linear-gradient(145deg, rgba(22, 27, 44, 0.98), rgba(13, 16, 27, 0.98))',
                backdropFilter: 'blur(16px)',
                borderRadius: '16px',
                border: '1px solid rgba(0, 242, 254, 0.25)',
                boxShadow: '0 12px 36px rgba(0, 0, 0, 0.7), 0 0 20px rgba(0, 242, 254, 0.1)',
                padding: '12px',
                zIndex: 1000,
                animation: 'fadeInScale 0.18s ease-out'
              }}>
                <div style={{ padding: '6px 8px 10px 8px', borderBottom: '1px solid rgba(255, 255, 255, 0.08)', marginBottom: '8px' }}>
                  <p style={{ margin: 0, fontSize: '0.92rem', fontWeight: 800, color: '#ffffff' }}>
                    {currentUser.name}
                  </p>
                  <p style={{ margin: '3px 0 0 0', fontSize: '0.74rem', color: '#94a3b8', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {currentUser.email}
                  </p>
                  <div style={{ 
                    marginTop: '8px',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '4px',
                    fontSize: '0.7rem',
                    fontWeight: 700,
                    color: '#00f2fe',
                    background: 'rgba(0, 242, 254, 0.1)',
                    padding: '2px 8px',
                    borderRadius: '6px'
                  }}>
                    ✨ Đề xuất cá nhân hoá bật
                  </div>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <button
                    onClick={() => {
                      if (onSelectRecommendationsTab) onSelectRecommendationsTab();
                      setDropdownOpen(false);
                    }}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '10px',
                      padding: '8px 10px',
                      borderRadius: '8px',
                      border: 'none',
                      background: 'transparent',
                      color: '#ffffff',
                      fontSize: '0.84rem',
                      fontWeight: 600,
                      cursor: 'pointer',
                      textAlign: 'left',
                      transition: 'background 0.2s ease'
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(0, 242, 254, 0.15)'}
                    onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                  >
                    <Sparkles size={16} color="#00f2fe" />
                    <span>Đề xuất cho tôi</span>
                  </button>

                  <button
                    onClick={() => {
                      onLogout();
                      setDropdownOpen(false);
                    }}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '10px',
                      padding: '8px 10px',
                      borderRadius: '8px',
                      border: 'none',
                      background: 'transparent',
                      color: '#f87171',
                      fontSize: '0.84rem',
                      fontWeight: 600,
                      cursor: 'pointer',
                      textAlign: 'left',
                      transition: 'background 0.2s ease',
                      marginTop: '4px',
                      borderTop: '1px solid rgba(255, 255, 255, 0.06)'
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(239, 68, 68, 0.15)'}
                    onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                  >
                    <LogOut size={16} color="#f87171" />
                    <span>Đăng xuất</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        ) : (
          /* User is Guest - Show Login Button */
          <button
            onClick={onOpenAuthModal}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '8px 16px',
              borderRadius: '24px',
              border: '1px solid rgba(0, 242, 254, 0.5)',
              background: 'linear-gradient(135deg, rgba(0, 242, 254, 0.15), rgba(79, 172, 254, 0.15))',
              color: '#00f2fe',
              fontWeight: 700,
              fontSize: '0.86rem',
              cursor: 'pointer',
              boxShadow: '0 0 15px rgba(0, 242, 254, 0.2)',
              transition: 'all 0.2s ease'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'linear-gradient(135deg, #00f2fe, #4facfe)';
              e.currentTarget.style.color = '#08090e';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'linear-gradient(135deg, rgba(0, 242, 254, 0.15), rgba(79, 172, 254, 0.15))';
              e.currentTarget.style.color = '#00f2fe';
            }}
          >
            <LogIn size={16} />
            <span>Đăng Nhập / Đăng Ký</span>
          </button>
        )}
      </div>
    </header>
  );
}
