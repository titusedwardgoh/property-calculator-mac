export default function SettingsAuroraLayout({ children }) {
  return (
    <div className="relative flex min-h-screen flex-col bg-gray-50">
      <div className="relative z-10 flex-1 py-8 pb-24">{children}</div>
    </div>
  );
}
