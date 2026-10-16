export function Footer({ className = "" }: { className?: string }) {
  return (
    <footer className={`footer ${className}`.trim()} data-content>
      © Nicole Lee {new Date().getFullYear()}
    </footer>
  );
}
