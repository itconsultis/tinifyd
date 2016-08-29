# tinifyd

**This software is not yet tested. Do NOT use it until this notice is removed. You are warned!**

[![Build Status](https://travis-ci.org/itconsultis/tinifyd.svg?branch=master)](https://travis-ci.org/itconsultis/tinifyd)

tinifyd is a NodeJS process that continuously monitors a filesystem path
for changes to PNG and JPEG images. It compresses images on the fly via
the [TinyPNG API](https://tinypng.com/developers/reference).

TinyPNG is a fantastic image compression service, but its algorithm is lossy.
Repeatedly compressing the same image will result in perceptible image degradation.
tinifyd remembers the SHA-1 sum of every image that is has ever optimized, along
with its path so that images are optimized *only once*.

tinifyd is useful if you are running a CMS whose users can't be bothered to
optimize images before they are uploaded. It does *not* replace a proper build
process that optimizes images, and never will. It might save you some bandwidth
(i.e., money) however.

## Features

- Low CPU load; images are compressed on TinyPNG's servers
- Images are optimized only once
- Smart image type detection via [mmagic](https://github.com/mscdex/mmmagic)
- Unoptimized image originals are backed up

## Requirements

- TinyPNG [API key](https://tinypng.com/developers)
- [Docker](http://www.docker.com/) (if you want to run the daemon inside a container)

## How to run the daemon

### Via Docker

- Clone this repository

  ```
  git clone -b 0.12.0 git@github.com:itconsultis/tinifyd.git
  ```

- Copy `src/.env.example` to `src/.env`.

- Edit `src/.env` as needed.

- Run the `start` script from the project root.

  ```
  ./start
  ```

### Environment variables

`TINIFYD_API_KEY`

Your Tinify API key

`TINIFYD_SOURCE_PATH`

Absolute filesystem path to the images you want to optimize.

`TINIFYD_TEMP_PATH` (/tmp/tinifyd)

Directory that holds temporary image copies created during an optimization. 
This directory must be writable by the node process.

`TINIFYD_BACKUP_PATH` 

Image originals inside TINIFYD_SOURCE_PATH are backed up to this directory.
This directory must be writable by the node process.

`TINIFYD_API_DUMMY`

Whether to use a dummy tinify client (which doesn't optimize images at all)

`TINIFYD_CONCURRENCY`

Maximum number of concurrent optimization operations tinifyd is allowed to
perform at any given moment.

`TINIFYD_LOCK_TIMEOUT`

Locks older than this TTL (milliseconds) are deleted by the janitor plugin.

`TINIFYD_OPTIMIZER_FREQUENCY`

This determins how often the optimizer plugin will perform a full scan of
TINIFYD_SOURCE_PATH and process unoptimized images within.

`TINIFYD_DB_DATA_VOLUME`

MySQL data directory (Docker host volume)

## How to run tests

```
npm test
```

## Workflow

### Image optimization

#### Single image optimization procedure

- Ensure the image is a JPG or PNG
- Acquire a lock on the image path
- Compute the current hash sum of the image
- Ensure the hash sum is not in the blob table (meaning it is optimized); escape if it is
- Back up the image original
- Optimize the image via tinify
- Compute the hash sum of the optimized image
- Replace (clobber) the image original with the optimized one
- Record the optimized hash sum in the blob table
- Release the lock on image path

### Batch optimization procedure

- Iterate over JPG and PNG image blobs found in the source directory
- Execute single image optimization procedure on each image that is found

### Filesystem change event handling

- Listen for file change events on the source directory
- Execute single image optimization procedure on each file that changes


### Locks

Locking will be pessimistic. The `janitor` plugin will periodically remove
stale locks.

## Concurrency

Each single image optimization procedure is to be *queued* into one ore more
asynchronous task buffers. Each async buffer will have a cap on the number
of concurrent optimization operations. This cap is to be configurable.

## Todos

- put both node and mysql processes inside one Docker container
- tests

## License

MIT

