import React, { useState } from 'react';
import { X, Upload, Camera, Edit3 } from 'lucide-react';

export default function EditPlaylistModal({ playlist, onClose, onSaveSuccess }) {
  const [title, setTitle] = useState(playlist.title || '');
  const [description, setDescription] = useState(playlist.description || '');
  const [coverUrl, setCoverUrl] = useState(playlist.cover || '');
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  // Handle image file upload
  const handleImageFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setUploading(true);
    setError('');

    const formData = new FormData();
    formData.append('image', file);

    try {
      const res = await fetch('/api/upload-image', {
        method: 'POST',
        body: formData
      });
      const data = await res.json();
      if (data.success && data.url) {
        setCoverUrl(data.url);
      } else {
        setError(data.message || 'Lỗi khi tải ảnh lên');
      }
    } catch (err) {
      console.error(err);
      setError('Lỗi khi tải ảnh từ máy tính.');
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!title.trim()) {
      setError('Vui lòng nhập tên Playlist!');
      return;
    }

    setSaving(true);
    setError('');

    try {
      const res = await fetch(`/api/playlists/${playlist.id || playlist._id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, description, cover: coverUrl })
      });
      const data = await res.json();
      if (data.success && data.data) {
        onSaveSuccess(data.data);
        onClose();
      } else {
        setError(data.message || 'Lỗi khi cập nhật Playlist');
      }
    } catch (err) {
      console.error(err);
      setError('Không thể kết nối máy chủ.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      background: 'rgba(0, 0, 0, 0.75)',
      backdropFilter: 'blur(8px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 9999,
      padding: '20px'
    }}>
      <div style={{
        background: '#12141d',
        border: '1px solid rgba(0, 242, 254, 0.35)',
        borderRadius: '16px',
        width: '100%',
        maxWidth: '480px',
        padding: '28px',
        boxShadow: '0 20px 50px rgba(0, 0, 0, 0.8), 0 0 35px rgba(0, 242, 254, 0.18)',
        position: 'relative'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: 'linear-gradient(135deg, #00f2fe, #4facfe)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Edit3 size={20} color="#08090e" />
            </div>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#ffffff', margin: 0 }}>Chỉnh Sửa Playlist</h2>
          </div>
          <button 
            onClick={onClose}
            style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: '4px' }}
          >
            <X size={20} />
          </button>
        </div>

        {error && (
          <div style={{ background: 'rgba(255, 42, 116, 0.15)', border: '1px solid #ff2a74', color: '#ff2a74', padding: '10px 14px', borderRadius: '8px', fontSize: '0.85rem', marginBottom: '16px' }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
          {/* Cover Preview & Upload Button */}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px', padding: '16px', background: 'rgba(255,255,255,0.03)', borderRadius: '12px', border: '1px dashed rgba(0, 242, 254, 0.3)' }}>
            <div style={{ position: 'relative', width: '110px', height: '110px' }}>
              <img 
                src={coverUrl || 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=500&auto=format&fit=crop&q=80'}
                alt="Cover Preview"
                style={{ width: '100%', height: '100%', borderRadius: '10px', objectFit: 'cover', border: '2px solid #00f2fe' }}
              />
              <label 
                htmlFor="playlist-cover-file"
                style={{
                  position: 'absolute',
                  bottom: '-6px',
                  right: '-6px',
                  width: '32px',
                  height: '32px',
                  borderRadius: '50%',
                  background: '#00f2fe',
                  color: '#08090e',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  boxShadow: '0 0 10px rgba(0,242,254,0.6)'
                }}
                title="Tải ảnh bìa từ máy tính"
              >
                <Camera size={16} />
              </label>
              <input 
                id="playlist-cover-file" 
                type="file" 
                accept="image/*"
                onChange={handleImageFileChange}
                style={{ display: 'none' }}
              />
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', width: '100%' }}>
              <label 
                htmlFor="playlist-cover-file"
                style={{
                  flex: 1,
                  padding: '8px 12px',
                  borderRadius: '8px',
                  background: 'rgba(0, 242, 254, 0.15)',
                  border: '1px solid rgba(0, 242, 254, 0.4)',
                  color: '#00f2fe',
                  fontSize: '0.82rem',
                  fontWeight: 700,
                  textAlign: 'center',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px'
                }}
              >
                <Upload size={14} /> {uploading ? 'Đang tải ảnh...' : 'Tải Ảnh Bìa Mới Từ Máy'}
              </label>
            </div>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '6px' }}>
              Link Ảnh Bìa (Tùy chọn dán URL)
            </label>
            <input 
              type="text"
              placeholder="https://images.unsplash.com/..."
              value={coverUrl}
              onChange={(e) => setCoverUrl(e.target.value)}
              style={{
                width: '100%',
                padding: '12px 14px',
                borderRadius: '8px',
                background: 'rgba(255, 255, 255, 0.06)',
                border: '1px solid rgba(255, 255, 255, 0.12)',
                color: '#ffffff',
                fontSize: '0.9rem',
                outline: 'none'
              }}
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '6px' }}>
              Tên Playlist *
            </label>
            <input 
              type="text"
              placeholder="Nhập tên Playlist..."
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              style={{
                width: '100%',
                padding: '12px 14px',
                borderRadius: '8px',
                background: 'rgba(255, 255, 255, 0.06)',
                border: '1px solid rgba(255, 255, 255, 0.12)',
                color: '#ffffff',
                fontSize: '0.9rem',
                outline: 'none'
              }}
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '6px' }}>
              Mô Tả Playlist
            </label>
            <textarea 
              rows={3}
              placeholder="Nhập mô tả cho Playlist này..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              style={{
                width: '100%',
                padding: '12px 14px',
                borderRadius: '8px',
                background: 'rgba(255, 255, 255, 0.06)',
                border: '1px solid rgba(255, 255, 255, 0.12)',
                color: '#ffffff',
                fontSize: '0.9rem',
                outline: 'none',
                resize: 'none'
              }}
            />
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '10px' }}>
            <button
              type="button"
              onClick={onClose}
              style={{
                padding: '10px 18px',
                borderRadius: '20px',
                background: 'rgba(255, 255, 255, 0.08)',
                border: 'none',
                color: '#ffffff',
                fontWeight: 600,
                fontSize: '0.85rem',
                cursor: 'pointer'
              }}
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={saving || uploading}
              style={{
                padding: '10px 24px',
                borderRadius: '20px',
                background: 'linear-gradient(135deg, #00f2fe, #00f5d4)',
                border: 'none',
                color: '#08090e',
                fontWeight: 800,
                fontSize: '0.85rem',
                cursor: 'pointer',
                boxShadow: '0 0 20px rgba(0, 242, 254, 0.4)'
              }}
            >
              {saving ? 'Đang lưu...' : 'Lưu Thay Đổi'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
