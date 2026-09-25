"use client";

import { useState } from "react";

interface FaqItem {
  q: string;
  a: string;
  tag: string;
}

const FAQS: FaqItem[] = [
  {
    tag: "LEGAL & LIABILITY",
    q: "Is donating surplus food protected under Indian law?",
    a: "Yes. In accordance with the Food Safety and Standards (Recovery and Distribution of Surplus Food) Regulations, 2019, and Indian Good Samaritan legal frameworks, commercial food donors and volunteers who donate food in good faith and observe basic hygienic packaging standards are shielded from civil and criminal liability.",
  },
  {
    tag: "DISPATCH TIME",
    q: "How fast is food picked up after a donor creates a listing?",
    a: "Our network averages 14.2 minutes from post creation to volunteer dispatch. For urgent cooked batches with an Expiry Risk Score (ERS) over 80, our AI dispatcher triggers autonomous 5-minute auto-confirm matching to eliminate human delay.",
  },
  {
    tag: "SAFETY PROTOCOL",
    q: "How does AnnaSetu ensure rescued food is fresh and safe?",
    a: "We implement a rigorous 4-stage inspection pipeline: (1) Computer Vision photo inspection via Gemini Vision AI, (2) Mandatory preparation timestamp and allergen declarations, (3) Driver temperature and sensory physical verification at pickup, and (4) Recipient shelter checklist inspection with donor PIN sign-off.",
  },
  {
    tag: "TAX & ESG",
    q: "Can businesses claim Section 80G tax deductions for food donations?",
    a: "Yes! AnnaSetu automatically aggregates monthly and annual redistribution totals, generating official, Section 80G compliant tax valuation certificates alongside audited EPA WARM CO₂e emissions abatement ledgers ready for corporate ESG reporting.",
  },
  {
    tag: "CHARITY COSTS",
    q: "Is there any cost for shelters, orphanages, or food banks?",
    a: "None whatsoever. AnnaSetu is 100% free for registered charities and community kitchens. Surplus food is provided freely, and deliveries are fulfilled by volunteer drivers and subsidized logistics partners. Reselling rescued food is strictly prohibited.",
  },
  {
    tag: "VOLUNTEERING",
    q: "What are the requirements to volunteer as a rescue driver?",
    a: "Any licensed driver with an active vehicle (two-wheeler, scooter, car, auto, or van) can register. You maintain complete control over your schedule—simply toggle your availability switch to ON when you are available to complete local rescue runs.",
  },
];

export function LandingFaq() {
  const [openIdx, setOpenIdx] = useState<number | null>(0);

  return (
    <div className="space-y-4">
      {FAQS.map((faq, idx) => {
        const isOpen = openIdx === idx;
        return (
          <div
            key={idx}
            className={`border-4 border-brand-black transition-all ${
              isOpen ? "bg-brand-cream shadow-brutal" : "bg-brand-white hover:bg-brand-cream/50"
            }`}
          >
            <button
              type="button"
              onClick={() => setOpenIdx(isOpen ? null : idx)}
              className="w-full text-left p-6 flex items-center justify-between gap-4 select-none"
            >
              <div>
                <span className="font-mono text-[10px] font-bold bg-brand-black text-brand-white px-2 py-0.5 tracking-wider uppercase mb-2 inline-block">
                  {faq.tag}
                </span>
                <h4 className="font-display text-xl md:text-2xl text-brand-black tracking-tight">
                  {faq.q}
                </h4>
              </div>
              <span className="font-mono text-2xl font-black shrink-0 text-brand-red">
                {isOpen ? "−" : "+"}
              </span>
            </button>

            {isOpen && (
              <div className="px-6 pb-6 pt-2 border-t-2 border-brand-black/20 animate-in fade-in duration-150">
                <p className="font-body text-body-md text-brand-black/80 leading-relaxed">
                  {faq.a}
                </p>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
