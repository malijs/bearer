# mali-bearer

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
| options.error | <code>String</code> | optional string for errors to throw in case authorization is not present                               Default: <code>"Not Authorized"</code> |
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
