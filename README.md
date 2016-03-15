# tinifyd

[![Build Status](https://travis-ci.org/itconsultis/weixin-payment.svg?branch=develop)](https://travis-ci.org/itconsultis/weixin-payment)

tinifyd is a NodeJS process that continuously monitors one or more
filesystem paths for changes to PNG and JPEG images, and compresses them on
the fly via HTTP calls to the [TinyPNG API](https://tinypng.com/developers/reference).

The daemon records the SHA-1 sum of every every image it has ever processed
in a SQL database. This prevents the same file from being optimized more
than once, preserving image quality.


## Features

- Low CPU load; images are compressed on TinyPNG's servers
- Images are optimized only once


## Requirements

- TinyPNG [API key](https://tinypng.com/developers)
- [Docker](http://www.docker.com/) (if you want to run the daemon inside a container)



## How to run the daemon

### Via Docker

- Clone this repository

    git clone -b $VERSION_TAG --depth 1 git@github.com:itconsultis/tinifyd.git

  (replace `$VERSION_TAG` with the version you want)

- Copy `src/.env.example` to `src/.env`.

- Edit `src/.env` as needed.

- Run the `start` script from the project root.

    ./start

## Workflow

### Image optimization

#### Single image optimization procedure

ensure the image is a JPG or PNG
record a lock on the image path
compute the current hash sum of the image
ensure the hash sum is not in the blob table; escape if it is
optimize the image via tinify
compute the hash sum of the optimized image
replace the original with the optimized one
record the optimized hash sum in the blob table
release the lock on image path
```

### Batch optimization procedure
```
iterate over JPG and PNG image blobs found in the source directory
execute single image optimization procedure on each image that is found
```

### Filesystem change event handling
```
listen for file change events on the source directory
execute single image optimization procedure on each file that changes
```

### Locks

Locking will be pessimistic.

Periodically something (or someone) will need to remove stale locks.
Details TBD.

## Concurrency

Each single image optimization procedure is to be *queued* into one ore more
asynchronous task buffers. Each async buffer will have a cap on the number
of concurrent optimization operations. This cap is to be configurable.


## License

MIT

