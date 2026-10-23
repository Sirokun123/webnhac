import React from 'react';
import { Sparkles } from 'lucide-react';

export default function GenreGrid({ onSelectGenre }) {
  const genres = [
    { name: 'Pop', bg: 'linear-gradient(135deg, #a238ff, #ff2a74)', img: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=400&auto=format&fit=crop&q=80' },
    { name: 'EDM', bg: 'linear-gradient(135deg, #00f2fe, #4facfe)', img: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=400&auto=format&fit=crop&q=80' },
    { name: 'Lofi', bg: 'linear-gradient(135deg, #ffb703, #fb8500)', img: 'https://images.unsplash.com/photo-1508700115892-45ecd05ae2ad?w=400&auto=format&fit=crop&q=80' },
    { name: 'Rap', bg: 'linear-gradient(135deg, #ff007f, #7928ca)', img: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=400&auto=format&fit=crop&q=80' },
    { name: 'Ballad', bg: 'linear-gradient(135deg, #43e97b, #38f9d7)', img: 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=400&auto=format&fit=crop&q=80' },
  ];

  return (
    <div>
      <h3 style={{ fontSize: '1.4rem', fontWeight: 700, marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
        <Sparkles color="var(--accent-secondary)" /> Thể Loại Nhạc Nổi Bật
      </h3>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(190px, 1fr))', gap: '20px' }}>
        {genres.map((g) => (
          <div
            key={g.name}
            onClick={() => onSelectGenre(g.name)}
            style={{
              background: g.bg,
              borderRadius: 'var(--radius-md)',
              height: '120px',
              padding: '16px',
              position: 'relative',
              overflow: 'hidden',
              cursor: 'pointer',
              boxShadow: '0 8px 20px rgba(0,0,0,0.3)',
              transition: 'transform 0.3s ease'
            }}
            onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-4px)'}
            onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}
          >
            <span style={{ fontSize: '1.4rem', fontWeight: 800, color: '#fff' }}>{g.name}</span>
            <img 
              src={g.img} 
              alt={g.name}
              style={{
                position: 'absolute',
                right: '-10px',
                bottom: '-10px',
                width: '80px',
                height: '80px',
                borderRadius: '12px',
                transform: 'rotate(25deg)',
                objectFit: 'cover',
                boxShadow: '0 4px 10px rgba(0,0,0,0.4)'
              }}
            />
          </div>
        ))}
      </div>
    </div>
  );
}
