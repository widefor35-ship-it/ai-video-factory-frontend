"use client"

import { useEffect, useState } from "react"
import { supabase } from "@/lib/supabase"

export default function DashboardPage() {
  const [userData, setUserData] = useState<any>(null)
  const [myVideos, setMyVideos] = useState<any[]>([])
  const [myImages, setMyImages] = useState<any[]>([])

  const [txtFile, setTxtFile] = useState<File | null>(null)
  const [images, setImages] = useState<FileList | null>(null)
  const [format, setFormat] = useState("shorts")
  const [loading, setLoading] = useState(false)

  const [latestFinalUrl, setLatestFinalUrl] = useState("")
  const [latestZipUrl, setLatestZipUrl] = useState("")

  const [sceneText, setSceneText] = useState("")
  const [characterText, setCharacterText] = useState("")
  const [styleText, setStyleText] = useState(
    "cinematic realistic, high detail, dramatic lighting"
  )
  const [generatedImage, setGeneratedImage] = useState("")
  const [imageLoading, setImageLoading] = useState(false)

  const [storyText, setStoryText] = useState("")
  const [sceneCount, setSceneCount] = useState(5)
  const [generatedScenes, setGeneratedScenes] = useState<string[]>([])
  const [pipelineLoading, setPipelineLoading] = useState(false)

  useEffect(() => {
    loadUser()
  }, [])

  const checkDailyReset = async (user: any) => {
    const today = new Date().toISOString().split("T")[0]

    if (user.last_reset_date !== today) {
      await supabase
        .from("users")
        .update({
          videos_today: 0,
          last_reset_date: today,
        })
        .eq("id", user.id)

      user.videos_today = 0
      user.last_reset_date = today
    }

    return user
  }

  const loadUser = async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      window.location.href = "/auth"
      return
    }

    let { data } = await supabase
      .from("users")
      .select("*")
      .eq("id", user.id)
      .maybeSingle()

    if (!data) {
      const futureDate = new Date()
      futureDate.setDate(futureDate.getDate() + 30)

      await supabase.from("users").insert({
        id: user.id,
        email: user.email,
        plan: "bronze",
        daily_limit: 10,
        videos_today: 0,
        subscription_start: new Date().toISOString(),
        subscription_end: futureDate.toISOString(),
        last_reset_date: new Date().toISOString().split("T")[0],
      })

      const { data: newUser } = await supabase
        .from("users")
        .select("*")
        .eq("id", user.id)
        .single()

      data = newUser
    }

    data = await checkDailyReset(data)

    setUserData(data)
    loadMyVideos(data.id)
    loadMyImages(data.id)
  }

  const loadMyVideos = async (userId: string) => {
    const { data } = await supabase
      .from("videos")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })

    if (data) setMyVideos(data)
  }

  const loadMyImages = async (userId: string) => {
    const { data } = await supabase
      .from("generated_images")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })

    if (data) setMyImages(data)
  }

  const generateVideo = async () => {
    if (!userData) return

    if (
      userData.plan !== "gold" &&
      userData.videos_today >= userData.daily_limit
    ) {
      alert("Daily limit reached.")
      return
    }

    if (!txtFile) {
      alert("TXT file required")
      return
    }

    if (!images || images.length === 0) {
      alert("Images required")
      return
    }

    setLoading(true)
    setLatestFinalUrl("")
    setLatestZipUrl("")

    const formData = new FormData()
    formData.append("txtFile", txtFile)

    for (let i = 0; i < images.length; i++) {
      formData.append("images", images[i])
    }

    formData.append("format", format)

    try {
      const response = await fetch(
        "https://ai-video-factory-backend-yrep.onrender.com/upload",
        {
          method: "POST",
          body: formData,
        }
      )

      const data = await response.json()

      if (!data.success) {
        alert("Generation failed")
        setLoading(false)
        return
      }

      const finalUrl =
        data.finalVideoUrl ||
        "https://ai-video-factory-backend-yrep.onrender.com/download/final"

      const zipUrl =
        data.zipUrl ||
        "https://ai-video-factory-backend-yrep.onrender.com/download/zip"

      setLatestFinalUrl(finalUrl)
      setLatestZipUrl(zipUrl)

      const newCount = userData.videos_today + 1

      await supabase
        .from("users")
        .update({
          videos_today: newCount,
        })
        .eq("id", userData.id)

      await supabase.from("videos").insert({
        user_id: userData.id,
        email: userData.email,
        title: "Bulk Video Export",
        final_video_url: finalUrl,
        zip_url: zipUrl,
        format,
      })

      setUserData({
        ...userData,
        videos_today: newCount,
      })

      await loadMyVideos(userData.id)

      alert("Videos generated 🚀")
    } catch (err) {
      console.log(err)
      alert("Server error")
    }

    setLoading(false)
  }

  const generateImage = async () => {
    if (!userData) return

    if (!sceneText.trim()) {
      alert("Scene text required")
      return
    }

    setImageLoading(true)

    try {
      const seed = Math.floor(Math.random() * 999999)

      const finalPrompt = `
Create a clean visual image from this scene.
Scene: ${sceneText}
Main character / object: ${characterText || "no specific character"}
Style: ${styleText}
Do not include text, subtitles, logos, watermark, voiceover text, speech bubbles, letters, or captions in the image.
Make it cinematic, clear, high quality, visually consistent.
`

      const imageUrl = `https://image.pollinations.ai/prompt/${encodeURIComponent(
        finalPrompt
      )}?width=1024&height=1024&seed=${seed}&nologo=true`

      setGeneratedImage(imageUrl)

      await supabase.from("generated_images").insert({
        user_id: userData.id,
        email: userData.email,
        prompt: finalPrompt,
        image_url: imageUrl,
        width: 1024,
        height: 1024,
        seed,
      })

      await loadMyImages(userData.id)
    } catch (err) {
      console.log(err)
      alert("Image generation failed")
    }

    setImageLoading(false)
  }

  const generatePipeline = async () => {
    if (!userData) return

    if (!storyText.trim()) {
      alert("Story required")
      return
    }

    setPipelineLoading(true)

    try {
      const cleanText = storyText
        .replace(/\n/g, " ")
        .split(".")
        .filter((s) => s.trim().length > 20)

      const scenes = cleanText.slice(0, sceneCount).map((scene, index) => {
        return `Scene ${index + 1}:
${scene.trim()}

Character:
${characterText || "same main character"}

Visual Style:
${styleText}

Cinematic shot, highly detailed, realistic lighting, no text, no subtitles.`
      })

      setGeneratedScenes(scenes)

      await supabase.from("ai_pipelines").insert({
        user_id: userData.id,
        email: userData.email,
        story_text: storyText,
        character_description: characterText,
        visual_style: styleText,
        scenes,
      })

      alert("Pipeline generated 🚀")
    } catch (err) {
      console.log(err)
      alert("Pipeline failed")
    }

    setPipelineLoading(false)
  }

  if (!userData) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center text-2xl font-black">
        Loading...
      </div>
    )
  }

  const endDate = new Date(userData.subscription_end)

  const daysLeft = Math.max(
    0,
    Math.ceil((endDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24))
  )

  return (
    <main className="min-h-screen bg-black text-white p-6">
      <div className="max-w-5xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-4xl font-black">AI Video Factory</h1>
            <p className="text-zinc-400 mt-2 text-sm">{userData.email}</p>
          </div>

          <button
            onClick={async () => {
              await supabase.auth.signOut()
              window.location.href = "/auth"
            }}
            className="bg-red-600 hover:bg-red-500 px-5 py-2 rounded-2xl font-bold text-sm"
          >
            Logout
          </button>
        </div>

        <div className="grid md:grid-cols-3 gap-4 mb-8">
          <div className="bg-white/5 border border-white/10 rounded-3xl p-5">
            <p className="text-zinc-400 text-sm">Current Plan</p>
            <h2 className="text-2xl font-black mt-2 uppercase">
              {userData.plan}
            </h2>
          </div>

          <div className="bg-white/5 border border-white/10 rounded-3xl p-5">
            <p className="text-zinc-400 text-sm">Daily Usage</p>
            <h2 className="text-2xl font-black mt-2">
              {userData.plan === "gold"
                ? "Unlimited"
                : `${userData.videos_today} / ${userData.daily_limit}`}
            </h2>
          </div>

          <div className="bg-white/5 border border-white/10 rounded-3xl p-5">
            <p className="text-zinc-400 text-sm">Days Left</p>
            <h2 className="text-2xl font-black mt-2">{daysLeft}</h2>
          </div>
        </div>

        <div className="bg-white/5 border border-white/10 rounded-3xl p-7 mb-8">
          <h2 className="text-2xl font-black mb-5">Video Generator</h2>

          <div className="mb-6">
            <p className="mb-2 text-zinc-400 text-sm">Video Format</p>

            <select
              value={format}
              onChange={(e) => setFormat(e.target.value)}
              className="bg-black border border-white/10 rounded-2xl px-4 py-3 w-full text-sm"
            >
              <option value="shorts">Shorts (1080x1920)</option>
              <option value="youtube">YouTube (1920x1080)</option>
              <option value="square">Square (1080x1080)</option>
            </select>
          </div>

          <div className="mb-6">
            <p className="mb-2 text-zinc-400 text-sm font-bold">
              Upload TXT File
            </p>

            <label className="flex items-center justify-center w-full h-28 border-2 border-dashed border-purple-500 rounded-3xl cursor-pointer hover:bg-purple-500/10 transition text-center px-4">
              <div>
                <p className="text-lg font-black mb-1">Upload TXT</p>
                <p className="text-zinc-400 text-xs">Click here</p>

                {txtFile && (
                  <p className="mt-3 text-green-400 font-bold text-sm">
                    {txtFile.name}
                  </p>
                )}
              </div>

              <input
                type="file"
                accept=".txt"
                className="hidden"
                onChange={(e) =>
                  setTxtFile(e.target.files ? e.target.files[0] : null)
                }
              />
            </label>
          </div>

          <div className="mb-8">
            <p className="mb-2 text-zinc-400 text-sm font-bold">
              Upload Images
            </p>

            <label className="flex items-center justify-center w-full h-32 border-2 border-dashed border-blue-500 rounded-3xl cursor-pointer hover:bg-blue-500/10 transition text-center px-4">
              <div>
                <p className="text-lg font-black mb-1">Upload Images</p>
                <p className="text-zinc-400 text-xs">
                  Multiple images supported
                </p>

                {images && (
                  <p className="mt-3 text-green-400 font-bold text-sm">
                    {images.length} selected
                  </p>
                )}
              </div>

              <input
                type="file"
                multiple
                accept="image/*"
                className="hidden"
                onChange={(e) => setImages(e.target.files)}
              />
            </label>
          </div>

          <button
            onClick={generateVideo}
            disabled={loading}
            className="w-full bg-purple-600 hover:bg-purple-500 transition py-4 rounded-3xl text-lg font-black"
          >
            {loading ? "Generating..." : "Generate Videos"}
          </button>

          {(latestFinalUrl || latestZipUrl) && (
            <div className="mt-8 bg-black/40 border border-white/10 rounded-3xl p-5">
              <h3 className="text-xl font-black mb-4">Latest Export</h3>

              <div className="flex gap-3 flex-wrap">
                {latestFinalUrl && (
                  <a
                    href={latestFinalUrl}
                    target="_blank"
                    className="bg-green-600 hover:bg-green-500 px-5 py-3 rounded-2xl font-black text-sm"
                  >
                    Download Final Video
                  </a>
                )}

                {latestZipUrl && (
                  <a
                    href={latestZipUrl}
                    target="_blank"
                    className="bg-blue-600 hover:bg-blue-500 px-5 py-3 rounded-2xl font-black text-sm"
                  >
                    Download ZIP
                  </a>
                )}
              </div>
            </div>
          )}
        </div>

        <div className="bg-white/5 border border-white/10 rounded-3xl p-7 mb-8">
          <h2 className="text-2xl font-black mb-5">
            AI Image Generator
          </h2>

          <div className="mb-5">
            <p className="text-zinc-400 text-sm mb-2">
              Scene Text
            </p>

            <textarea
              value={sceneText}
              onChange={(e) => setSceneText(e.target.value)}
              placeholder="Example: A lonely man walking through a dark city street at night..."
              className="w-full bg-black border border-white/10 rounded-3xl p-5 min-h-[120px] outline-none"
            />
          </div>

          <div className="mb-5">
            <p className="text-zinc-400 text-sm mb-2">
              Character / Object Description
            </p>

            <textarea
              value={characterText}
              onChange={(e) => setCharacterText(e.target.value)}
              placeholder="Example: same young man, black jacket, serious face, short dark hair..."
              className="w-full bg-black border border-white/10 rounded-3xl p-5 min-h-[90px] outline-none"
            />
          </div>

          <div className="mb-5">
            <p className="text-zinc-400 text-sm mb-2">
              Visual Style
            </p>

            <input
              value={styleText}
              onChange={(e) => setStyleText(e.target.value)}
              className="w-full bg-black border border-white/10 rounded-3xl p-5 outline-none"
            />
          </div>

          <button
            onClick={generateImage}
            disabled={imageLoading}
            className="w-full bg-pink-600 hover:bg-pink-500 transition py-4 rounded-3xl text-lg font-black"
          >
            {imageLoading ? "Generating..." : "Generate Reference Image"}
          </button>

          {generatedImage && (
            <div className="mt-8">
              <img
                src={generatedImage}
                alt="Generated"
                className="w-full rounded-3xl border border-white/10"
              />

              <a
                href={generatedImage}
                target="_blank"
                className="mt-4 inline-block bg-green-600 hover:bg-green-500 px-5 py-3 rounded-2xl font-black text-sm"
              >
                Open / Download Image
              </a>
            </div>
          )}

          {myImages.length > 0 && (
            <div className="mt-10">
              <h3 className="text-xl font-black mb-4">My AI Images</h3>

              <div className="grid md:grid-cols-2 gap-5">
                {myImages.map((img) => (
                  <div
                    key={img.id}
                    className="bg-black/40 border border-white/10 rounded-3xl p-4"
                  >
                    <img
                      src={img.image_url}
                      alt="AI"
                      className="w-full rounded-2xl mb-4"
                    />

                    <p className="text-sm text-zinc-300 mb-3">
                      {img.prompt}
                    </p>

                    <a
                      href={img.image_url}
                      target="_blank"
                      className="bg-blue-600 hover:bg-blue-500 px-4 py-2 rounded-2xl text-sm font-black"
                    >
                      Open Image
                    </a>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="bg-white/5 border border-white/10 rounded-3xl p-7 mb-8">
          <h2 className="text-2xl font-black mb-5">
            AI Pipeline Generator
          </h2>

          <div className="mb-5">
            <p className="text-zinc-400 text-sm mb-2">
              Full Story / Script
            </p>

            <textarea
              value={storyText}
              onChange={(e) => setStoryText(e.target.value)}
              placeholder="Write your full story or script..."
              className="w-full bg-black border border-white/10 rounded-3xl p-5 min-h-[220px] outline-none"
            />
          </div>

          <div className="mb-5">
            <p className="text-zinc-400 text-sm mb-2">
              Scene Count
            </p>

            <input
              type="number"
              value={sceneCount}
              onChange={(e) => setSceneCount(Number(e.target.value))}
              className="w-full bg-black border border-white/10 rounded-3xl p-5 outline-none"
            />
          </div>

          <button
            onClick={generatePipeline}
            disabled={pipelineLoading}
            className="w-full bg-orange-600 hover:bg-orange-500 transition py-4 rounded-3xl text-lg font-black"
          >
            {pipelineLoading
              ? "Generating Pipeline..."
              : "Generate AI Pipeline"}
          </button>

          {generatedScenes.length > 0 && (
            <div className="mt-8 space-y-5">
              {generatedScenes.map((scene, index) => (
                <div
                  key={index}
                  className="bg-black/40 border border-white/10 rounded-3xl p-5"
                >
                  <h3 className="font-black text-xl mb-3">
                    Scene {index + 1}
                  </h3>

                  <pre className="whitespace-pre-wrap text-sm text-zinc-300">
                    {scene}
                  </pre>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="bg-white/5 border border-white/10 rounded-3xl p-7">
          <h2 className="text-2xl font-black mb-5">My Videos</h2>

          {myVideos.length === 0 ? (
            <p className="text-zinc-400">No videos generated yet.</p>
          ) : (
            <div className="space-y-4">
              {myVideos.map((video) => (
                <div
                  key={video.id}
                  className="bg-black/40 border border-white/10 rounded-2xl p-5 flex flex-col md:flex-row md:items-center md:justify-between gap-4"
                >
                  <div>
                    <p className="font-black">{video.title}</p>

                    <p className="text-zinc-400 text-sm mt-1">
                      Format: {video.format} •{" "}
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
              ))}
            </div>
          )}
        </div>
      </div>
    </main>
  )
}