
DROP TABLE IF EXISTS `c2c_account`;
CREATE TABLE `c2c_account` (
  `account_id` int(11) unsigned NOT NULL AUTO_INCREMENT COMMENT '账户表主键',
  `user_id` int(11) NOT NULL COMMENT '用户id',
  `yes_ transaction_amount` bigint(20) NOT NULL DEFAULT '0' COMMENT '已经交易的金额',
  `yes_coin_amount` bigint(20) NOT NULL DEFAULT '0' COMMENT '已经交易币的总金额',
  `creator_id` int(11) DEFAULT NULL COMMENT '创建人ID',
  `create_time` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `create_ip` varchar(30) DEFAULT NULL COMMENT 'IP地址',
  `updater_id` int(11) DEFAULT NULL COMMENT '更新人ID',
  `update_time` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  `update_ip` varchar(30) DEFAULT NULL COMMENT '更新人IP地址',
  PRIMARY KEY (`account_id`),
  KEY `user_id` (`user_id`)
) ENGINE=InnoDB AUTO_INCREMENT=1 DEFAULT CHARSET=utf8 COMMENT='用户账户表';

DROP TABLE IF EXISTS `c2c_account_bank`;
CREATE TABLE `c2c_account_bank` (
  `bank_id` int(11) unsigned NOT NULL AUTO_INCREMENT COMMENT 'id',
  `user_id` int(11) NOT NULL COMMENT '用户ID',
  `card_no` varchar(30) DEFAULT NULL COMMENT '银行卡号',
  `bank_name` varchar(50) DEFAULT NULL COMMENT '银行名称',
  `bank_branch_name` varchar(100) DEFAULT NULL COMMENT '银行支行名称',
  `province` varchar(50) DEFAULT NULL COMMENT '省份',
  `city` varchar(50) DEFAULT NULL COMMENT '市县',
  `area` varchar(50) DEFAULT NULL COMMENT '国家',
  `alipay` mediumtext COMMENT '支付宝url',
  `creator_id` int(11) DEFAULT NULL COMMENT '创建人ID',
  `create_time` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `create_ip` varchar(30) DEFAULT NULL COMMENT 'IP地址',
  `updater_id` int(11) DEFAULT NULL COMMENT '更新人ID',
  `update_time` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  `update_ip` varchar(30) DEFAULT NULL COMMENT '更新人IP地址',
  PRIMARY KEY (`bank_id`),
  UNIQUE KEY `user_id` (`user_id`)
) ENGINE=InnoDB AUTO_INCREMENT=1 DEFAULT CHARSET=utf8 COMMENT='用户银行账户表';


SET NAMES utf8;
SET FOREIGN_KEY_CHECKS = 0;

-- ----------------------------
--  Table structure for `operation_banner`
-- ----------------------------
DROP TABLE IF EXISTS `operation_banner`;
CREATE TABLE `operation_banner` (
  `bid` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `url` varchar(255) COLLATE utf8_bin DEFAULT NULL COMMENT '地址',
  `img_key` varchar(255) COLLATE utf8_bin DEFAULT NULL COMMENT '图片地址',
  `seq` int(11) DEFAULT NULL COMMENT '排序',
  `create_time` datetime DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `update_time` datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  `status` int(11) DEFAULT '1' COMMENT '状态',
  `name` varchar(200) COLLATE utf8_bin DEFAULT NULL,
  `admin_id` int(11) DEFAULT NULL,
  PRIMARY KEY (`bid`)
) ENGINE=InnoDB AUTO_INCREMENT=6 DEFAULT CHARSET=utf8 COLLATE=utf8_bin;

-- ----------------------------
--  Records of `operation_banner`
-- ----------------------------
BEGIN;
INSERT INTO `operation_banner` VALUES ('5', 'hashrate', 'WechatIMG4.png', '1', null, '2019-08-01 11:43:22', '1', '丰水期限期优惠', '0');
COMMIT;

SET FOREIGN_KEY_CHECKS = 1;



DROP TABLE IF EXISTS `role_black_list`;
CREATE TABLE `role_black_list` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `phone` varchar(255) DEFAULT NULL COMMENT '电话',
  `balck_type` int(11) DEFAULT NULL COMMENT '黑名单类型 1 是禁止登陆 2是禁止otc交易\n状态备注\n',
  `start_time` datetime DEFAULT NULL COMMENT '创建时间',
  `end_time` datetime DEFAULT NULL COMMENT '结束时间',
  `period_time` int(11) DEFAULT NULL COMMENT '持续时间(单位秒)',
  `user_id` int(11) NOT NULL COMMENT '用户did',
  PRIMARY KEY (`id`),
  KEY `phone` (`phone`) USING BTREE COMMENT '电话索引',
  KEY `userId` (`user_id`) USING BTREE COMMENT '用户id索引'
) ENGINE=InnoDB AUTO_INCREMENT=1 DEFAULT CHARSET=utf8 COLLATE=utf8_bin;


DROP TABLE IF EXISTS `tokensky_account_bank`;
CREATE TABLE `tokensky_account_bank` (
  `key_id` int(11) NOT NULL AUTO_INCREMENT,
  `user_id` int(11) NOT NULL,
  `bank_user_name` varchar(50) DEFAULT NULL,
  `bank_card_no` varchar(50) DEFAULT NULL,
  `bank_name` varchar(50) DEFAULT NULL,
  `bank_branch_name` varchar(200) DEFAULT NULL,
  `alipay_user_name` varchar(100) DEFAULT NULL,
  `alipay_account` varchar(100) DEFAULT NULL,
  `alipay_qr_code` varchar(255) DEFAULT NULL,
  `wechat_user_name` varchar(100) DEFAULT NULL,
  `wechat_account` varchar(100) DEFAULT NULL,
  `wechat_qr_code` varchar(100) DEFAULT NULL,
  `status` int(11) NOT NULL DEFAULT '1',
  `type` int(11) DEFAULT '1' COMMENT '1银行卡 2支付宝 3微信',
  `create_time` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `update_time` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`key_id`),
  KEY `user_id_index` (`user_id`),
  KEY `key_id_index` (`key_id`)
) ENGINE=InnoDB AUTO_INCREMENT=1 DEFAULT CHARSET=utf8 COMMENT='收款管理地址表';

DROP TABLE IF EXISTS `tokensky_address_book`;
CREATE TABLE `tokensky_address_book` (
  `address_id` int(11) NOT NULL AUTO_INCREMENT,
  `user_id` int(11) NOT NULL,
  `receipt_address` varchar(255) NOT NULL,
  `wallet_type_id` int(11) NOT NULL,
  `wallet_type_name` varchar(255) NOT NULL,
  `address_name` varchar(255) NOT NULL,
  `status` int(11) NOT NULL DEFAULT '1',
  `create_time` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `update_time` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`address_id`),
  KEY `user_id_index` (`user_id`)
) ENGINE=InnoDB AUTO_INCREMENT=1 DEFAULT CHARSET=utf8 COMMENT='地址簿表';

DROP TABLE IF EXISTS `tokensky_check`;
CREATE TABLE `tokensky_check` (
  `check_id` int(11) unsigned NOT NULL AUTO_INCREMENT COMMENT '验证码id',
  `device_id` varchar(128) NOT NULL COMMENT '设备标识',
  `check_code` varchar(12) NOT NULL COMMENT '图片验证码',
  `status` int(2) DEFAULT '0' COMMENT '业务类型',
  `update_time` int(32) NOT NULL DEFAULT '0' COMMENT '更新时间',
  PRIMARY KEY (`check_id`)
) ENGINE=InnoDB AUTO_INCREMENT=1 DEFAULT CHARSET=utf8;



SET NAMES utf8;
SET FOREIGN_KEY_CHECKS = 0;

-- ----------------------------
--  Table structure for `tokensky_chongbi_config`
-- ----------------------------
DROP TABLE IF EXISTS `tokensky_chongbi_config`;
CREATE TABLE `tokensky_chongbi_config` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `coin_type` varchar(255) NOT NULL,
  `min` double(255,8) NOT NULL,
  `admin_id` int(11) DEFAULT NULL,
  `status` int(11) NOT NULL DEFAULT '1',
  `create_time` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `service_charge` double(255,8) DEFAULT NULL COMMENT '百分比手续费',
  `base_service_charge` double(255,8) DEFAULT NULL COMMENT '基础手续费',
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8 COMMENT='充币配置表';

-- ----------------------------
--  Records of `tokensky_chongbi_config`
-- ----------------------------
BEGIN;
INSERT INTO `tokensky_chongbi_config` VALUES ('1', 'BTC', '0.00000001', '0', '1', '2019-06-10 19:10:46', null, null), ('2', 'BCH', '0.00000001', null, '1', '2019-06-10 19:11:42', null, null), ('3', 'USDT', '0.00000001', null, '1', '2019-06-10 19:11:59', null, null);
COMMIT;

SET FOREIGN_KEY_CHECKS = 1;


DROP TABLE IF EXISTS `tokensky_chongbi_config_bak`;
CREATE TABLE `tokensky_chongbi_config_bak` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `coin_type` varchar(255) NOT NULL,
  `min` double(255,8) NOT NULL,
  `admin_id` int(11) DEFAULT NULL,
  `status` int(11) NOT NULL DEFAULT '1',
  `create_time` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `service_charge` double(255,8) DEFAULT NULL COMMENT '百分比手续费',
  `base_service_charge` double(255,8) DEFAULT NULL COMMENT '基础手续费',
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COMMENT='充币配置表';


DROP TABLE IF EXISTS `tokensky_jiguang_im_user_register`;
CREATE TABLE `tokensky_jiguang_im_user_register` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `username` varchar(50) NOT NULL,
  `password` varchar(50) NOT NULL,
  `appkey` varchar(100) NOT NULL,
  `create_time` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `username_index` (`username`),
  KEY `appkey_index` (`appkey`)
) ENGINE=InnoDB AUTO_INCREMENT=1 DEFAULT CHARSET=utf8 COMMENT='im聊天用户注册记录';


DROP TABLE IF EXISTS `tokensky_jiguang_registrationid`;
CREATE TABLE `tokensky_jiguang_registrationid` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `user_id` int(11) NOT NULL,
  `registration_id` varchar(100) NOT NULL,
  `create_time` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `update_time` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `user_id_index` (`user_id`)
) ENGINE=InnoDB AUTO_INCREMENT=1 DEFAULT CHARSET=utf8 COMMENT='极光ID关联表';


DROP TABLE IF EXISTS `tokensky_message`;
CREATE TABLE `tokensky_message` (
  `message_id` int(11) NOT NULL AUTO_INCREMENT,
  `title` varchar(255) NOT NULL,
  `content` varchar(255) NOT NULL,
  `type` int(11) NOT NULL DEFAULT '0' COMMENT '0全部 1个人',
  `user_id` int(20) DEFAULT NULL,
  `editor_id` int(11) DEFAULT NULL,
  `status` int(11) NOT NULL DEFAULT '1',
  `create_time` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `update_time` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `admin_id` int(11) DEFAULT NULL,
  `system` int(11) NOT NULL DEFAULT '0' COMMENT '0 admin 1 app',
  `relevance_id` varchar(255) DEFAULT NULL COMMENT '关联ID',
  `msg_category` enum('otc','manageMoney','loan','system','hashrate','quote') NOT NULL COMMENT '消息内容类型',
  `msg_route` enum('otcDetails') DEFAULT NULL COMMENT '跳转路由',
  `is_read` int(11) NOT NULL DEFAULT '0' COMMENT '是否已读  1已读 0未读',
  `read_time` datetime DEFAULT NULL,
  PRIMARY KEY (`message_id`)
) ENGINE=InnoDB AUTO_INCREMENT=1 DEFAULT CHARSET=utf8 COMMENT='消息表';


DROP TABLE IF EXISTS `tokensky_message_read_record`;
CREATE TABLE `tokensky_message_read_record` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `user_id` int(11) NOT NULL,
  `message_id` int(11) NOT NULL,
  `read_time` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `message_id_index` (`message_id`),
  KEY `user_id_index` (`user_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COMMENT='全局消息已读记录';

DROP TABLE IF EXISTS `tokensky_order_ids`;
CREATE TABLE `tokensky_order_ids` (
  `order_id` varchar(100) NOT NULL,
  `create_time` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`order_id`),
  KEY `order_id_index` (`order_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COMMENT='ordered纪录表';


DROP TABLE IF EXISTS `tokensky_otc_chat_record`;
CREATE TABLE `tokensky_otc_chat_record` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `from_user_id` int(11) NOT NULL,
  `to_user_id` int(11) NOT NULL,
  `order_id` varchar(100) NOT NULL,
  `content` text NOT NULL,
  `send_time` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `status` int(11) NOT NULL DEFAULT '1' COMMENT '1已读 0未读',
  `room_id` varchar(100) NOT NULL,
  `msg_id` varchar(100) DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `from_user_id_index` (`from_user_id`),
  KEY `to_user_id_index` (`to_user_id`),
  KEY `order_id_index` (`order_id`),
  KEY `room_id_index` (`room_id`)
) ENGINE=InnoDB AUTO_INCREMENT=1 DEFAULT CHARSET=utf8 COMMENT='otc聊天记录';

DROP TABLE IF EXISTS `tokensky_otc_chat_room`;
CREATE TABLE `tokensky_otc_chat_room` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `order_id` varchar(100) NOT NULL,
  `user_id` int(11) NOT NULL COMMENT '挂委托单放ID',
  `user_id2` int(11) NOT NULL COMMENT '买卖方ID',
  `status` int(11) NOT NULL DEFAULT '1',
  `create_time` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `order_id_index` (`order_id`),
  KEY `user_id_index` (`user_id`),
  KEY `user_id2_index` (`user_id2`)
) ENGINE=InnoDB AUTO_INCREMENT=1 DEFAULT CHARSET=utf8 COMMENT='otc聊天列表';

DROP TABLE IF EXISTS `tokensky_real_auth`;
CREATE TABLE `tokensky_real_auth` (
  `key_id` int(11) NOT NULL AUTO_INCREMENT,
  `user_id` int(11) NOT NULL,
  `name` varchar(100) NOT NULL,
  `identity_card` varchar(20) NOT NULL,
  `identity_card_picture` varchar(255) DEFAULT NULL COMMENT '身份证正',
  `identity_card_picture2` varchar(255) DEFAULT NULL COMMENT '身份证反',
  `person_picture` varchar(255) DEFAULT NULL COMMENT '人脸照片',
  `status` int(11) NOT NULL DEFAULT '0' COMMENT '0未审核 1通过 2未通过',
  `create_time` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `update_time` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`key_id`),
  KEY `key_id_index` (`key_id`),
  KEY `user_id_index` (`user_id`)
) ENGINE=InnoDB AUTO_INCREMENT=39 DEFAULT CHARSET=utf8 COMMENT='身份认证表';

DROP TABLE IF EXISTS `tokensky_real_auth_info`;
CREATE TABLE `tokensky_real_auth_info` (
  `key_id` int(11) NOT NULL AUTO_INCREMENT,
  `user_id` int(11) NOT NULL,
  `name` varchar(255) NOT NULL,
  `nation` varchar(100) NOT NULL COMMENT '名族',
  `address` varchar(255) NOT NULL,
  `identity_card` varchar(20) NOT NULL,
  `birthday` varchar(10) NOT NULL,
  `sex` varchar(10) NOT NULL,
  `expiry_date` varchar(10) NOT NULL COMMENT '到期日期',
  `issuing_authority` varchar(255) NOT NULL COMMENT '签发机关',
  `issuing_date` varchar(10) NOT NULL COMMENT '签发日期',
  `confidence` double DEFAULT NULL COMMENT '人脸识别 识别度',
  `create_time` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`key_id`),
  KEY `user_id_index` (`user_id`)
) ENGINE=InnoDB AUTO_INCREMENT=21 DEFAULT CHARSET=utf8;

DROP TABLE IF EXISTS `tokensky_sms`;
CREATE TABLE `tokensky_sms` (
  `sms_id` int(11) unsigned NOT NULL AUTO_INCREMENT COMMENT '主键ID',
  `user_id` int(11) NOT NULL DEFAULT '0' COMMENT '登陆用户id',
  `phone` varchar(50) NOT NULL COMMENT '手机号',
  `code` varchar(12) NOT NULL COMMENT '验证码',
  `status` int(2) DEFAULT '0' COMMENT '状态1.手机登录，0手机注册',
  `user_status` int(2) NOT NULL DEFAULT '0' COMMENT '注册或者登录的状态1, 成功， 2, 失败',
  `update_time` int(32) NOT NULL DEFAULT '0' COMMENT '更新时间',
  PRIMARY KEY (`sms_id`),
  KEY `user_id` (`user_id`)
) ENGINE=InnoDB AUTO_INCREMENT=771 DEFAULT CHARSET=utf8;



SET NAMES utf8;
SET FOREIGN_KEY_CHECKS = 0;

-- ----------------------------
--  Table structure for `tokensky_tibi_config`
-- ----------------------------
DROP TABLE IF EXISTS `tokensky_tibi_config`;
CREATE TABLE `tokensky_tibi_config` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `coin_type` varchar(255) NOT NULL,
  `min` double(255,8) NOT NULL,
  `max` double(255,8) NOT NULL,
  `service_charge` double(255,8) NOT NULL COMMENT '百分比手续费',
  `base_service_charge` double NOT NULL DEFAULT '0.001' COMMENT '基础手续费',
  `cur_day_quantity` double(255,8) DEFAULT NULL COMMENT '最大提币数量',
  `admin_id` int(11) DEFAULT NULL,
  `status` int(11) NOT NULL DEFAULT '1',
  `create_time` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=6 DEFAULT CHARSET=utf8 COMMENT='提币配置表';

-- ----------------------------
--  Records of `tokensky_tibi_config`
-- ----------------------------
BEGIN;
INSERT INTO `tokensky_tibi_config` VALUES ('1', 'BTC', '0.01000000', '1000.00000000', '0.00100000', '0', null, '1', '1', '2019-06-10 19:15:14'), ('2', 'BCH', '0.10000000', '100.00000000', '0.00100000', '0', null, '0', '1', '2019-06-10 19:16:10'), ('3', 'USDT', '10.00000000', '1000.00000000', '0.00100000', '0', null, null, '1', '2019-06-10 19:17:10'), ('5', 'BTH', '1.00000000', '10.00000000', '1.00000000', '1', '2000.00000000', '0', '0', '2019-06-17 14:13:54');
COMMIT;

SET FOREIGN_KEY_CHECKS = 1;


DROP TABLE IF EXISTS `tokensky_tibi_config_bak`;
CREATE TABLE `tokensky_tibi_config_bak` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `coin_type` varchar(255) NOT NULL,
  `min` double(255,8) NOT NULL,
  `max` double(255,8) NOT NULL,
  `service_charge` double(255,8) NOT NULL COMMENT '百分比手续费',
  `base_service_charge` double NOT NULL DEFAULT '0.001' COMMENT '基础手续费',
  `cur_day_quantity` double(255,8) DEFAULT NULL COMMENT '最大提币数量',
  `admin_id` int(11) DEFAULT NULL,
  `status` int(11) NOT NULL DEFAULT '1',
  `create_time` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COMMENT='提币配置表';


DROP TABLE IF EXISTS `tokensky_transaction_record`;
CREATE TABLE `tokensky_transaction_record` (
  `key_id` int(11) NOT NULL AUTO_INCREMENT,
  `coin_type` varchar(50) NOT NULL COMMENT '币种类型',
  `tran_type` varchar(255) NOT NULL,
  `push_time` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `category` int(1) NOT NULL COMMENT '1收入 2支出',
  `user_id` int(11) NOT NULL,
  `money` double(255,8) NOT NULL,
  `status` int(11) NOT NULL DEFAULT '0' COMMENT '0确认中 1已完成 2已失败',
  `relevance_id` varchar(255) DEFAULT NULL COMMENT 'hashrateOrder(算力订单消费),tibi(提币)，chongbi(充币)，otcOrder(otc订单),hashrateOrderProfit(算力收益), chongElectricityOrder(充电费订单), financialWithdrawalProfit(理财活期提前取出),financialCurrent(活期理财)\n,financialDeadProfit(定期理财)',
  `relevance_category` enum('hashrateOrder','tibi','chongbi','otcOrder','hashrateOrderProfit','chongElectricityOrder','financialWithdrawalProfit','financialCurrent','financialOrder','financialLiveProfit','financialDeadProfit') DEFAULT NULL,
  `in_address` varchar(255) DEFAULT NULL COMMENT '转入地址',
  `out_address` varchar(255) DEFAULT NULL COMMENT '转出地址',
  `tran_num` varchar(255) DEFAULT NULL COMMENT '交易编号',
  PRIMARY KEY (`key_id`)
) ENGINE=InnoDB AUTO_INCREMENT=1 DEFAULT CHARSET=utf8 COMMENT='交易明细表';


DROP TABLE IF EXISTS `tokensky_user`;
CREATE TABLE `tokensky_user` (
  `user_id` int(11) unsigned NOT NULL AUTO_INCREMENT COMMENT '用户ID',
  `sms_id` int(11) DEFAULT '0',
  `nick_name` varchar(50) DEFAULT NULL COMMENT '用户昵称',
  `user_name` varchar(50) DEFAULT NULL COMMENT '用户真实姓名',
  `account` varchar(100) NOT NULL DEFAULT '' COMMENT '登录账号',
  `password` varchar(100) NOT NULL DEFAULT '' COMMENT '登录密码',
  `transaction_password` varchar(200) DEFAULT NULL,
  `points` int(11) NOT NULL DEFAULT '0' COMMENT '积分',
  `user_status` int(5) NOT NULL DEFAULT '1' COMMENT '账号是否有效1为有效0为无效',
  `is_lock` int(5) NOT NULL DEFAULT '0' COMMENT '是否锁住，0未锁住，1锁住',
  `is_login` int(2) NOT NULL DEFAULT '0' COMMENT '是否登录，0未登录，1登录',
  `pwd_error_number` int(5) NOT NULL DEFAULT '0' COMMENT '密码错误次数',
  `email` varchar(100) DEFAULT NULL COMMENT '电子邮箱',
  `sex` int(5) DEFAULT '3' COMMENT '性别，1男，2女，3保密',
  `phone` varchar(30) NOT NULL DEFAULT '' COMMENT '联系电话',
  `phone_area_code` varchar(50) NOT NULL DEFAULT '86',
  `head_img` mediumtext COMMENT '用户头像',
  `regist_device_type` varchar(50) DEFAULT '' COMMENT '注册设备来源',
  `user_level` int(5) NOT NULL DEFAULT '0' COMMENT '用户等级',
  `creator_id` int(11) DEFAULT '1' COMMENT '创建人ID,1前台，2后台',
  `create_time` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `create_ip` varchar(30) DEFAULT NULL COMMENT 'IP地址',
  `updater_id` int(11) DEFAULT NULL COMMENT '更新人ID',
  `update_time` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  `update_ip` varchar(30) DEFAULT NULL COMMENT '更新人IP地址',
  `salt` varchar(64) DEFAULT '',
  `invite_code` varchar(32) DEFAULT '',
  `last_login_time` datetime DEFAULT NULL,
  `level` int(11) NOT NULL DEFAULT '1' COMMENT '等级',
  `invitation` tinyint(11) DEFAULT '0' COMMENT '是否拥有邀请权限，0不可以 1可以',
  PRIMARY KEY (`user_id`),
  UNIQUE KEY `account` (`account`),
  KEY `user_id_index` (`user_id`) USING BTREE
) ENGINE=InnoDB AUTO_INCREMENT=1 DEFAULT CHARSET=utf8 COMMENT='用户表';


DROP TABLE IF EXISTS `tokensky_user_address`;
CREATE TABLE `tokensky_user_address` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `address` varchar(255) NOT NULL,
  `coin_type` varchar(255) NOT NULL,
  `user_id` int(11) NOT NULL DEFAULT '0',
  `status` int(11) NOT NULL DEFAULT '1',
  `create_time` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `user_id_index` (`user_id`)
) ENGINE=InnoDB AUTO_INCREMENT=103760 DEFAULT CHARSET=utf8 COMMENT='用户充提币地址表';

DROP TABLE IF EXISTS `tokensky_user_balance`;
CREATE TABLE `tokensky_user_balance` (
  `key_id` int(11) NOT NULL AUTO_INCREMENT,
  `user_id` int(11) NOT NULL,
  `coin_type` varchar(255) NOT NULL DEFAULT 'BTC',
  `balance` double(255,8) NOT NULL DEFAULT '0.00000000' COMMENT '资产值',
  `frozen_balance` double(255,6) DEFAULT '0.000000' COMMENT '冻结资产',
  `create_time` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`key_id`),
  UNIQUE KEY `coon_type_user_id_index` (`coin_type`,`user_id`) USING BTREE,
  KEY `coin_type_index` (`coin_type`),
  KEY `user_id_index` (`user_id`)
) ENGINE=InnoDB AUTO_INCREMENT=53 DEFAULT CHARSET=utf8 COMMENT='用户资产表';



SET NAMES utf8;
SET FOREIGN_KEY_CHECKS = 0;

-- ----------------------------
--  Table structure for `tokensky_user_balance_coin`
-- ----------------------------
DROP TABLE IF EXISTS `tokensky_user_balance_coin`;
CREATE TABLE `tokensky_user_balance_coin` (
  `id` int(11) unsigned NOT NULL AUTO_INCREMENT COMMENT '主键ID',
  `name` varchar(255) DEFAULT NULL COMMENT '名称',
  `symbol` varchar(255) DEFAULT NULL COMMENT '标识',
  `sort` int(11) DEFAULT NULL COMMENT '排序',
  `status` int(1) DEFAULT '1' COMMENT '启动状态1为启动0为关闭',
  `avatar` varchar(255) DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4;

-- ----------------------------
--  Records of `tokensky_user_balance_coin`
-- ----------------------------
BEGIN;
INSERT INTO `tokensky_user_balance_coin` VALUES ('1', 'Bitcon', 'BTC', '1', '1', 'icon_bitcoin.png'), ('2', 'Us', 'USDT', '1', '1', 'tether_200_200.png'), ('3', 'BCHNAME', 'BCH', '1', '1', 'bitcoin-cash_200_200.png');
COMMIT;

SET FOREIGN_KEY_CHECKS = 1;


DROP TABLE IF EXISTS `tokensky_user_balance_hash`;
CREATE TABLE `tokensky_user_balance_hash` (
  `hash_id` varchar(500) NOT NULL,
  `balance_status` int(11) NOT NULL DEFAULT '0' COMMENT '0待处理1已完成',
  `source` int(11) NOT NULL DEFAULT '0' COMMENT '1后端 2后台 3定时任务',
  `model_status` int(11) DEFAULT '0' COMMENT '0未处理 1已完成',
  `create_time` datetime DEFAULT NULL ON UPDATE CURRENT_TIMESTAMP COMMENT '创建时间',
  PRIMARY KEY (`hash_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COMMENT='用户资产哈稀表';


DROP TABLE IF EXISTS `tokensky_user_balance_record`;
CREATE TABLE `tokensky_user_balance_record` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `user_id` int(11) NOT NULL,
  `symbol` varchar(255) NOT NULL DEFAULT 'BTC',
  `old_balance` double(255,8) DEFAULT '0.00000000' COMMENT '资产值',
  `old_frozen_balance` double(255,6) DEFAULT '0.000000' COMMENT '冻结资产',
  `new_balance` double(255,8) DEFAULT NULL,
  `new_frozen_balance` double(255,8) DEFAULT NULL,
  `source` int(11) DEFAULT NULL COMMENT '来源 1后端 2后台 3定时任务',
  `cont` varchar(255) DEFAULT NULL COMMENT '说明',
  `mold` varchar(255) DEFAULT NULL COMMENT '操作模块',
  `sign_id` varchar(255) DEFAULT NULL COMMENT '标示id',
  `create_time` datetime DEFAULT NULL,
  `push_time` bigint(11) DEFAULT NULL COMMENT '时间(毫秒)',
  `method_balance` varchar(16) DEFAULT NULL COMMENT '操作资产方法',
  `balance` varchar(255) DEFAULT NULL COMMENT '操作资产数量',
  `method_frozen_balance` varchar(16) DEFAULT NULL COMMENT '操作冻结资产方法',
  `frozen_balance` varchar(255) DEFAULT NULL COMMENT '操作冻结资产数量',
  `hash_id` varchar(255) DEFAULT NULL COMMENT '哈希',
  PRIMARY KEY (`id`) USING BTREE
) ENGINE=InnoDB AUTO_INCREMENT=1 DEFAULT CHARSET=utf8 COMMENT='用户资产表历史记录表';


DROP TABLE IF EXISTS `tokensky_user_chong_electricity_order`;
CREATE TABLE `tokensky_user_chong_electricity_order` (
  `key_id` int(11) NOT NULL AUTO_INCREMENT,
  `order_id` varchar(255) NOT NULL COMMENT '订单号',
  `user_id` int(11) NOT NULL,
  `money` double(255,8) NOT NULL COMMENT '充值金额',
  `pay_time` datetime NOT NULL COMMENT '支付时间',
  `pay_type` varchar(255) NOT NULL DEFAULT 'USDT' COMMENT '支付类型',
  PRIMARY KEY (`key_id`),
  KEY `user_id_index` (`user_id`)
) ENGINE=InnoDB AUTO_INCREMENT=1 DEFAULT CHARSET=utf8 COMMENT='充电订单表';


DROP TABLE IF EXISTS `tokensky_user_deposit`;
CREATE TABLE `tokensky_user_deposit` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `deposit_id` int(11) NOT NULL COMMENT '钱包服务生成的充值id\n',
  `coin_type` varchar(60) CHARACTER SET latin1 DEFAULT NULL COMMENT '货币类型',
  `txid` varchar(255) CHARACTER SET latin1 DEFAULT NULL COMMENT '充值订单号\n',
  `height` int(11) DEFAULT NULL COMMENT '充值订单所在区块高度\n',
  `amount` double(255,8) DEFAULT NULL COMMENT '充值数额',
  `chain_height` int(11) NOT NULL COMMENT '保留\n',
  `to_address` varchar(255) CHARACTER SET latin1 DEFAULT NULL COMMENT '充值目标地址\n',
  `status` int(11) DEFAULT NULL COMMENT '1 充值',
  `create_time` datetime DEFAULT NULL COMMENT '创建时间',
  `order_id` varchar(100) CHARACTER SET latin1 DEFAULT NULL COMMENT 'Id',
  `user_id` int(11) DEFAULT NULL COMMENT '用户did',
  `service_charge` double(255,8) DEFAULT NULL COMMENT '手续费',
  `finish_time` datetime DEFAULT NULL COMMENT '完成时间',
  PRIMARY KEY (`id`),
  KEY `order_id_index` (`order_id`)
) ENGINE=InnoDB AUTO_INCREMENT=1 DEFAULT CHARSET=utf8 COMMENT='充值记录表';

DROP TABLE IF EXISTS `tokensky_user_electricity_balance`;
CREATE TABLE `tokensky_user_electricity_balance` (
  `key_id` int(11) NOT NULL AUTO_INCREMENT,
  `user_id` int(11) NOT NULL,
  `balance` double(255,8) NOT NULL,
  `coin_type` varchar(255) NOT NULL DEFAULT 'USDT',
  `create_time` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`key_id`),
  KEY `user_id_index` (`user_id`)
) ENGINE=InnoDB AUTO_INCREMENT=1 DEFAULT CHARSET=utf8 COMMENT='用户电力余额表';

DROP TABLE IF EXISTS `tokensky_user_invite`;
CREATE TABLE `tokensky_user_invite` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `from` int(11) NOT NULL COMMENT '邀请人',
  `to` int(11) NOT NULL COMMENT '被邀请人',
  `create_time` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COMMENT='用户邀请表';

DROP TABLE IF EXISTS `tokensky_user_tibi`;
CREATE TABLE `tokensky_user_tibi` (
  `key_id` int(11) NOT NULL AUTO_INCREMENT,
  `user_id` int(11) NOT NULL,
  `coin_type` varchar(50) NOT NULL COMMENT '类型',
  `order_id` varchar(100) NOT NULL,
  `admin_id` int(11) DEFAULT NULL,
  `txid` varchar(255) DEFAULT NULL COMMENT '哈稀ID',
  `out_address` varchar(255) DEFAULT NULL COMMENT '转出地址 保留字段',
  `in_address` varchar(255) NOT NULL COMMENT '转入目标地址',
  `quantity` double(255,8) NOT NULL,
  `service_charge_quantity` double(255,8) NOT NULL DEFAULT '0.00000000' COMMENT '手续费',
  `sum_quantity` double(255,8) NOT NULL,
  `service_charge` double DEFAULT NULL COMMENT '百分比手续费',
  `base_service_charge` double NOT NULL DEFAULT '0' COMMENT '基础手续费',
  `push_time` datetime NOT NULL COMMENT '提币时间',
  `verify_time` datetime DEFAULT NULL COMMENT '审核时间',
  `finish_time` datetime DEFAULT NULL COMMENT '到账时间',
  `status` int(11) NOT NULL DEFAULT '0' COMMENT '0待审核 1审核通过 2审核未通过 3审核处理中 4异常状态\n',
  `create_time` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `update_time` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`key_id`),
  KEY `key_id_index` (`key_id`),
  KEY `user_id_index` (`user_id`),
  KEY `admin_id_index` (`admin_id`),
  KEY `order_id_index` (`order_id`)
) ENGINE=InnoDB AUTO_INCREMENT=1 DEFAULT CHARSET=utf8 COMMENT='提币表';

DROP TABLE IF EXISTS `tokensky_user_token`;
CREATE TABLE `tokensky_user_token` (
  `id` int(11) unsigned NOT NULL AUTO_INCREMENT COMMENT 'ID',
  `user_id` int(11) NOT NULL COMMENT '用户ID',
  `token` varchar(200) DEFAULT NULL COMMENT '用户token',
  `creator_id` int(11) DEFAULT '1' COMMENT '创建人ID,1前台，2后台',
  `create_time` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `create_ip` varchar(30) DEFAULT NULL COMMENT 'IP地址',
  `updater_id` int(11) DEFAULT NULL COMMENT '更新人ID',
  `update_time` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  `update_ip` varchar(30) DEFAULT NULL COMMENT '更新人IP地址',
  PRIMARY KEY (`id`),
  UNIQUE KEY `user_id` (`user_id`)
) ENGINE=InnoDB AUTO_INCREMENT=1 DEFAULT CHARSET=utf8 COMMENT='用户token表';
