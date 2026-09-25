import Image from "next/image";
import Link from "next/link";

interface LogoProps {
  size?: "sm" | "md" | "lg" | "xl";
  href?: string;
  className?: string;
}

const sizeMap = {
  sm: { width: 110, height: 36, imgClass: "h-9 w-auto" },
  md: { width: 140, height: 44, imgClass: "h-11 w-auto" },
  lg: { width: 180, height: 56, imgClass: "h-14 w-auto" },
  xl: { width: 220, height: 70, imgClass: "h-16 w-auto" },
};

export function Logo({ size = "md", href, className = "" }: LogoProps) {
  const { width, height, imgClass } = sizeMap[size];

  const logoContent = (
    <div className={`inline-flex items-center select-none ${className}`}>
      <Image
        src="/logo.png"
        alt="AnnaSetu"
        width={width}
        height={height}
        className={`${imgClass} object-contain mix-blend-multiply filter contrast-125`}
        priority
      />
    </div>
  );

  if (href) {
    return (
      <Link href={href} className="inline-block transition-transform hover:scale-[1.02] active:scale-95 focus:outline-none">
        {logoContent}
      </Link>
    );
  }

  return logoContent;
}
