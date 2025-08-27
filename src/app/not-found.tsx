import Image from 'next/image';
import { Fredoka } from 'next/font/google';
const fredoka = Fredoka({ subsets: ['latin'], weight: ['400', '700'] });

export default function NotFound() {
  return (
  <main className={fredoka.className} style={{ minHeight: '60vh', display: 'grid', placeItems: 'center', padding: '2rem' }}>
      {/* Inline keyframes for the rotating hill */}
      <style>{`
        @keyframes hillSpin {
          from { transform: translateX(-50%) rotate(0deg); }
          to { transform: translateX(-50%) rotate(360deg); }
        }
      `}</style>
      <div style={{ textAlign: 'center' }}>
        <div style={{ position: 'relative', display: 'inline-block' }}>
          <Image src="/cow_anim.gif" alt="Walking cow" width={256} height={256} priority />
        </div>
        {/* Hill sits below the cow so it isn't covered by the GIF */}
        <div
          aria-hidden
          style={{
            position: 'relative',
            height: 80,
            marginTop: -8,
            overflow: 'hidden',
          }}
        >
          {/* Big circle positioned below, only the top arc shows as a hill */}
          <div
            style={{
              position: 'absolute',
              left: '50%',
              bottom: -340,
              width: 420,
              height: 420,
              borderRadius: '50%',
              background:
                'radial-gradient(circle at 50% 45%, #5bc56f 0%, #34a853 55%, #2e7d32 85%, #1b5e20 100%)',
              transform: 'translateX(-50%)',
              transformOrigin: '50% 50%',
              animation: 'hillSpin 16s linear infinite',
            }}
          />
        </div>
  <p style={{ marginTop: 16, fontSize: 24 }}>What you&apos;re looking for is not here!</p>
      </div>
    </main>
  );
}
