interface LayoutProps {
  children: React.ReactNode;
}
export default function layout({ children }: LayoutProps) {
  return (
    <div>
      <div className="w-full bg-blue-500 p-4">nav</div>
      {children}
    </div>
  );
}
