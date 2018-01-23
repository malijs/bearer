# mali-bearer

[![Greenkeeper badge](https://badges.greenkeeper.io/malijs/bearer.svg)](https://greenkeeper.io/)

Mali bearer token metadata authorization middleware

[![npm version](https://img.shields.io/npm/v/mali-bearer.svg?style=flat-square)](https://www.npmjs.com/package/mali-bearer)
[![build status](https://img.shields.io/travis/malijs/bearer/master.svg?style=flat-square)](https://travis-ci.org/malijs/bearer)

## API

<a name="module_mali-bearer"></a>

### mali-bearer
Mali bearer authorization metadata middleware.
If the call has metadata with "authorization" string property with "Bearer <token>" then specified function is called


| Param | Type | Description |
| --- | --- | --- |
| options | <code>Options</code> |  |
| options.error | <code>String</code> &#124; <code>Object</code> &#124; <code>function</code> | optional Error creation options.                                                If <code>String</code> the message for Error to throw in case                                                authorization is not present.                                                If <code>Object</code> the error options with <code>message</code>,                                                <code>code</code>, and <code>metadata</code> properties. See <code>create-grpc-error</code>                                                module.                                                If <code>Function</code> a function with signature <code>(ctx)</code>                                                called to create an error. Must return an <code>Error</code> instanse.                                                Default: <code>"Not Authorized"</code> |
| fn | <code>function</code> | The middleware function to execute with signature <code>(token, ctx, next)</code> |

**Example**  

```js
const bearer = require('mali-bearer')

app.use(bearer(async (token, ctx, next) => {
  console.log(token)
  await next()
})
```

## License

  Apache-2.0
