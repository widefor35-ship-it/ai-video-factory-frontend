const express = require("express")
const cors = require("cors")
const multer = require("multer")
const path = require("path")
const fs = require("fs")
const { exec } = require("child_process")

const app = express()

app.use(cors())
app.use(express.json())

const uploadPath = path.join(__dirname, "uploads")
const outputPath = path.join(__dirname, "outputs")

if (!fs.existsSync(uploadPath)) fs.mkdirSync(uploadPath)
if (!fs.existsSync(outputPath)) fs.mkdirSync(outputPath)

app.use("/outputs", express.static(outputPath))

function clearFolder(folderPath) {
  if (!fs.existsSync(folderPath)) return

  fs.readdirSync(folderPath).forEach((file) => {
    const filePath = path.join(folderPath, file)

    if (fs.lstatSync(filePath).isDirectory()) {
      fs.rmSync(filePath, { recursive: true, force: true })
    } else {
      fs.unlinkSync(filePath)
    }
  })
}

function clearOldFiles(req, res, next) {
  clearFolder(uploadPath)
  clearFolder(outputPath)
  next()
}

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadPath)
  },

  filename: function (req, file, cb) {
    cb(null, Date.now() + "-" + file.originalname)
  },
})

const upload = multer({ storage })

app.get("/", (req, res) => {
  res.json({
    status: "Backend çalışıyor 🚀",
  })
})

app.post(
  "/upload",
  clearOldFiles,
  upload.fields([
    { name: "txtFile", maxCount: 1 },
    { name: "images", maxCount: 5000 },
  ]),
  (req, res) => {
    const txtFile = req.files["txtFile"]
    const images = req.files["images"]
    const format = req.body.format || "shorts"

    exec(`python worker/video_worker.py ${format}`, (error, stdout, stderr) => {
      if (error) {
        console.log("PYTHON ERROR:", error)
        console.log("STDERR:", stderr)

        return res.status(500).json({
          success: false,
          error: stderr,
        })
      }

      console.log(stdout)

      res.json({
        success: true,
        txt: txtFile ? txtFile[0].filename : null,
        imageCount: images ? images.length : 0,
        finalVideoUrl: "http://localhost:5000/download/final",
        zipUrl: "http://localhost:5000/download/zip",
      })
    })
  }
)

app.get("/download/final", (req, res) => {
  const finalPath = path.join(outputPath, "final_compilation.mp4")

  if (!fs.existsSync(finalPath)) {
    return res.status(404).send("Final video bulunamadı")
  }

  res.download(finalPath, "final_compilation.mp4")
})

app.get("/download/zip", (req, res) => {
  const zipPath = path.join(outputPath, "all_videos.zip")

  const command =
    `python -c "import zipfile, os; ` +
    `folder=r'${outputPath}'; ` +
    `zip_path=r'${zipPath}'; ` +
    `files=[f for f in os.listdir(folder) if f.endswith('.mp4')]; ` +
    `z=zipfile.ZipFile(zip_path,'w'); ` +
    `[z.write(os.path.join(folder,f), f) for f in files]; ` +
    `z.close()"`

  exec(command, (error) => {
    if (error) {
      console.log("ZIP ERROR:", error)
      return res.status(500).send("ZIP oluşturulamadı")
    }

    if (!fs.existsSync(zipPath)) {
      return res.status(404).send("ZIP bulunamadı")
    }

    res.download(zipPath, "all_videos.zip")
  })
})

const PORT = 5000

app.listen(PORT, () => {
  console.log(`Server çalışıyor: http://localhost:${PORT}`)
})