const fs = require('node:fs')
const path = require('node:path')

const userProfile = process.env.USERPROFILE || process.env.HOME
const profileLower = userProfile ? userProfile.toLowerCase() : null

const isRestricted = (targetPath) => {
  if (!profileLower || !targetPath) return false
  const normalized = targetPath.toLowerCase()
  return normalized.startsWith(profileLower)
}

if (userProfile) {
  const wrapAsync = (original) =>
    function patchedAsync(...args) {
      const target = typeof args[0] === 'string' ? args[0] : args[0]?.toString?.()
      const lastArg = args[args.length - 1]

      if (typeof lastArg === 'function') {
        const callback = lastArg
        args[args.length - 1] = function wrappedCallback(err, files) {
          if (err && err.code === 'EPERM' && isRestricted(target)) {
            return callback(null, [])
          }
          return callback(err, files)
        }
        return original.apply(fs, args)
      }

      try {
        const result = original.apply(fs, args)
        if (result && typeof result.then === 'function') {
          return result.catch((err) => {
            if (err && err.code === 'EPERM' && isRestricted(target)) {
              return []
            }
            throw err
          })
        }
        return result
      } catch (err) {
        if (err && err.code === 'EPERM' && isRestricted(target)) {
          return []
        }
        throw err
      }
    }

  const wrapSync = (original) =>
    function patchedSync(...args) {
      const target = typeof args[0] === 'string' ? args[0] : args[0]?.toString?.()
      try {
        return original.apply(fs, args)
      } catch (err) {
        if (err && err.code === 'EPERM' && isRestricted(target)) {
          return []
        }
        throw err
      }
    }

  if (typeof fs.readdir === 'function') {
    fs.readdir = wrapAsync(fs.readdir)
  }

  if (typeof fs.readdirSync === 'function') {
    fs.readdirSync = wrapSync(fs.readdirSync)
  }

  if (fs.promises && typeof fs.promises.readdir === 'function') {
    const original = fs.promises.readdir.bind(fs.promises)
    fs.promises.readdir = async function patchedPromise(...args) {
      const target = typeof args[0] === 'string' ? args[0] : args[0]?.toString?.()
      try {
        return await original(...args)
      } catch (err) {
        if (err && err.code === 'EPERM' && isRestricted(target)) {
          return []
        }
        throw err
      }
    }
  }
}
