import mongoose from 'mongoose'
import Certificate from '../models/Certificate.js'

const isHttpUrl = (value) => {
  try {
    const url = new URL(value)
    return url.protocol === 'http:' || url.protocol === 'https:'
  } catch {
    return false
  }
}

const text = (value) => (typeof value === 'string' ? value.trim() : '')

const parseCertificate = (body) => {
  const name = text(body.name)
  if (!name) return { error: 'Certificate name is required' }

  const organization = text(body.organization)
  if (!organization) return { error: 'Issuing organization is required' }

  const dateText = text(body.issueDate)
  const issueDate = new Date(dateText)
  if (!dateText || Number.isNaN(issueDate.getTime())) {
    return { error: 'Please enter a valid issue date' }
  }

  const credentialUrl = text(body.credentialUrl)
  if (credentialUrl && !isHttpUrl(credentialUrl)) {
    return { error: 'Credential link must start with http:// or https://' }
  }

  return {
    data: {
      name,
      organization,
      issueDate,
      credentialUrl,
      relatedSkill: text(body.relatedSkill),
    },
  }
}

export const getCertificates = async (req, res) => {
  try {
    const certificates = await Certificate.find({ user: req.user._id }).sort({ issueDate: -1 })
    res.json(certificates)
  } catch (error) {
    console.error(error)
    res.status(500).json({ message: 'Server error' })
  }
}

export const createCertificate = async (req, res) => {
  try {
    const { data, error } = parseCertificate(req.body)
    if (error) return res.status(400).json({ message: error })

    const certificate = await Certificate.create({ ...data, user: req.user._id })
    res.status(201).json(certificate)
  } catch (error) {
    console.error(error)
    res.status(500).json({ message: 'Server error' })
  }
}

export const updateCertificate = async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(404).json({ message: 'Certificate not found' })
    }

    const { data, error } = parseCertificate(req.body)
    if (error) return res.status(400).json({ message: error })

    const certificate = await Certificate.findOneAndUpdate(
      { _id: req.params.id, user: req.user._id },
      data,
      { new: true, runValidators: true }
    )

    if (!certificate) return res.status(404).json({ message: 'Certificate not found' })
    res.json(certificate)
  } catch (error) {
    console.error(error)
    res.status(500).json({ message: 'Server error' })
  }
}

export const deleteCertificate = async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(404).json({ message: 'Certificate not found' })
    }

    const certificate = await Certificate.findOneAndDelete({
      _id: req.params.id,
      user: req.user._id,
    })

    if (!certificate) return res.status(404).json({ message: 'Certificate not found' })
    res.json({ message: 'Certificate deleted' })
  } catch (error) {
    console.error(error)
    res.status(500).json({ message: 'Server error' })
  }
}