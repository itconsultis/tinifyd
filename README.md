# tinifyd

tinifyd is a NodeJS process that continuously monitors one or more
filesystem paths for changes to PNG and JPEG images, and compresses them on
the fly via HTTP calls to the [TinyPNG API](https://tinypng.com/developers/reference).

The daemon records the SHA-1 sum of every every image it has ever processed
in a SQL database. This prevents the same file from being optimized more
than once.


## Features

- Low CPU load; images are compressed on TinyPNG's servers
- Images are optimized only once
- [Fully tested](./src/tests)


## Requirements

- TinyPNG [API key](https://tinypng.com/developers)
- [Docker](http://www.docker.com/) (but only if you want to run the daemon inside a container)


## License

The MIT License (MIT)

Copyright (c) 2015 by IT Consultis Ltd.

Permission is hereby granted, free of charge, to any person obtaining a
copy of this software and associated documentation files (the "Software"),
to deal in the Software without restriction, including without limitation
the rights to use, copy, modify, merge, publish, distribute, sublicense,
and/or sell copies of the Software, and to permit persons to whom the
Software is furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in
all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING
FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS
IN THE SOFTWARE.
