"use client"

import { useState } from "react"
import { supabase } from "@/lib/supabase"

export default function AuthPage() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [loading, setLoading] = useState(false)

  const signUp = async () => {
    setLoading(true)

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
    })

    if (error) {
      alert(error.message)
      setLoading(false)
      return
    }

    const user = data.user

    if (user) {
      await supabase.from("users").insert({
        id: user.id,
        email: user.email,
        plan: "bronze",
        daily_limit: 10,
        videos_today: 0,
      })
    }

    alert("Kayıt başarılı! Bronze üyelik aktif.")
    window.location.href = "/dashboard"

    setLoading(false)
  }

  const signIn = async () => {
    setLoading(true)

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (error) {
      alert(error.message)
      setLoading(false)
      return
    }

    alert("Giriş başarılı!")
    window.location.href = "/dashboard"

    setLoading(false)
  }

  return (
    <main className="min-h-screen bg-black text-white flex items-center justify-center px-6">
      <div className="w-full max-w-md bg-white/5 border border-white/10 rounded-[35px] p-8">
        <h1 className="text-4xl font-black text-center">
          AI Video Factory
        </h1>

        <p className="text-zinc-400 text-center mt-3">
          Login or create your account
        </p>

        <input
          type="email"
          placeholder="Email"
          className="w-full bg-black border border-white/10 rounded-2xl p-4 mt-8 outline-none"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />

        <input
          type="password"
          placeholder="Password"
          className="w-full bg-black border border-white/10 rounded-2xl p-4 mt-4 outline-none"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />

        <button
          onClick={signIn}
          disabled={loading}
          className="w-full bg-purple-600 hover:bg-purple-500 transition py-4 rounded-2xl font-black mt-6"
        >
          Login
        </button>

        <button
          onClick={signUp}
          disabled={loading}
          className="w-full bg-green-600 hover:bg-green-500 transition py-4 rounded-2xl font-black mt-4"
        >
          Register Free Bronze
        </button>
      </div>
    </main>
  )
}