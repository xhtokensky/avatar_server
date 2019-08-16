ALTER TABLE tokensky_user add invitation int(11) DEFAULT 0 comment "是否拥有邀请权限，0不可以 1可以" AFTER level;
