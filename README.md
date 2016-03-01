# tinifyd

tinifyd is a NodeJS process that continuously monitors one or more filesystem
paths for changes to PNG and JPEG images, and compresses them on the fly via
HTTP calls to the [TinyPNG API](https://tinypng.com/developers/reference).

The daemon records the SHA-1 sum of every every image it has ever processed in
a SQL database. This prevents the same file from being optimized more than once.


## Features

- Low CPU load; images are compressed on TinyPNG's servers
- Images are optimized only once
- [Fully tested](./src/tests)

