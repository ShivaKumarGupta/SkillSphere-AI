import mongoose from 'mongoose'
import Project from '../models/Project.js'

const STATUSES = ['Planned', 'In Progress', 'Completed']

const isHttpUrl = (value) => {
  try {
    const url = new URL(value)
    return url.protocol === 'http:' || url.protocol === 'https:'
  } catch {
    return false
  }
}

const cleanList = (value) => {
  if (!Array.isArray(value)) return []
  const items = value
    .filter((v) => typeof v === 'string')
    .map((v) => v.trim().slice(0, 40))
    .filter(Boolean)
  return [...new Set(items)].slice(0, 30)
}

const text = (value) => (typeof value === 'string' ? value.trim() : '')

const parseProject = (body) => {
  const name = text(body.name)
  if (!name) return { error: 'Project name is required' }

  const status = body.status || 'In Progress'
  if (!STATUSES.includes(status)) return { error: 'Invalid status' }

  const githubUrl = text(body.githubUrl)
  const liveUrl = text(body.liveUrl)
  const links = [
    ['GitHub link', githubUrl],
    ['Live demo link', liveUrl],
  ]
  for (const [label, url] of links) {
    if (url && !isHttpUrl(url)) {
      return { error: `${label} must start with http:// or https://` }
    }
  }

  return {
    data: {
      name,
      description: text(body.description),
      technologies: cleanList(body.technologies),
      status,
      githubUrl,
      liveUrl,
    },
  }
}

export const getProjects = async (req, res) => {
  try {
    const projects = await Project.find({ user: req.user._id }).sort({ createdAt: -1 })
    res.json(projects)
  } catch (error) {
    console.error(error)
    res.status(500).json({ message: 'Server error' })
  }
}

export const createProject = async (req, res) => {
  try {
    const { data, error } = parseProject(req.body)
    if (error) return res.status(400).json({ message: error })

    const project = await Project.create({ ...data, user: req.user._id })
    res.status(201).json(project)
  } catch (error) {
    console.error(error)
    res.status(500).json({ message: 'Server error' })
  }
}

export const updateProject = async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(404).json({ message: 'Project not found' })
    }

    const { data, error } = parseProject(req.body)
    if (error) return res.status(400).json({ message: error })

    const project = await Project.findOneAndUpdate(
      { _id: req.params.id, user: req.user._id },
      data,
      { new: true, runValidators: true }
    )

    if (!project) return res.status(404).json({ message: 'Project not found' })
    res.json(project)
  } catch (error) {
    console.error(error)
    res.status(500).json({ message: 'Server error' })
  }
}

export const deleteProject = async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(404).json({ message: 'Project not found' })
    }

    const project = await Project.findOneAndDelete({
      _id: req.params.id,
      user: req.user._id,
    })

    if (!project) return res.status(404).json({ message: 'Project not found' })
    res.json({ message: 'Project deleted' })
  } catch (error) {
    console.error(error)
    res.status(500).json({ message: 'Server error' })
  }
}