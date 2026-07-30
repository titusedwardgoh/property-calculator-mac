"use client";

import Image from 'next/image';
import { AnimatePresence, motion } from 'framer-motion';
import { useFormStore } from '@/stores/formStore';

const ROOM_LAYERS = [
  {
    id: 'property',
    src: '/surveypic1.png',
    alt: 'Property section complete',
    isFilled: (formData) =>
      Boolean(formData.propertyDetailsFormComplete || formData.propertyDetailsComplete),
  },
  {
    id: 'buyer',
    src: '/surveypic2.png',
    alt: 'Buyer section complete',
    isFilled: (formData) => Boolean(formData.buyerDetailsComplete),
  },
  {
    id: 'loan',
    src: '/surveypic3.png',
    alt: 'Loan section complete',
    // Cash buyers skip loan questions — fill this room with buyer instead
    isFilled: (formData) =>
      formData.needsLoan === 'no'
        ? Boolean(formData.buyerDetailsComplete)
        : Boolean(formData.loanDetailsComplete),
  },
  {
    id: 'seller',
    src: '/surveypic4.png',
    alt: 'Seller section complete',
    isFilled: (formData) => Boolean(formData.sellerQuestionsComplete),
  },
];

export default function SurveyFloorPlanProgress({ className = '' }) {
  const formData = useFormStore();

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.5, ease: 'easeInOut' }}
      className={`relative w-full max-w-xs ${className}`}
      aria-hidden="true"
    >
      {/* Completed rooms sit under the outline so walls stay crisp */}
      <div className="absolute inset-0">
        <AnimatePresence>
          {ROOM_LAYERS.map((room) => {
            const filled = room.isFilled(formData);
            if (!filled) return null;

            return (
              <motion.div
                key={room.id}
                initial={{ opacity: 0, scale: 0.96 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.98 }}
                transition={{ duration: 0.55, ease: [0.33, 1, 0.68, 1] }}
                className="absolute inset-0"
              >
                <Image
                  src={room.src}
                  alt={room.alt}
                  width={500}
                  height={500}
                  unoptimized
                  className="h-full w-full object-contain"
                />
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>

      <Image
        src="/surveypic.png"
        alt=""
        width={500}
        height={500}
        priority
        unoptimized
        className="relative z-10 h-auto w-full object-contain"
      />
    </motion.div>
  );
}
