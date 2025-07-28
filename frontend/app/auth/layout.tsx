export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="bg-[#fafafa] min-h-screen flex items-center justify-center">
      {children}
    </div>
  );
} 