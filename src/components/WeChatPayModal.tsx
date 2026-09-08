import React, { useState } from 'react';
import { X, CheckCircle2, Heart, ShieldCheck } from 'lucide-react';

interface WeChatPayModalProps {
  onClose: () => void;
}

export const WeChatPayModal: React.FC<WeChatPayModalProps> = ({ onClose }) => {
  const [thankYou, setThankYou] = useState(false);

  const handleFinish = () => {
    setThankYou(true);
    setTimeout(() => {
      onClose();
    }, 1600);
  };

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="bg-[#07C160] rounded-3xl max-w-[360px] w-full overflow-hidden shadow-2xl relative animate-in fade-in zoom-in-95 duration-200 border border-emerald-400/30 text-white">
        {/* Top Close Button */}
        <button
          onClick={onClose}
          className="absolute top-3 right-3 text-white/80 hover:text-white bg-black/20 hover:bg-black/40 p-1.5 rounded-full z-20 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Top WeChat Green Header matching image */}
        <div className="pt-8 pb-5 px-6 text-center relative">
          <h3 className="text-white font-bold text-xl sm:text-2xl tracking-tight flex items-center justify-center gap-2">
            推荐使用微信支付
          </h3>
          <p className="text-white/80 text-xs mt-1">
            开发者打赏赞赏通道（自愿支持，无实际数值效果）
          </p>
        </div>

        {/* Main White QR Card matching user's image */}
        <div className="px-5 pb-6">
          <div className="bg-white rounded-2xl p-5 shadow-2xl text-center space-y-4 border border-gray-100">
            {/* QR Code Container */}
            <div className="relative mx-auto w-56 h-56 p-2 bg-white rounded-xl flex flex-col items-center justify-center">
              {/* High precision SVG QR Code */}
              <svg viewBox="0 0 200 200" className="w-full h-full">
                {/* QR Background */}
                <rect x="0" y="0" width="200" height="200" fill="#ffffff" />

                {/* Finder Pattern Top-Left */}
                <rect x="8" y="8" width="54" height="54" fill="#000000" rx="6" />
                <rect x="16" y="16" width="38" height="38" fill="#ffffff" rx="3" />
                <rect x="24" y="24" width="22" height="22" fill="#000000" rx="2" />

                {/* Finder Pattern Top-Right */}
                <rect x="138" y="8" width="54" height="54" fill="#000000" rx="6" />
                <rect x="146" y="16" width="38" height="38" fill="#ffffff" rx="3" />
                <rect x="154" y="24" width="22" height="22" fill="#000000" rx="2" />

                {/* Finder Pattern Bottom-Left */}
                <rect x="8" y="138" width="54" height="54" fill="#000000" rx="6" />
                <rect x="16" y="146" width="38" height="38" fill="#ffffff" rx="3" />
                <rect x="24" y="154" width="22" height="22" fill="#000000" rx="2" />

                {/* Alignment Patterns & Matrix Data Dots */}
                <g fill="#000000">
                  {/* Timing lines & modules */}
                  <rect x="68" y="14" width="8" height="8" />
                  <rect x="84" y="14" width="8" height="8" />
                  <rect x="100" y="14" width="8" height="8" />
                  <rect x="116" y="14" width="8" height="8" />

                  <rect x="68" y="30" width="8" height="8" />
                  <rect x="92" y="30" width="8" height="8" />
                  <rect x="108" y="30" width="8" height="8" />
                  <rect x="124" y="30" width="8" height="8" />

                  <rect x="76" y="46" width="8" height="8" />
                  <rect x="100" y="46" width="8" height="8" />
                  <rect x="116" y="46" width="8" height="8" />

                  <rect x="14" y="68" width="8" height="8" />
                  <rect x="30" y="68" width="8" height="8" />
                  <rect x="46" y="68" width="8" height="8" />
                  <rect x="68" y="68" width="8" height="8" />
                  <rect x="84" y="68" width="8" height="8" />
                  <rect x="108" y="68" width="8" height="8" />
                  <rect x="124" y="68" width="8" height="8" />
                  <rect x="146" y="68" width="8" height="8" />
                  <rect x="162" y="68" width="8" height="8" />
                  <rect x="178" y="68" width="8" height="8" />

                  <rect x="22" y="84" width="8" height="8" />
                  <rect x="38" y="84" width="8" height="8" />
                  <rect x="138" y="84" width="8" height="8" />
                  <rect x="154" y="84" width="8" height="8" />
                  <rect x="170" y="84" width="8" height="8" />

                  <rect x="14" y="100" width="8" height="8" />
                  <rect x="30" y="100" width="8" height="8" />
                  <rect x="46" y="100" width="8" height="8" />
                  <rect x="146" y="100" width="8" height="8" />
                  <rect x="162" y="100" width="8" height="8" />
                  <rect x="178" y="100" width="8" height="8" />

                  <rect x="22" y="116" width="8" height="8" />
                  <rect x="38" y="116" width="8" height="8" />
                  <rect x="54" y="116" width="8" height="8" />
                  <rect x="138" y="116" width="8" height="8" />
                  <rect x="154" y="116" width="8" height="8" />

                  <rect x="68" y="138" width="8" height="8" />
                  <rect x="84" y="138" width="8" height="8" />
                  <rect x="100" y="138" width="8" height="8" />
                  <rect x="116" y="138" width="8" height="8" />
                  <rect x="146" y="138" width="8" height="8" />
                  <rect x="170" y="138" width="8" height="8" />

                  <rect x="76" y="154" width="8" height="8" />
                  <rect x="92" y="154" width="8" height="8" />
                  <rect x="108" y="154" width="8" height="8" />
                  <rect x="130" y="154" width="8" height="8" />
                  <rect x="154" y="154" width="8" height="8" />

                  <rect x="68" y="170" width="8" height="8" />
                  <rect x="84" y="170" width="8" height="8" />
                  <rect x="100" y="170" width="8" height="8" />
                  <rect x="124" y="170" width="8" height="8" />
                  <rect x="146" y="170" width="8" height="8" />
                  <rect x="162" y="170" width="8" height="8" />
                  <rect x="178" y="170" width="8" height="8" />
                </g>

                {/* Center Avatar Box (Monkey Avatar from User Image) */}
                <rect x="70" y="70" width="60" height="60" fill="#ffffff" rx="12" stroke="#e5e7eb" strokeWidth="1.5" />
                
                {/* Cute Cartoon Monkey Drawing */}
                {/* Background hill/landscape inside avatar */}
                <rect x="72" y="72" width="56" height="56" fill="#f0fdf4" rx="10" clipPath="url(#avatarClip)" />
                <defs>
                  <clipPath id="avatarClip">
                    <rect x="72" y="72" width="56" height="56" rx="10" />
                  </clipPath>
                </defs>

                {/* Sky blue top */}
                <path d="M 72 72 L 128 72 L 128 100 L 72 100 Z" fill="#e0f2fe" />
                {/* Green grass hill */}
                <ellipse cx="100" cy="118" rx="35" ry="18" fill="#86efac" />
                
                {/* Monkey Head */}
                {/* Ears */}
                <circle cx="88" cy="98" r="6" fill="#8d5b4c" />
                <circle cx="88" cy="98" r="3.5" fill="#fbcfe8" />
                <circle cx="112" cy="98" r="6" fill="#8d5b4c" />
                <circle cx="112" cy="98" r="3.5" fill="#fbcfe8" />
                
                {/* Outer Head */}
                <circle cx="100" cy="98" r="14" fill="#8d5b4c" />
                {/* Face Mask */}
                <ellipse cx="100" cy="100" rx="10" ry="8" fill="#fde68a" />
                
                {/* Eyes */}
                <circle cx="96" cy="97" r="2" fill="#000" />
                <circle cx="104" cy="97" r="2" fill="#000" />
                <circle cx="95.5" cy="96.5" r="0.7" fill="#fff" />
                <circle cx="103.5" cy="96.5" r="0.7" fill="#fff" />
                
                {/* Mouth & Nose */}
                <ellipse cx="100" cy="102" rx="2" ry="1" fill="#000" />
                <path d="M 97 104 Q 100 107 103 104" stroke="#000" strokeWidth="1" fill="none" />

                {/* Red Scarf */}
                <path d="M 90 108 C 90 105, 110 105, 110 108 L 112 114 L 88 114 Z" fill="#ef4444" />
                <rect x="96" y="112" width="5" height="12" fill="#dc2626" rx="1" />
              </svg>

              {/* Green Verified Checkmark Badge on bottom right of Avatar */}
              <div className="absolute top-[114px] right-[62px] bg-[#07C160] rounded-full p-0.5 border-2 border-white shadow-md">
                <CheckCircle2 className="w-4 h-4 text-white stroke-[3]" />
              </div>
            </div>

            {/* Username from User Attachment */}
            <div className="text-gray-900 text-sm font-bold font-mono tracking-tight pt-1">
              Undefined(**乐)
            </div>

            {/* Notice label */}
            <div className="bg-emerald-50 border border-emerald-200/80 rounded-lg p-2 text-[11px] text-emerald-800">
              任意金额打赏鼓励开发者 (自愿扫码，无效果与扣费)
            </div>
          </div>

          {/* Bottom Branding & Action */}
          <div className="mt-5 text-center space-y-3">
            {/* WeChat Pay Big White Logo */}
            <div className="flex items-center justify-center gap-2 text-white font-black text-xl tracking-wide">
              <div className="w-6 h-6 bg-white rounded-full flex items-center justify-center text-[#07C160]">
                <CheckCircle2 className="w-5 h-5 fill-[#07C160] text-white" />
              </div>
              <span>微信支付</span>
            </div>

            {/* Action buttons */}
            {thankYou ? (
              <div className="w-full py-3 bg-white text-[#07C160] font-bold rounded-xl text-xs flex items-center justify-center gap-1.5 shadow-lg animate-bounce">
                <Heart className="w-4 h-4 fill-[#07C160]" /> 感谢您的支持与鼓励！游戏愉快！
              </div>
            ) : (
              <button
                onClick={handleFinish}
                className="w-full py-3 bg-white hover:bg-slate-100 text-[#07C160] font-black rounded-xl text-xs uppercase tracking-tight shadow-lg transition-transform active:scale-98 flex items-center justify-center gap-1.5"
              >
                我已了解 / 关闭窗口
              </button>
            )}

            <p className="text-[10px] text-white/70 flex items-center justify-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5 text-white/80" /> 绿色安全扫码 · 纯赞赏性质
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

