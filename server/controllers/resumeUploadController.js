import multer from 'multer'
import { PDFParse } from 'pdf-parse'
import UploadedResume from '../models/UploadedResume.js'

const MAX_SIZE = 2 * 1024 * 1024
const MAX_PAGES = 5
const MAX_CHARS = 20000
const MIN_CHARS = 100

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: MAX_SIZE, files: 1 },
})

// Runs multer and turns its errors into friendly messages
export const receivePdf = (req, res, next) => {
  upload.single('file')(req, res, (error) => {
    if (!error) return next()
    if (error.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({ message: 'The file is too large. The limit is 2 MB.' })
    }
    return res.status(400).json({ message: 'Could not read the uploaded file' })
  })
}

const cleanText = (raw) =>
  raw
    .replace(/\r\n?/g, '\n')
    .replace(/^-- \d+ of \d+ --$/gm, '')
    .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g, '')
    .replace(/[ \t]+\n/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim()

const cleanName = (name) => {
  const cleaned = String(name || '')
    .replace(/[\u0000-\u001F]/g, '')
    .trim()
    .slice(0, 100)
  return cleaned || 'resume.pdf'
}

const toResponse = (doc) => ({
  fileName: doc.fileName,
  fileSize: doc.fileSize,
  pageCount: doc.pageCount,
  charCount: doc.text.length,
  text: doc.text,
  uploadedAt: doc.updatedAt,
})

const readPdfText = async (buffer) => {
  const parser = new PDFParse({ data: new Uint8Array(buffer) })
  try {
    const result = await parser.getText({ first: MAX_PAGES })
    return { text: cleanText(result.text || ''), total: result.total || 0 }
  } finally {
    await parser.destroy().catch(() => {})
  }
}

export const uploadResume = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'Please choose a PDF file' })
    }

    const { buffer, originalname, size } = req.file

    // A real PDF always starts with "%PDF-". The file name or type sent by the browser can be faked.
    if (buffer.subarray(0, 5).toString('latin1') !== '%PDF-') {
      return res.status(400).json({ message: 'That file is not a valid PDF' })
    }

    let extracted
    try {
      extracted = await readPdfText(buffer)
    } catch {
      return res
        .status(400)
        .json({ message: 'Could not read this PDF. It may be damaged or password-protected.' })
    }

    if (extracted.text.length < MIN_CHARS) {
      return res.status(400).json({
        message:
          'No selectable text was found. This looks like a scanned or image-only PDF. Upload a text-based PDF, such as one saved from Word or from the SkillSphere resume builder.',
      })
    }

    const doc = await UploadedResume.findOneAndUpdate(
      { user: req.user._id },
      {
        fileName: cleanName(originalname),
        fileSize: size,
        pageCount: extracted.total,
        text: extracted.text.slice(0, MAX_CHARS),
      },
      { new: true, upsert: true, runValidators: true, setDefaultsOnInsert: true }
    )

    res.status(201).json(toResponse(doc))
  } catch (error) {
    console.error(error)
    res.status(500).json({ message: 'Server error' })
  }
}

export const getUpload = async (req, res) => {
  try {
    const doc = await UploadedResume.findOne({ user: req.user._id })
    res.json(doc ? toResponse(doc) : null)
  } catch (error) {
    console.error(error)
    res.status(500).json({ message: 'Server error' })
  }
}

export const deleteUpload = async (req, res) => {
  try {
    await UploadedResume.findOneAndDelete({ user: req.user._id })
    res.json({ message: 'Uploaded resume removed' })
  } catch (error) {
    console.error(error)
    res.status(500).json({ message: 'Server error' })
  }
}