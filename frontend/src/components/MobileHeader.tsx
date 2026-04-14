"use client";

import Image from 'next/image';
import { NotificationsPopover } from './NotificationsPopover';

export function MobileHeader() {
    return (
        <div className="md:hidden sticky top-0 z-40 bg-white/80 backdrop-blur-md border-b border-neutral-200 h-14 flex items-center justify-between px-4">
            <div className="flex items-center gap-2.5">
                <Image src="/logo_svg.svg" alt="PeakTalk" width={26} height={26} />
                <span className="brand-wordmark text-[15px] text-neutral-900 leading-none">
                    PeakTalk
                </span>
            </div>
            <div className="flex items-center">
               <NotificationsPopover isMobile={true} />
            </div>
        </div>
    );
}
