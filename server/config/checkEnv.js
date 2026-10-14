// Stops the server at startup, with a clear message, if a required setting is missing
export const checkEnv = () => {
  const problems = []

  if (!process.env.MONGO_URI) problems.push('MONGO_URI is missing')
  if ((process.env.JWT_SECRET || '').length < 32) {
    problems.push('JWT_SECRET is missing or shorter than 32 characters')
  }

  if (problems.length > 0) {
    console.error(`Server cannot start:\n- ${problems.join('\n- ')}`)
    console.error(
      'Create a JWT secret with: node -e "console.log(require(\'node:crypto\').randomBytes(32).toString(\'hex\'))"'
    )
    process.exit(1)
  }
}