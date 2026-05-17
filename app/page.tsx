"use client"

import { useEffect, useState } from "react"
import { supabase } from "@/lib/supabase"

export default function HomePage() {
  const [pricing, setPricing] = useState<any>({
    bronze_price: 199,
    silver_price: 499,
    gold_price: 999,

    bronze_limit: "10 videos / day",
    silver_limit: "300 videos / day",
    gold_limit: "Unlimited videos",

    iban: "TR00 0000 0000 0000 0000 0000 00",
    receiver_name: "Yunus Baykan",
    payment_note:
      "Ödeme açıklamasına kayıt olduğunuz email adresini yazınız.",
  })

  useEffect(() => {
    loadPricing()
  }, [])

  const loadPricing = async () => {
    const { data } = await supabase
      .from("pricing_settings")
      .select("*")
      .eq("id", 1)
      .maybeSingle()

    if (data) {
      setPricing({
        bronze_price: data.bronze_price ?? 199,
        silver_price: data.silver_price ?? 499,
        gold_price: data.gold_price ?? 999,

        bronze_limit: data.bronze_limit ?? "10 videos / day",
        silver_limit: data.silver_limit ?? "300 videos / day",
        gold_limit: data.gold_limit ?? "Unlimited videos",

        iban:
          data.iban ??
          "TR00 0000 0000 0000 0000 0000 00",

        receiver_name:
          data.receiver_name ?? "İsim Soyisim",

        payment_note:
          data.payment_note ??
          "Ödeme açıklamasına kayıt olduğunuz email adresini yazınız. email adresi yazılmayan gönderimlerin iadesi yoktur.",
      })
    }
  }

  return (
    <main className="min-h-screen bg-black text-white relative overflow-hidden">

      <section className="min-h-screen flex items-center justify-center px-6">

        <div className="text-center max-w-4xl">

          <h1 className="text-6xl md:text-7xl font-black">
            Otomatik Video Üretim Sistemi
          </h1>

          <p className="text-zinc-400 text-xl mt-6">
            1000 görsel ve 1000 metin yükleyin, toplu yapay zeka videolarını otomatik oluşturun.
          </p>

          <div className="flex justify-center gap-4 mt-10">

            <a
              href="/auth"
              className="bg-purple-600 hover:bg-purple-500 px-8 py-4 rounded-2xl font-black"
            >
              ŞİMDİ ÜYE OL
            </a>

            <a
              href="/dashboard"
              className="bg-white/10 hover:bg-white/20 px-8 py-4 rounded-2xl font-black"
            >
              ÜRETMEYE BAŞLA
            </a>

          </div>

        </div>

      </section>

      {/* RIGHT PANEL */}
      <div className="fixed right-0 top-1/2 -translate-y-1/2 z-50 group">

        <div className="bg-purple-600 px-3 py-8 rounded-l-2xl font-black cursor-pointer writing-vertical">
          ÜCRETLENDİRME
        </div>

        <div className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-full group-hover:translate-x-0 transition duration-300 w-[360px] bg-zinc-950 border border-white/10 rounded-l-3xl p-5 shadow-2xl">

          <h2 className="text-2xl font-black mb-5">
            ÜYELİK ÜCRETLERİ
          </h2>

          <div className="space-y-4">

            <div className="bg-white/5 rounded-2xl p-4 border border-yellow-700">
              <h3 className="text-xl font-black">
                Bronze
              </h3>

              <p className="text-zinc-400 text-sm mt-1">
                {pricing.bronze_limit}
              </p>

              <p className="text-3xl font-black mt-3">
                ₺{pricing.bronze_price}
              </p>
            </div>

            <div className="bg-white/5 rounded-2xl p-4 border border-gray-400">
              <h3 className="text-xl font-black">
                Silver
              </h3>

              <p className="text-zinc-400 text-sm mt-1">
                {pricing.silver_limit}
              </p>

              <p className="text-3xl font-black mt-3">
                ₺{pricing.silver_price}
              </p>
            </div>

            <div className="bg-white/5 rounded-2xl p-4 border border-yellow-400">
              <h3 className="text-xl font-black">
                Gold
              </h3>

              <p className="text-zinc-400 text-sm mt-1">
                {pricing.gold_limit}
              </p>

              <p className="text-3xl font-black mt-3">
                ₺{pricing.gold_price}
              </p>
            </div>

          </div>

          {/* PAYMENT */}
          <div className="mt-6 bg-black/50 border border-white/10 rounded-2xl p-4">

            <h3 className="text-lg font-black mb-3">
              ÖDEME YÖNTEMİ
            </h3>

            <p className="text-zinc-400 text-xs">
              Receiver
            </p>

            <p className="font-bold break-all mb-3">
              {pricing.receiver_name}
            </p>

            <p className="text-zinc-400 text-xs">
              IBAN
            </p>

            <p className="font-bold break-all mb-3">
              {pricing.iban}
            </p>

            <p className="text-zinc-400 text-xs">
              Payment Note
            </p>

            <p className="text-sm mt-1 text-white">
              {pricing.payment_note}
            </p>

          </div>

        </div>

      </div>

      <style jsx>{`
        .writing-vertical {
          writing-mode: vertical-rl;
          text-orientation: mixed;
        }
      `}</style>

    </main>
  )
}