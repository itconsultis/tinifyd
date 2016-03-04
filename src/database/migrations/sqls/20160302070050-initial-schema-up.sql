CREATE TABLE `blob` (
  `hash` BINARY(20) NOT NULL,
  PRIMARY KEY (`hash`),
) ENGINE=InnoDB DEFAULT CHARSET=utf8;


CREATE TABLE `semaphore` (
  `hash` BINARY(20) NOT NULL,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`hash`),
  KEY `semaphore_idx_1` (`created_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

