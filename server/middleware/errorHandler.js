export const notFound = (req, res) => {
  res.status(404).json({ message: 'Not found' })
}

// The safety net for anything a controller did not catch
export const errorHandler = (err, req, res, next) => {
  if (res.headersSent) return next(err)

  if (err.type === 'entity.parse.failed') {
    return res.status(400).json({ message: 'The request could not be read' })
  }
  if (err.type === 'entity.too.large') {
    return res.status(413).json({ message: 'The request is too large' })
  }

  console.error(err)
  res.status(500).json({ message: 'Server error' })
}