// src/components/NauticalIcons.jsx
import React from 'react';

/**
 * Mũ Rơm Luffy (Straw Hat) - Biểu tượng phiêu lưu One Piece
 */
export function StrawHatIcon({ className = "w-6 h-6" }) {
  return (
    <svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
      {/* Vành mũ rơm uốn cong tự nhiên */}
      <ellipse cx="32" cy="39" rx="28" ry="10" fill="#FBBF24" stroke="#B45309" strokeWidth="2.5" />
      <ellipse cx="32" cy="38" rx="26" ry="8" fill="#FDE68A" opacity="0.35" />

      {/* Chao chóp mũ rơm */}
      <path
        d="M19.5 37 C18.5 22, 23.5 15, 32 15 C40.5 15, 45.5 22, 44.5 37 Z"
        fill="#FBBF24"
        stroke="#B45309"
        strokeWidth="2.5"
        strokeLinejoin="round"
      />

      {/* Dải ruy-băng đỏ đặc trưng của Luffy */}
      <path
        d="M19 33.5 C23 31.5, 41 31.5, 45 33.5 L45.2 38 C41 36, 23 36, 18.8 38 Z"
        fill="#EF4444"
        stroke="#B91C1C"
        strokeWidth="1.5"
      />

      {/* Gân đan sợi rơm vàng */}
      <path d="M26 21C28 20 36 20 38 21" stroke="#D97706" strokeWidth="1.5" strokeLinecap="round" />
      <path d="M23 27C27 25.5 37 25.5 41 27" stroke="#D97706" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

/**
 * Ngọn Sóng Biển Lớn (Ukiyo-e Ocean Wave) - Biểu tượng vượt sóng phản xạ
 */
export function OceanWavesIcon({ className = "w-6 h-6" }) {
  return (
    <svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
      {/* Tầng sóng đại dương sâu */}
      <path
        d="M4 44C12 40 18 36 26 40C34 44 40 40 48 38C54 36 58 40 60 42V56H4V44Z"
        fill="#0369A1"
        opacity="0.45"
      />
      {/* Tầng sóng cuộn trào */}
      <path
        d="M4 50C10 50 14 42 22 42C30 42 34 50 42 50C50 50 54 44 60 44V56H4V50Z"
        fill="#0284C7"
      />
      {/* Ngọn sóng đại dương cuộn xoáy phong cách Great Wave */}
      <path
        d="M6 38 C14 36, 18 19, 28 19 C36 19, 38 31, 46 31 C52 31, 54 27, 58 25"
        stroke="#38BDF8"
        strokeWidth="3.5"
        strokeLinecap="round"
      />
      {/* Bọt sóng trắng cuộn trào */}
      <path
        d="M24 19C26 15 30 14 32 16C30 18 28 21 28 24"
        stroke="#F0F9FF"
        strokeWidth="2.5"
        strokeLinecap="round"
      />
      {/* Hạt bọt nước tung bay */}
      <circle cx="23" cy="13" r="2.2" fill="#BAE6FD" />
      <circle cx="31" cy="11" r="1.6" fill="#E0F2FE" />
      <circle cx="37" cy="13" r="2.2" fill="#BAE6FD" />
      <circle cx="48" cy="27" r="1.6" fill="#E0F2FE" />
      <circle cx="17" cy="25" r="1.4" fill="#BAE6FD" />
    </svg>
  );
}

/**
 * Thuyền Buồm Hải Tặc Vượt Đại Dương (Pirate Ship)
 */
export function PirateShipIcon({ className = "w-6 h-6" }) {
  return (
    <svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
      {/* Thân thuyền gỗ mộc */}
      <path
        d="M12 40C16 50 48 50 52 40H12Z"
        fill="#78350F"
        stroke="#B45309"
        strokeWidth="2.5"
      />
      {/* Mũi tàu hướng ra đại dương */}
      <path d="M52 40L58 35" stroke="#F59E0B" strokeWidth="3" strokeLinecap="round" />
      {/* Cột buồm chính */}
      <path d="M32 12V40" stroke="#92400E" strokeWidth="3" strokeLinecap="round" />
      {/* Cánh buồm lớn đón gió */}
      <path
        d="M33 14C47 16 47 34 33 36V14Z"
        fill="#F8FAFC"
        stroke="#E2E8F0"
        strokeWidth="2"
      />
      {/* Biểu tượng Mũ Rơm trên cánh buồm */}
      <ellipse cx="40" cy="26" rx="4.5" ry="2" fill="#F59E0B" />
      <rect x="38" y="24" width="4" height="1.5" fill="#EF4444" />
      {/* Cờ hải tặc đỏ tung bay trên đỉnh */}
      <path d="M32 12L24 16L32 19V12Z" fill="#EF4444" />
      {/* Làn sóng biển dập dềnh */}
      <path
        d="M6 46C14 43 18 48 26 46C34 44 40 49 48 46C54 44 58 47 62 45"
        stroke="#38BDF8"
        strokeWidth="3"
        strokeLinecap="round"
      />
    </svg>
  );
}

/**
 * La Bàn Grand Line Log Pose (Định hướng hải trình)
 */
export function LogPoseCompassIcon({ className = "w-6 h-6" }) {
  return (
    <svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
      {/* Dây đeo cổ tay da nâu của hoa tiêu Nami */}
      <rect x="25" y="4" width="14" height="56" rx="4" fill="#78350F" stroke="#92400E" strokeWidth="2" />
      {/* Quả cầu kính la bàn tròn xoay */}
      <circle cx="32" cy="32" r="22" fill="#0C4A6E" stroke="#38BDF8" strokeWidth="3" />
      <circle cx="32" cy="32" r="17" fill="#082F49" />
      {/* Kim chỉ nam đỏ - trắng */}
      <polygon points="32,18 36,32 32,30" fill="#EF4444" />
      <polygon points="32,46 36,32 32,30" fill="#E2E8F0" />
      <polygon points="32,18 28,32 32,30" fill="#DC2626" />
      <polygon points="32,46 28,32 32,30" fill="#94A3B8" />
      {/* Trục la bàn vàng kim */}
      <circle cx="32" cy="32" r="3" fill="#F59E0B" stroke="#B45309" strokeWidth="1.5" />
      {/* Vệt phản quang mặt kính */}
      <path d="M19 22C24 17 34 17 43 22" stroke="#BAE6FD" strokeWidth="2" strokeLinecap="round" opacity="0.65" />
    </svg>
  );
}

/**
 * Mũ Bác Sĩ Chopper Dễ Thương (Mascot One Piece)
 */
export function ChopperHatIcon({ className = "w-6 h-6" }) {
  return (
    <svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
      {/* Cặp gạc hươu hai bên */}
      <path d="M18 28C14 24 12 16 10 14M13 20C10 18 8 18 6 20" stroke="#78350F" strokeWidth="2.5" strokeLinecap="round" />
      <path d="M46 28C50 24 52 16 54 14M51 20C54 18 56 18 58 20" stroke="#78350F" strokeWidth="2.5" strokeLinecap="round" />
      {/* Thân mũ tròn màu hồng đặc trưng của Chopper */}
      <circle cx="32" cy="36" r="18" fill="#EC4899" stroke="#BE185D" strokeWidth="2.5" />
      {/* Vành mũ bẻ gập */}
      <ellipse cx="32" cy="48" rx="20" ry="6" fill="#DB2777" stroke="#9D174D" strokeWidth="2" />
      {/* Dấu thập y tế trắng */}
      <rect x="29" y="27" width="6" height="18" rx="2" fill="#FFFFFF" />
      <rect x="23" y="33" width="18" height="6" rx="2" fill="#FFFFFF" />
    </svg>
  );
}

/**
 * Mặt trời Sư Tử Thousand Sunny (Lạc quan, rạng rỡ)
 */
export function SunnyMascotIcon({ className = "w-6 h-6" }) {
  const petals = [0, 30, 60, 90, 120, 150, 180, 210, 240, 270, 300, 330];
  return (
    <svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
      {/* Cánh bờm hoa hướng dương */}
      {petals.map((deg) => (
        <circle
          key={deg}
          cx={32 + 18 * Math.cos((deg * Math.PI) / 180)}
          cy={32 + 18 * Math.sin((deg * Math.PI) / 180)}
          r="4.5"
          fill="#F59E0B"
        />
      ))}
      {/* Mặt sư tử vàng tươi */}
      <circle cx="32" cy="32" r="16" fill="#FCD34D" stroke="#D97706" strokeWidth="2" />
      {/* Đôi mắt tinh nghịch */}
      <circle cx="26" cy="28" r="2.5" fill="#1E293B" />
      <circle cx="38" cy="28" r="2.5" fill="#1E293B" />
      <circle cx="27" cy="27" r="0.9" fill="#FFFFFF" />
      <circle cx="39" cy="27" r="0.9" fill="#FFFFFF" />
      {/* Mũi nhỏ */}
      <circle cx="32" cy="32" r="1.5" fill="#B45309" />
      {/* Nụ cười vui vẻ */}
      <path d="M26 35 C28 39, 36 39, 38 35" stroke="#92400E" strokeWidth="2" strokeLinecap="round" fill="#EF4444" />
      {/* Má hồng */}
      <circle cx="23" cy="33" r="2" fill="#F87171" opacity="0.65" />
      <circle cx="41" cy="33" r="2" fill="#F87171" opacity="0.65" />
    </svg>
  );
}
