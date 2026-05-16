export default function Register() {
  return (
    <main className="min-h-screen bg-black text-white flex items-center justify-center px-6">

      <div className="w-full max-w-md bg-white/5 border border-white/10 rounded-[35px] p-8">

        <div className="text-center">

          <div className="w-20 h-20 rounded-3xl bg-purple-600 mx-auto mb-6"></div>

          <h1 className="text-5xl font-black">
            Create Account
          </h1>

          <p className="text-zinc-400 mt-4">
            Start generating bulk AI videos
          </p>

        </div>

        {/* GOOGLE */}

        <button className="w-full mt-10 bg-white text-black py-4 rounded-2xl font-bold flex items-center justify-center gap-3 hover:bg-zinc-200 transition">

          <span className="text-2xl">
            G
          </span>

          Continue with Google

        </button>

        <div className="flex items-center gap-4 my-8">

          <div className="h-[1px] bg-white/10 w-full"></div>

          <span className="text-zinc-500 text-sm">
            OR
          </span>

          <div className="h-[1px] bg-white/10 w-full"></div>

        </div>

        <input
          className="w-full bg-black border border-white/10 rounded-2xl p-4 mb-4 outline-none"
          placeholder="Name"
        />

        <input
          className="w-full bg-black border border-white/10 rounded-2xl p-4 mb-4 outline-none"
          placeholder="Email"
        />

        <input
          type="password"
          className="w-full bg-black border border-white/10 rounded-2xl p-4 mb-6 outline-none"
          placeholder="Password"
        />

        {/* CAPTCHA */}

        <div className="bg-black border border-white/10 rounded-2xl p-4 mb-6 flex items-center gap-4">

          <input
            type="checkbox"
            className="w-5 h-5 accent-purple-600"
          />

          <span className="text-zinc-300">
            Ben robot değilim
          </span>

          <div className="ml-auto text-xs text-zinc-500">
            CAPTCHA
          </div>

        </div>

        <button className="w-full bg-purple-600 hover:bg-purple-500 transition py-4 rounded-2xl font-black">

          Register

        </button>

        <p className="text-center text-zinc-500 mt-8">

          Already have an account?

          <span className="text-purple-400 ml-2 cursor-pointer">
            Login
          </span>

        </p>

      </div>

    </main>
  )
}