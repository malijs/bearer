const fieldAuth = require('mali-metadata-field-auth')

/**
 * Mali bearer authorization metadata middleware.
 * If the call has metadata with "authorization" string property with "Bearer <token>" then specified function is called
 * @module mali-bearer
 *
 * @param  {Options} options
 * @param  {String|Object|Function} options.error optional Error creation options.
*                                                If <code>String</code> the message for Error to throw in case
*                                                authorization is not present.
*                                                If <code>Object</code> the error options with <code>message</code>,
*                                                <code>code</code>, and <code>metadata</code> properties. See <code>create-grpc-error</code>
*                                                module.
*                                                If <code>Function</code> a function with signature <code>(ctx)</code>
*                                                called to create an error. Must return an <code>Error</code> instanse.
*                                                Default: <code>"Not Authorized"</code>
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

  return fieldAuth('Bearer', options, fn)
}
