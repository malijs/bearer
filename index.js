const auth = require('mali-metadata-auth')

/**
 * Mali bearer authorization metadata middleware.
 * If the call has metadata with "authorization" string property with "Bearer <token>" then specified function is called
 * @module mali-bearer
 *
 * @param  {Options} options
 * @param  {String} options.error optional string for errors to throw in case authorization is not present
 *                               Default: <code>"Not Authorized"</code>
 * @param  {Function} fn The middleware function to execute with signature <code>(token, ctx, next)</code>
 *
 * @example
 * const bearer = require('mali-bearer')
 *
 * app.use(bearer(async (token, ctx, next) => {
 *   console.log(token)
 *   await next()
 * })
 */
module.exports = function (options, fn) {
  if (typeof options === 'function') {
    fn = options
    options = {}
  }

  if (typeof options.error !== 'string' || !options.error) {
    options.error = 'Not Authorized'
  }

  return auth(options, (authorization, ctx, next) => {
    if (!authorization) throw new Error(options.error)

    const parts = authorization.split(' ')
    if (parts.length !== 2) throw new Error(options.error)

    const scheme = parts[0]
    const credentials = parts[1]

    let token
    if (/^Bearer$/i.test(scheme)) {
      token = credentials
    }

    if (!token) throw new Error(options.error)

    return fn(token, ctx, next)
  })
}
