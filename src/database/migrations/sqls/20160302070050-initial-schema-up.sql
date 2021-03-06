CREATE TABLE `blob` (
  `id` int(11) unsigned NOT NULL AUTO_INCREMENT,
  `hash` binary(20) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `blob_uniq_1` (`hash`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;


CREATE TABLE `blob_path` (
  `id` int(11) unsigned NOT NULL AUTO_INCREMENT,
  `blob_id` int(11) unsigned NOT NULL,
  `hash` binary(20) NOT NULL,
  `path` text NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `blob_path_uniq_1` (`blob_id`, `hash`),
  CONSTRAINT `blob_path_fk_1` FOREIGN KEY (`blob_id`) REFERENCES `blob`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8;


CREATE TABLE `semaphore` (
  `id` BINARY(20) NOT NULL,
  `path` text NOT NULL,
  `created_at` timestamp NOT NULL default CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

