export default function StatBox({ label, value }: { label: string, value: string | number }) {
  return (
    <div className="bg-[#1A1816] vintage-border p-5 flex flex-col items-center justify-center text-center relative">
      <div className="absolute top-0 left-0 w-full h-full pointer-events-none border-[1px] border-[#141210] m-1"></div>
      <span className="micro-label text-[#C89B3C] mb-2 relative z-10">{label}</span>
      <span className="font-serif text-2xl text-[#EAE4D9] relative z-10">{value}</span>
    </div>
  );
}
