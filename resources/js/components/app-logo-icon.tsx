import type { ImgHTMLAttributes } from 'react';

export default function AppLogoIcon({ className, alt = "AutoPrime Logo", ...props }: ImgHTMLAttributes<HTMLImageElement>) {
    return (
        <img
            src="/AutoPrimeLogo.png"
            alt={alt}
            className={`object-contain ${className || ''}`}
            {...props}
        />
    );
}
