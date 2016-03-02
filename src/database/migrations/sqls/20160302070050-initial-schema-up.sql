CREATE TABLE `blob` (
  `hash` BINARY(20) NOT NULL,
  `path` TEXT DEFAULT NULL,
  `optimized_at` TIMESTAMP NULL DEFAULT NULL,
  PRIMARY KEY (`hash`),
  KEY `blob_idx_1` (`optimized_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

CREATE TABLE `semaphore` (
  `context` VARCHAR(255) CHARACTER SET latin1 NOT NULL,
  `key` VARCHAR(255) CHARACTER SET latin1 NOT NULL,
  `expires_at` TIMESTAMP NULL DEFAULT NULL,
  PRIMARY KEY (`context`, `key`),
  KEY `semaphore_idx_1` (`expires_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

