import React, { useState } from 'react';
import { X, Mail, Lock, User as UserIcon, LogIn, UserPlus, Eye, EyeOff, Sparkles, CheckCircle2 } from 'lucide-react';

export default function AuthModal({ isOpen, onClose, onAuthSuccess }) {
  const [isLoginMode, setIsLoginMode] = useState(true);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    if (!email || !password || (!isLoginMode && !name)) {
      setErrorMsg('Vui lòng điền đầy đủ các thông tin bắt buộc');
      return;
    }

    if (password.length < 6) {
      setErrorMsg('Mật khẩu cần ít nhất 6 ký tự');
      return;
    }

    setLoading(true);
    try {
      const endpoint = isLoginMode ? '/api/auth/login' : '/api/auth/register';
      const payload = isLoginMode ? { email, password } : { name, email, password };

      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.message || 'Thao tác không thành công');
      }

      setSuccessMsg(data.message || (isLoginMode ? 'Đăng nhập thành công!' : 'Đăng ký thành công!'));
      
      // Store token & notify parent
      if (data.token) {
        localStorage.setItem('zingify_token', data.token);
      }
      
      setTimeout(() => {
        onAuthSuccess(data.user, data.token);
        onClose();
      }, 700);
    } catch (err) {
      setErrorMsg(err.message || 'Đã có lỗi xảy ra. Vui lòng thử lại');
    } finally {
      setLoading(false);
    }
  };

  // 1-Click Quick Demo Login for instant testing
  const handleQuickDemoLogin = async () => {
    setErrorMsg('');
    setLoading(true);
    try {
      // Demo credentials
      const demoEmail = 'demo_user@zingify.vn';
      const demoPass = 'demo123456';
      
      let res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: demoEmail, password: demoPass })
      });
      let data = await res.json();

      // If demo user doesn't exist yet, auto register it!
      if (!data.success) {
        res = await fetch('/api/auth/register', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: 'Người Yêu Âm Nhạc',
            email: demoEmail,
            password: demoPass
          })
        });
        data = await res.json();
      }

      if (data.success && data.token) {
        localStorage.setItem('zingify_token', data.token);
        setSuccessMsg('Đã đăng nhập tài khoản Trải Nghiệm!');
        setTimeout(() => {
          onAuthSuccess(data.user, data.token);
          onClose();
        }, 500);
      } else {
        throw new Error(data.message || 'Lỗi đăng nhập nhanh');
      }
    } catch (err) {
      setErrorMsg(err.message || 'Không thể đăng nhập trải nghiệm');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div 
      className="modal-overlay" 
      onClick={onClose}
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(5, 7, 15, 0.82)',
        backdropFilter: 'blur(10px)',
        zIndex: 9999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '16px'
      }}
    >
      <div 
        className="cyber-modal-card" 
        onClick={(e) => e.stopPropagation()}
        style={{
          width: '100%',
          maxWidth: '430px',
          background: 'linear-gradient(145deg, rgba(22, 27, 44, 0.95), rgba(13, 16, 27, 0.98))',
          borderRadius: '20px',
          border: '1px solid rgba(0, 242, 254, 0.3)',
          boxShadow: '0 20px 50px rgba(0, 0, 0, 0.6), 0 0 30px rgba(0, 242, 254, 0.15)',
          padding: '28px 24px',
          color: '#ffffff',
          position: 'relative',
          animation: 'fadeInScale 0.25s ease-out'
        }}
      >
        {/* Close Button */}
        <button 
          onClick={onClose}
          style={{
            position: 'absolute',
            top: '18px',
            right: '18px',
            background: 'rgba(255, 255, 255, 0.08)',
            border: 'none',
            borderRadius: '50%',
            width: '32px',
            height: '32px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#a0aec0',
            cursor: 'pointer',
            transition: 'all 0.2s ease'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = 'rgba(255, 255, 255, 0.2)';
            e.currentTarget.style.color = '#ffffff';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = 'rgba(255, 255, 255, 0.08)';
            e.currentTarget.style.color = '#a0aec0';
          }}
        >
          <X size={18} />
        </button>

        {/* Header Title */}
        <div style={{ textAlign: 'center', marginBottom: '22px' }}>
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: '48px',
            height: '48px',
            borderRadius: '14px',
            background: 'linear-gradient(135deg, #00f2fe, #4facfe)',
            color: '#08090e',
            marginBottom: '12px',
            boxShadow: '0 8px 20px rgba(0, 242, 254, 0.3)'
          }}>
            {isLoginMode ? <LogIn size={24} /> : <UserPlus size={24} />}
          </div>
          <h2 style={{ margin: 0, fontSize: '1.4rem', fontWeight: 800, letterSpacing: '0.3px' }}>
            {isLoginMode ? 'Đăng Nhập Tài Khoản' : 'Tạo Tài Khoản Mới'}
          </h2>
          <p style={{ margin: '6px 0 0 0', fontSize: '0.85rem', color: 'rgba(255, 255, 255, 0.65)' }}>
            {isLoginMode 
              ? 'Đăng nhập để nhận đề xuất video & bài hát bạn xem nhiều nhất' 
              : 'Đăng ký ngay để lưu lịch sử nghe và cá nhân hoá âm nhạc'}
          </p>
        </div>

        {/* Tab switch button */}
        <div style={{
          display: 'flex',
          background: 'rgba(255, 255, 255, 0.06)',
          borderRadius: '12px',
          padding: '4px',
          marginBottom: '20px'
        }}>
          <button
            type="button"
            onClick={() => { setIsLoginMode(true); setErrorMsg(''); setSuccessMsg(''); }}
            style={{
              flex: 1,
              padding: '8px 0',
              borderRadius: '9px',
              border: 'none',
              background: isLoginMode ? 'linear-gradient(135deg, #00f2fe, #4facfe)' : 'transparent',
              color: isLoginMode ? '#08090e' : '#cbd5e1',
              fontWeight: 700,
              fontSize: '0.88rem',
              cursor: 'pointer',
              transition: 'all 0.2s ease'
            }}
          >
            Đăng Nhập
          </button>
          <button
            type="button"
            onClick={() => { setIsLoginMode(false); setErrorMsg(''); setSuccessMsg(''); }}
            style={{
              flex: 1,
              padding: '8px 0',
              borderRadius: '9px',
              border: 'none',
              background: !isLoginMode ? 'linear-gradient(135deg, #00f2fe, #4facfe)' : 'transparent',
              color: !isLoginMode ? '#08090e' : '#cbd5e1',
              fontWeight: 700,
              fontSize: '0.88rem',
              cursor: 'pointer',
              transition: 'all 0.2s ease'
            }}
          >
            Đăng Ký
          </button>
        </div>

        {/* Feedback Messages */}
        {errorMsg && (
          <div style={{
            background: 'rgba(239, 68, 68, 0.15)',
            border: '1px solid rgba(239, 68, 68, 0.4)',
            color: '#fca5a5',
            padding: '10px 14px',
            borderRadius: '10px',
            fontSize: '0.84rem',
            marginBottom: '16px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}>
            <span>⚠️</span>
            <span>{errorMsg}</span>
          </div>
        )}

        {successMsg && (
          <div style={{
            background: 'rgba(16, 185, 129, 0.15)',
            border: '1px solid rgba(16, 185, 129, 0.4)',
            color: '#6ee7b7',
            padding: '10px 14px',
            borderRadius: '10px',
            fontSize: '0.84rem',
            marginBottom: '16px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}>
            <CheckCircle2 size={16} />
            <span>{successMsg}</span>
          </div>
        )}

        {/* Form Inputs */}
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          {!isLoginMode && (
            <div>
              <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: 'rgba(255, 255, 255, 0.8)', marginBottom: '6px' }}>
                Họ và Tên
              </label>
              <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                <UserIcon size={17} style={{ position: 'absolute', left: '12px', color: '#64748b' }} />
                <input
                  type="text"
                  placeholder="Ví dụ: Nguyễn Văn A"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '11px 12px 11px 38px',
                    borderRadius: '10px',
                    background: 'rgba(255, 255, 255, 0.05)',
                    border: '1px solid rgba(255, 255, 255, 0.12)',
                    color: '#ffffff',
                    fontSize: '0.9rem',
                    outline: 'none',
                    transition: 'border-color 0.2s'
                  }}
                  onFocus={(e) => e.target.style.borderColor = '#00f2fe'}
                  onBlur={(e) => e.target.style.borderColor = 'rgba(255, 255, 255, 0.12)'}
                  required={!isLoginMode}
                />
              </div>
            </div>
          )}

          <div>
            <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: 'rgba(255, 255, 255, 0.8)', marginBottom: '6px' }}>
              Email
            </label>
            <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
              <Mail size={17} style={{ position: 'absolute', left: '12px', color: '#64748b' }} />
              <input
                type="email"
                placeholder="name@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                style={{
                  width: '100%',
                  padding: '11px 12px 11px 38px',
                  borderRadius: '10px',
                  background: 'rgba(255, 255, 255, 0.05)',
                  border: '1px solid rgba(255, 255, 255, 0.12)',
                  color: '#ffffff',
                  fontSize: '0.9rem',
                  outline: 'none',
                  transition: 'border-color 0.2s'
                }}
                onFocus={(e) => e.target.style.borderColor = '#00f2fe'}
                onBlur={(e) => e.target.style.borderColor = 'rgba(255, 255, 255, 0.12)'}
                required
              />
            </div>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: 'rgba(255, 255, 255, 0.8)', marginBottom: '6px' }}>
              Mật khẩu (tối thiểu 6 ký tự)
            </label>
            <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
              <Lock size={17} style={{ position: 'absolute', left: '12px', color: '#64748b' }} />
              <input
                type={showPassword ? 'text' : 'password'}
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                style={{
                  width: '100%',
                  padding: '11px 40px 11px 38px',
                  borderRadius: '10px',
                  background: 'rgba(255, 255, 255, 0.05)',
                  border: '1px solid rgba(255, 255, 255, 0.12)',
                  color: '#ffffff',
                  fontSize: '0.9rem',
                  outline: 'none',
                  transition: 'border-color 0.2s'
                }}
                onFocus={(e) => e.target.style.borderColor = '#00f2fe'}
                onBlur={(e) => e.target.style.borderColor = 'rgba(255, 255, 255, 0.12)'}
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                style={{
                  position: 'absolute',
                  right: '12px',
                  background: 'none',
                  border: 'none',
                  color: '#64748b',
                  cursor: 'pointer',
                  padding: 0
                }}
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            style={{
              marginTop: '6px',
              padding: '12px',
              borderRadius: '10px',
              border: 'none',
              background: 'linear-gradient(135deg, #00f2fe, #4facfe)',
              color: '#08090e',
              fontWeight: 800,
              fontSize: '0.95rem',
              cursor: loading ? 'not-allowed' : 'pointer',
              opacity: loading ? 0.7 : 1,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              boxShadow: '0 8px 20px rgba(0, 242, 254, 0.3)',
              transition: 'all 0.2s ease'
            }}
          >
            {loading ? (
              <span>Đang xử lý...</span>
            ) : isLoginMode ? (
              <>
                <LogIn size={18} />
                <span>Đăng Nhập</span>
              </>
            ) : (
              <>
                <UserPlus size={18} />
                <span>Tạo Tài Khoản</span>
              </>
            )}
          </button>
        </form>

        {/* Divider */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          margin: '20px 0 16px 0',
          color: 'rgba(255, 255, 255, 0.3)',
          fontSize: '0.78rem'
        }}>
          <div style={{ flex: 1, height: '1px', background: 'rgba(255, 255, 255, 0.1)' }} />
          <span>HOẶC</span>
          <div style={{ flex: 1, height: '1px', background: 'rgba(255, 255, 255, 0.1)' }} />
        </div>

        {/* 1-Click Demo Login Button */}
        <button
          type="button"
          onClick={handleQuickDemoLogin}
          disabled={loading}
          style={{
            width: '100%',
            padding: '10px',
            borderRadius: '10px',
            border: '1px dashed rgba(0, 242, 254, 0.5)',
            background: 'rgba(0, 242, 254, 0.08)',
            color: '#00f2fe',
            fontWeight: 700,
            fontSize: '0.88rem',
            cursor: loading ? 'not-allowed' : 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px',
            transition: 'all 0.2s ease'
          }}
          onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(0, 242, 254, 0.16)'}
          onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(0, 242, 254, 0.08)'}
        >
          <Sparkles size={16} />
          <span>Trải Nghiệm Nhanh (1-Click Demo)</span>
        </button>
      </div>
    </div>
  );
}
