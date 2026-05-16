"use client"

import { useEffect, useMemo, useState } from "react"
import { supabase } from "@/lib/supabase"

export default function AdminPage() {
  const [users, setUsers] = useState<any[]>([])
  const [videos, setVideos] = useState<any[]>([])
  const [search, setSearch] = useState("")

  const [bronzePrice, setBronzePrice] = useState(199)
  const [silverPrice, setSilverPrice] = useState(499)
  const [goldPrice, setGoldPrice] = useState(999)

  const [bronzeLimit, setBronzeLimit] = useState("10 videos / day")
  const [silverLimit, setSilverLimit] = useState("300 videos / day")
  const [goldLimit, setGoldLimit] = useState("Unlimited videos")

  const [iban, setIban] = useState("TR00 0000 0000 0000 0000 0000 00")
  const [receiverName, setReceiverName] = useState("Yunus Baykan")
  const [paymentNote, setPaymentNote] = useState(
    "Ödeme açıklamasına kayıt olduğunuz email adresini yazınız."
  )

  useEffect(() => {
    checkAdmin()
  }, [])

  const checkAdmin = async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      window.location.href = "/auth"
      return
    }

    if (user.email !== "yunusbaykan@gmail.com") {
      window.location.href = "/dashboard"
      return
    }

    loadUsers()
    loadVideos()
    loadPricing()
  }

  const loadUsers = async () => {
    const { data } = await supabase
      .from("users")
      .select("*")
      .order("created_at", { ascending: false })

    if (data) setUsers(data)
  }

  const loadVideos = async () => {
    const { data } = await supabase
      .from("videos")
      .select("*")
      .order("created_at", { ascending: false })

    if (data) setVideos(data)
  }

  const loadPricing = async () => {
    const { data } = await supabase
      .from("pricing_settings")
      .select("*")
      .eq("id", 1)
      .maybeSingle()

    if (data) {
      setBronzePrice(data.bronze_price ?? 199)
      setSilverPrice(data.silver_price ?? 499)
      setGoldPrice(data.gold_price ?? 999)

      setBronzeLimit(data.bronze_limit ?? "10 videos / day")
      setSilverLimit(data.silver_limit ?? "300 videos / day")
      setGoldLimit(data.gold_limit ?? "Unlimited videos")

      setIban(data.iban ?? "TR00 0000 0000 0000 0000 0000 00")
      setReceiverName(data.receiver_name ?? "Yunus Baykan")
      setPaymentNote(
        data.payment_note ??
          "Ödeme açıklamasına kayıt olduğunuz email adresini yazınız."
      )
    }
  }

  const savePricing = async () => {
    const { error } = await supabase.from("pricing_settings").upsert({
      id: 1,
      bronze_price: bronzePrice,
      silver_price: silverPrice,
      gold_price: goldPrice,
      bronze_limit: bronzeLimit,
      silver_limit: silverLimit,
      gold_limit: goldLimit,
      iban,
      receiver_name: receiverName,
      payment_note: paymentNote,
      updated_at: new Date().toISOString(),
    })

    if (error) {
      alert("Kaydedilemedi: " + error.message)
      return
    }

    alert("Bilgiler kaydedildi")
    loadPricing()
  }

  const filteredUsers = useMemo(() => {
    return users.filter((user) =>
      user.email?.toLowerCase().includes(search.toLowerCase())
    )
  }, [users, search])

  const filteredVideos = useMemo(() => {
    return videos.filter((video) =>
      video.email?.toLowerCase().includes(search.toLowerCase())
    )
  }, [videos, search])

  const changePlan = async (userId: string, plan: string) => {
    let limit = 10

    if (plan === "silver") limit = 300
    if (plan === "gold") limit = 999999

    const futureDate = new Date()
    futureDate.setDate(futureDate.getDate() + 30)

    await supabase
      .from("users")
      .update({
        plan,
        daily_limit: limit,
        subscription_start: new Date().toISOString(),
        subscription_end: futureDate.toISOString(),
      })
      .eq("id", userId)

    loadUsers()
  }

  const addDays = async (
    userId: string,
    currentDate: string,
    days: number
  ) => {
    const date = new Date(currentDate)
    date.setDate(date.getDate() + days)

    await supabase
      .from("users")
      .update({
        subscription_end: date.toISOString(),
      })
      .eq("id", userId)

    loadUsers()
  }

  return (
    <main className="min-h-screen bg-black text-white p-6">
      <div className="max-w-7xl mx-auto">

        <h1 className="text-4xl font-black mb-8">
          Admin Panel
        </h1>

        {/* PRICE SETTINGS */}
        <div className="bg-white/5 border border-white/10 rounded-3xl p-6 mb-8">
          <h2 className="text-3xl font-black mb-6">
            Üyelik ve Ödeme Bilgileri
          </h2>

          <div className="grid md:grid-cols-3 gap-5">
            <div className="bg-black/40 border border-yellow-700 rounded-3xl p-5">
              <h3 className="text-2xl font-black mb-4">Bronze</h3>

              <input
                type="number"
                value={bronzePrice}
                onChange={(e) => setBronzePrice(Number(e.target.value))}
                className="w-full bg-black border border-white/10 rounded-2xl p-3 mb-3"
              />

              <input
                value={bronzeLimit}
                onChange={(e) => setBronzeLimit(e.target.value)}
                className="w-full bg-black border border-white/10 rounded-2xl p-3"
              />
            </div>

            <div className="bg-black/40 border border-gray-400 rounded-3xl p-5">
              <h3 className="text-2xl font-black mb-4">Silver</h3>

              <input
                type="number"
                value={silverPrice}
                onChange={(e) => setSilverPrice(Number(e.target.value))}
                className="w-full bg-black border border-white/10 rounded-2xl p-3 mb-3"
              />

              <input
                value={silverLimit}
                onChange={(e) => setSilverLimit(e.target.value)}
                className="w-full bg-black border border-white/10 rounded-2xl p-3"
              />
            </div>

            <div className="bg-black/40 border border-yellow-400 rounded-3xl p-5">
              <h3 className="text-2xl font-black mb-4">Gold</h3>

              <input
                type="number"
                value={goldPrice}
                onChange={(e) => setGoldPrice(Number(e.target.value))}
                className="w-full bg-black border border-white/10 rounded-2xl p-3 mb-3"
              />

              <input
                value={goldLimit}
                onChange={(e) => setGoldLimit(e.target.value)}
                className="w-full bg-black border border-white/10 rounded-2xl p-3"
              />
            </div>
          </div>

          <div className="grid md:grid-cols-3 gap-5 mt-6">
            <div>
              <p className="text-zinc-400 mb-2">Alıcı Adı</p>
              <input
                value={receiverName}
                onChange={(e) => setReceiverName(e.target.value)}
                className="w-full bg-black border border-white/10 rounded-2xl p-3"
              />
            </div>

            <div>
              <p className="text-zinc-400 mb-2">IBAN</p>
              <input
                value={iban}
                onChange={(e) => setIban(e.target.value)}
                className="w-full bg-black border border-white/10 rounded-2xl p-3"
              />
            </div>

            <div>
              <p className="text-zinc-400 mb-2">Ödeme Açıklaması</p>
              <input
                value={paymentNote}
                onChange={(e) => setPaymentNote(e.target.value)}
                className="w-full bg-black border border-white/10 rounded-2xl p-3"
              />
            </div>
          </div>

          <button
            onClick={savePricing}
            className="mt-6 bg-purple-600 hover:bg-purple-500 px-8 py-4 rounded-2xl font-black"
          >
            Bilgileri Kaydet
          </button>
        </div>

        {/* TOP BAR */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
          <div className="flex gap-3 flex-wrap">
            <div className="bg-white/5 border border-white/10 px-5 py-3 rounded-2xl">
              Total Users: {users.length}
            </div>

            <div className="bg-white/5 border border-white/10 px-5 py-3 rounded-2xl">
              Total Videos: {videos.length}
            </div>
          </div>

          <input
            type="text"
            placeholder="Kullanıcı email ara..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="bg-[#111] border border-white/10 rounded-2xl px-5 py-3 outline-none w-[300px]"
          />
        </div>

        {/* USERS */}
        <h2 className="text-3xl font-black mb-4">
          Users
        </h2>

        <div className="space-y-4 mb-10">
          {filteredUsers.map((user) => {
            const endDate = new Date(user.subscription_end)

            const daysLeft = Math.max(
              0,
              Math.ceil(
                (endDate.getTime() - Date.now()) /
                  (1000 * 60 * 60 * 24)
              )
            )

            return (
              <div
                key={user.id}
                className="bg-white/5 border border-white/10 rounded-3xl p-6"
              >
                <div className="flex flex-col xl:flex-row xl:items-center xl:justify-between gap-6">
                  <div className="flex-1">
                    <p className="text-xl font-black mb-3 break-all">
                      {user.email}
                    </p>

                    <div className="grid md:grid-cols-2 gap-3 text-sm text-zinc-400">
                      <p>
                        Plan:
                        <span className="text-white ml-2 font-bold uppercase">
                          {user.plan}
                        </span>
                      </p>

                      <p>
                        Usage:
                        <span className="text-white ml-2 font-bold">
                          {user.videos_today} / {user.daily_limit}
                        </span>
                      </p>

                      <p>
                        Days Left:
                        <span className="text-green-400 ml-2 font-bold">
                          {daysLeft}
                        </span>
                      </p>

                      <p>
                        End:
                        <span className="text-white ml-2 font-bold">
                          {user.subscription_end
                            ? new Date(user.subscription_end).toLocaleDateString()
                            : "-"}
                        </span>
                      </p>
                    </div>
                  </div>

                  <div className="flex flex-col gap-3 min-w-[280px]">
                    <div className="flex gap-2 flex-wrap">
                      <button
                        onClick={() => changePlan(user.id, "bronze")}
                        className="bg-yellow-700 hover:bg-yellow-600 px-4 py-2 rounded-2xl font-bold"
                      >
                        Bronze
                      </button>

                      <button
                        onClick={() => changePlan(user.id, "silver")}
                        className="bg-gray-300 text-black hover:bg-white px-4 py-2 rounded-2xl font-bold"
                      >
                        Silver
                      </button>

                      <button
                        onClick={() => changePlan(user.id, "gold")}
                        className="bg-yellow-400 text-black hover:bg-yellow-300 px-4 py-2 rounded-2xl font-bold"
                      >
                        Gold
                      </button>
                    </div>

                    <div className="flex gap-2 flex-wrap">
                      <button
                        onClick={() => addDays(user.id, user.subscription_end, 7)}
                        className="bg-green-600 hover:bg-green-500 px-4 py-2 rounded-2xl font-bold"
                      >
                        +7 Days
                      </button>

                      <button
                        onClick={() => addDays(user.id, user.subscription_end, 30)}
                        className="bg-blue-600 hover:bg-blue-500 px-4 py-2 rounded-2xl font-bold"
                      >
                        +30 Days
                      </button>

                      <button
                        onClick={() => addDays(user.id, user.subscription_end, -30)}
                        className="bg-red-600 hover:bg-red-500 px-4 py-2 rounded-2xl font-bold"
                      >
                        -30 Days
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )
          })}
        </div>

        {/* VIDEO HISTORY */}
        <h2 className="text-3xl font-black mb-4">
          Video History
        </h2>

        <div className="space-y-4">
          {filteredVideos.length === 0 ? (
            <div className="bg-white/5 border border-white/10 rounded-3xl p-6 text-zinc-400">
              Henüz video geçmişi yok.
            </div>
          ) : (
            filteredVideos.map((video) => (
              <div
                key={video.id}
                className="bg-white/5 border border-white/10 rounded-3xl p-6 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-5"
              >
                <div>
                  <p className="text-lg font-black break-all">
                    {video.email}
                  </p>

                  <p className="text-zinc-400 text-sm mt-1">
                    {video.title} • Format: {video.format}
                  </p>

                  <p className="text-zinc-500 text-xs mt-1">
                    {new Date(video.created_at).toLocaleString()}
                  </p>
                </div>

                <div className="flex gap-3 flex-wrap">
                  <a
                    href={video.final_video_url}
                    target="_blank"
                    className="bg-green-600 hover:bg-green-500 px-5 py-3 rounded-2xl font-black text-sm"
                  >
                    Final Video
                  </a>

                  <a
                    href={video.zip_url}
                    target="_blank"
                    className="bg-blue-600 hover:bg-blue-500 px-5 py-3 rounded-2xl font-black text-sm"
                  >
                    ZIP
                  </a>
                </div>
              </div>
            ))
          )}
        </div>

      </div>
    </main>
  )
}