-- 家用小工具数据库初始化脚本
-- 创建时间: 2025-12-30

-- 应用配置表
CREATE TABLE IF NOT EXISTS app_config (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  config_key TEXT UNIQUE NOT NULL,
  config_value TEXT,
  description TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 家庭成员表
CREATE TABLE IF NOT EXISTS family_members (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  nickname TEXT UNIQUE NOT NULL,                    -- 昵称（必选，唯一）
  name TEXT,                                        -- 姓名
  birthday_text TEXT,                               -- 生日文本（字符串格式）
  birthday_date DATE,                               -- 生日日期（时间戳年月日）
  zodiac_sign TEXT,                                 -- 星座
  chinese_zodiac TEXT,                              -- 属相
  avatar_path TEXT,                                 -- 头像路径
  gender TEXT,                                      -- 性别
  sort_weight INTEGER DEFAULT 0,                    -- 排序权重
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 属性定义表
CREATE TABLE IF NOT EXISTS member_attribute_definitions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  attribute_name TEXT UNIQUE NOT NULL,              -- 属性名（必选）
  attribute_type TEXT NOT NULL,                     -- 属性类型：integer, string, decimal, checkbox, image
  options TEXT,                                     -- 可选项（JSON格式）
  attribute_logo TEXT,                              -- 属性Logo路径
  sort_weight INTEGER DEFAULT 0,                    -- 排序权重
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 属性值表
CREATE TABLE IF NOT EXISTS member_attribute_values (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  member_id INTEGER NOT NULL,                       -- 成员ID
  attribute_id INTEGER NOT NULL,                    -- 属性定义ID
  value_text TEXT,                                  -- 文本/字符串值
  value_number REAL,                                -- 数字值（整数或小数）
  value_boolean INTEGER,                            -- 布尔值（复选框）
  value_image TEXT,                                 -- 图片路径
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (member_id) REFERENCES family_members(id) ON DELETE CASCADE,
  FOREIGN KEY (attribute_id) REFERENCES member_attribute_definitions(id) ON DELETE CASCADE,
  UNIQUE(member_id, attribute_id)                   -- 每个成员的每个属性只能有一个值
);

-- 创建索引以优化查询性能
CREATE INDEX IF NOT EXISTS idx_member_attribute_values_member 
ON member_attribute_values(member_id);

CREATE INDEX IF NOT EXISTS idx_member_attribute_values_attribute 
ON member_attribute_values(attribute_id);

CREATE INDEX IF NOT EXISTS idx_family_members_sort_weight 
ON family_members(sort_weight);

CREATE INDEX IF NOT EXISTS idx_member_attribute_definitions_sort_weight 
ON member_attribute_definitions(sort_weight);

-- 待做任务表
CREATE TABLE IF NOT EXISTS todo_tasks (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  title TEXT NOT NULL,
  description TEXT,
  assigned_to INTEGER,
  status TEXT DEFAULT 'pending',
  priority INTEGER DEFAULT 0,
  due_date DATETIME,
  completed_at DATETIME,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (assigned_to) REFERENCES family_members(id)
);

-- 日记表
CREATE TABLE IF NOT EXISTS diaries (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  title TEXT NOT NULL,
  content TEXT,
  mood TEXT,
  weather TEXT,
  author_id INTEGER,
  diary_date DATE NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (author_id) REFERENCES family_members(id)
);

-- 周期任务表
CREATE TABLE IF NOT EXISTS periodic_tasks (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  title TEXT NOT NULL,
  description TEXT,
  cron_expression TEXT,
  frequency TEXT,
  assigned_to INTEGER,
  is_active INTEGER DEFAULT 1,
  last_completed_at DATETIME,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (assigned_to) REFERENCES family_members(id)
);

-- 游戏记录表
CREATE TABLE IF NOT EXISTS game_records (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  game_name TEXT NOT NULL,
  player_id INTEGER,
  score INTEGER,
  level INTEGER,
  play_time INTEGER,
  played_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (player_id) REFERENCES family_members(id)
);

-- 收藏表
CREATE TABLE IF NOT EXISTS favorites (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  title TEXT NOT NULL,
  url TEXT,
  description TEXT,
  category TEXT,
  thumbnail_path TEXT,
  collected_by INTEGER,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (collected_by) REFERENCES family_members(id)
);

-- 成长轨迹表
CREATE TABLE IF NOT EXISTS growth_tracks (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  member_id INTEGER NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  milestone_type TEXT,
  milestone_date DATE,
  photo_path TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (member_id) REFERENCES family_members(id)
);

-- 初始配置数据
INSERT INTO app_config (config_key, config_value, description) VALUES 
  ('app_version', '1.0.0', '应用版本'),
  ('app_name', '木木的家', '应用名称'),
  ('theme', 'light', '主题模式');
