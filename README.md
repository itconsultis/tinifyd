# tinifyd

[![Build Status](https://travis-ci.org/itconsultis/tinifyd.svg?branch=master)](https://travis-ci.org/itconsultis/tinifyd)

tinifyd is a NodeJS process that continuously monitors a filesystem path
for changes to PNG and JPEG images. It compresses images on the fly via
the [TinyPNG API](https://tinypng.com/developers/reference).

TinyPNG is a fantastic image compression service, but its algorithm is lossy.
Repeatedly compressing the same image will result in perceptible image degradation.
tinifyd remembers the SHA-1 sum of every image that is has ever optimized, along
with its path so that images are optimized *only once*.

## Features

- Low CPU load; images are compressed on TinyPNG's servers
- Images are optimized only once

## Requirements

- TinyPNG [API key](https://tinypng.com/developers)
- [Docker](http://www.docker.com/) (if you want to run the daemon inside a container)

## How to run the daemon

### Via Docker

- Clone this repository

  ```
  git clone -b 0.9.1 --depth 1 git@github.com:itconsultis/tinifyd.git
  ```

- Copy `src/.env.example` to `src/.env`.

- Edit `src/.env` as needed.

- Run the `start` script from the project root.

  ```
  ./start
  ```

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
- Ensure the hash sum is not in the blob table; escape if it is
- Optimize the image via tinify
- Compute the hash sum of the optimized image
- Replace the original with the optimized one
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

## License

MIT

