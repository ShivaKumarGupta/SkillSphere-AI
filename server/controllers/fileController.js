import multer from 'multer'
import mongoose from 'mongoose'
import File from '../models/File.js'
import Project from '../models/Project.js'
import Certificate from '../models/Certificate.js'
import Portfolio from '../models/Portfolio.js'

const MB = 1024 * 1024
const IMAGE_MAX = 1 * MB
const CERT_MAX = 2 * MB
const MAX_SCREENSHOTS = 3
const USER_QUOTA = 15 * MB
const SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: CERT_MAX, files: 1 },
})

export const receiveFile = (req, res, next) => {
  upload.single('file')(req, res, (error) => {
    if (!error) return next()
    if (error.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({ message: 'The file is too large' })
    }
    return res.status(400).json({ message: 'Could not read the uploaded file' })
  })
}

// The real type comes from the first bytes of the file, not from its name or what the browser says
const detectType = (b) => {
  if (b.length >= 8 && b.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))) {
    return 'image/png'
  }
  if (b.length >= 3 && b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff) return 'image/jpeg'
  if (b.length >= 12 && b.subarray(0, 4).toString('latin1') === 'RIFF' && b.subarray(8, 12).toString('latin1') === 'WEBP') {
    return 'image/webp'
  }
  if (b.length >= 5 && b.subarray(0, 5).toString('latin1') === '%PDF-') return 'application/pdf'
  return null
}

const inspect = (file, allowPdf, maxSize) => {
  const type = detectType(file.buffer)
  if (!type || (type === 'application/pdf' && !allowPdf)) {
    return {
      error: allowPdf
        ? 'Upload a PNG, JPG, WebP or PDF file'
        : 'Screenshots must be PNG, JPG or WebP images',
    }
  }
  if (file.size > maxSize) {
    return { error: `The file is too large. The limit is ${maxSize / MB} MB.` }
  }
  return { type }
}

const cleanName = (name) => {
  const cleaned = String(name || '').replace(/[\u0000-\u001F]/g, '').trim().slice(0, 100)
  return cleaned || 'file'
}

const toMeta = (f) => ({
  id: String(f._id),
  kind: f.kind,
  ownerId: String(f.owner),
  name: f.name,
  contentType: f.contentType,
  size: f.size,
})

const usedBytes = async (userId, exceptOwner = null) => {
  const match = { user: userId }
  if (exceptOwner) match.owner = { $ne: exceptOwner }
  const [row] = await File.aggregate([
    { $match: match },
    { $group: { _id: null, total: { $sum: '$size' } } },
  ])
  return row ? row.total : 0
}

const sendFile = (res, file, cache) => {
  const safeName = String(file.name || 'file').replace(/[^\w.\- ]/g, '_').slice(0, 100)
  res.set({
    'Content-Type': file.contentType,
    'Content-Disposition': `inline; filename="${safeName}"`,
    'X-Content-Type-Options': 'nosniff',
    'Cache-Control': cache,
  })
  res.send(Buffer.from(file.data))
}

const serverError = (res, error) => {
  console.error(error)
  res.status(500).json({ message: 'Server error' })
}

// ---------- the student's own files ----------

export const listFiles = async (req, res) => {
  try {
    const files = await File.find({ user: req.user._id })
      .select('kind owner name contentType size')
      .sort({ createdAt: 1 })
      .lean()
    res.json(files.map(toMeta))
  } catch (error) {
    serverError(res, error)
  }
}

export const uploadProjectFile = async (req, res) => {
  try {
    const { projectId } = req.params
    if (!mongoose.isValidObjectId(projectId)) {
      return res.status(404).json({ message: 'Project not found' })
    }
    if (!req.file) return res.status(400).json({ message: 'Please choose a file' })

    const project = await Project.findOne({ _id: projectId, user: req.user._id }).select('_id')
    if (!project) return res.status(404).json({ message: 'Project not found' })

    const { type, error } = inspect(req.file, false, IMAGE_MAX)
    if (error) return res.status(400).json({ message: error })

    const count = await File.countDocuments({ user: req.user._id, owner: project._id })
    if (count >= MAX_SCREENSHOTS) {
      return res.status(400).json({ message: `A project can have up to ${MAX_SCREENSHOTS} screenshots` })
    }
    if ((await usedBytes(req.user._id)) + req.file.size > USER_QUOTA) {
      return res.status(400).json({ message: 'Your file storage is full. Delete some files first.' })
    }

    const file = await File.create({
      user: req.user._id,
      kind: 'project',
      owner: project._id,
      name: cleanName(req.file.originalname),
      contentType: type,
      size: req.file.size,
      data: req.file.buffer,
    })
    res.status(201).json(toMeta(file))
  } catch (error) {
    serverError(res, error)
  }
}

// One file per certificate: a new upload replaces the old one
export const uploadCertificateFile = async (req, res) => {
  try {
    const { certificateId } = req.params
    if (!mongoose.isValidObjectId(certificateId)) {
      return res.status(404).json({ message: 'Certificate not found' })
    }
    if (!req.file) return res.status(400).json({ message: 'Please choose a file' })

    const certificate = await Certificate.findOne({ _id: certificateId, user: req.user._id }).select('_id')
    if (!certificate) return res.status(404).json({ message: 'Certificate not found' })

    const { type, error } = inspect(req.file, true, CERT_MAX)
    if (error) return res.status(400).json({ message: error })

    if ((await usedBytes(req.user._id, certificate._id)) + req.file.size > USER_QUOTA) {
      return res.status(400).json({ message: 'Your file storage is full. Delete some files first.' })
    }

    const file = await File.create({
      user: req.user._id,
      kind: 'certificate',
      owner: certificate._id,
      name: cleanName(req.file.originalname),
      contentType: type,
      size: req.file.size,
      data: req.file.buffer,
    })
    // The old file is removed only after the new one is safely stored
    await File.deleteMany({ user: req.user._id, owner: certificate._id, _id: { $ne: file._id } })

    res.status(201).json(toMeta(file))
  } catch (error) {
    serverError(res, error)
  }
}

export const getFile = async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(404).json({ message: 'File not found' })
    }
    const file = await File.findOne({ _id: req.params.id, user: req.user._id }).select(
      '+data name contentType'
    )
    if (!file) return res.status(404).json({ message: 'File not found' })

    sendFile(res, file, 'private, no-store')
  } catch (error) {
    serverError(res, error)
  }
}

export const deleteFile = async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(404).json({ message: 'File not found' })
    }
    const file = await File.findOneAndDelete({ _id: req.params.id, user: req.user._id }).select('_id')
    if (!file) return res.status(404).json({ message: 'File not found' })

    res.json({ message: 'File deleted' })
  } catch (error) {
    serverError(res, error)
  }
}

// ---------- public files (no login) ----------

export const getPublicFile = async (req, res) => {
  try {
    const notFound = () => {
      res.set('Cache-Control', 'no-store')
      return res.status(404).json({ message: 'File not found' })
    }

    const slug = typeof req.params.slug === 'string' ? req.params.slug.toLowerCase() : ''
    if (slug.length > 30 || !SLUG_PATTERN.test(slug) || !mongoose.isValidObjectId(req.params.id)) {
      return notFound()
    }

    const portfolio = await Portfolio.findOne({ slug, isPublic: true }).lean()
    if (!portfolio) return notFound()

    const file = await File.findOne({ _id: req.params.id, user: portfolio.user }).select(
      '+data name contentType kind owner'
    )
    if (!file) return notFound()

    if (file.kind === 'project') {
      if (!portfolio.showProjects) return notFound()
      const project = await Project.findOne({
        _id: file.owner,
        user: portfolio.user,
        status: { $ne: 'Planned' },
      }).select('_id')
      if (!project) return notFound()
    } else if (!portfolio.showCertificates) {
      return notFound()
    }

    sendFile(res, file, 'no-store')
  } catch (error) {
    serverError(res, error)
  }
}