// 复古胶片盘电影摄像机（双胶片盘 + 机身 + 三脚架），金色线性风格
export default function FilmCameraIcon({ size = 26, className = '' }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 48 48"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      {/* 左胶片盘 */}
      <circle cx="15" cy="11" r="6" />
      <circle cx="15" cy="11" r="1.4" fill="currentColor" stroke="none" />
      <path d="M15 5v2M15 15v2M9 11h2M19 11h2" />
      {/* 右胶片盘 */}
      <circle cx="33" cy="11" r="6" />
      <circle cx="33" cy="11" r="1.4" fill="currentColor" stroke="none" />
      <path d="M33 5v2M33 15v2M27 11h2M37 11h2" />
      {/* 机身 */}
      <rect x="8" y="20" width="32" height="12" rx="2.5" />
      <circle cx="24" cy="26" r="3.6" />
      <circle cx="24" cy="26" r="1" fill="currentColor" stroke="none" />
      {/* 三脚架 */}
      <path d="M24 32v6M24 38l-6 5M24 38l6 5" />
    </svg>
  );
}
