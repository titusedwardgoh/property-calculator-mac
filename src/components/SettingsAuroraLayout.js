export default function SettingsAuroraLayout({ children }) {
  return (
    <div className="relative flex min-h-screen flex-col">
      <div className="settings-aurora-bg" aria-hidden="true">
        <span className="settings-aurora-blob settings-aurora-blob--1" />
        <span className="settings-aurora-blob settings-aurora-blob--2" />
        <span className="settings-aurora-blob settings-aurora-blob--3" />
        <span className="settings-aurora-blob settings-aurora-blob--bottom" />
      </div>
      <div className="relative z-10 flex-1 py-8 pb-24">{children}</div>
    </div>
  );
}
