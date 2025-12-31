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

-- 知识库表（一级板块）
CREATE TABLE IF NOT EXISTS knowledge_categories (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,                               -- 知识库名
  description TEXT,                                 -- 知识库备注
  logo_path TEXT,                                   -- 知识库Logo
  color TEXT DEFAULT '#3B82F6',                     -- 板块颜色
  sort_weight INTEGER DEFAULT 0,                    -- 排序权重
  dir_name TEXT NOT NULL,                           -- 文件目录名
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 知识库二级板块表
CREATE TABLE IF NOT EXISTS knowledge_sections (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  category_id INTEGER NOT NULL,                     -- 所属一级板块ID
  name TEXT NOT NULL,                               -- 板块名
  description TEXT,                                 -- 板块备注
  logo_path TEXT,                                   -- Logo路径
  color TEXT DEFAULT '#8B5CF6',                     -- 板块颜色
  sort_weight INTEGER DEFAULT 0,                    -- 排序权重
  dir_name TEXT NOT NULL,                           -- 文件目录名
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (category_id) REFERENCES knowledge_categories(id) ON DELETE CASCADE
);

-- 知识条目表
CREATE TABLE IF NOT EXISTS knowledge_items (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  section_id INTEGER NOT NULL,                      -- 所属二级板块ID
  name TEXT NOT NULL,                               -- 知识名
  keywords TEXT,                                    -- 知识关键字
  brief_note TEXT,                                  -- 知识简注
  summary TEXT,                                     -- 知识简介
  detail TEXT,                                      -- 知识详情
  sort_weight INTEGER DEFAULT 0,                    -- 排序权重
  -- 媒体资源（JSON数组格式存储路径）
  audio_paths TEXT,                                 -- 音频路径列表
  image_paths TEXT,                                 -- 图片路径列表
  video_paths TEXT,                                 -- 视频路径列表
  -- 学习统计
  correct_count INTEGER DEFAULT 0,                  -- 正确次数
  wrong_count INTEGER DEFAULT 0,                    -- 错误次数
  consecutive_correct INTEGER DEFAULT 0,            -- 连续正确次数
  consecutive_wrong INTEGER DEFAULT 0,              -- 连续错误次数
  last_study_at DATETIME,                           -- 最后学习时间
  last_correct_at DATETIME,                         -- 最后正确时间
  last_wrong_at DATETIME,                           -- 最后错误时间
  -- 时间戳
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (section_id) REFERENCES knowledge_sections(id) ON DELETE CASCADE
);

-- 创建知识库相关索引
CREATE INDEX IF NOT EXISTS idx_knowledge_sections_category 
ON knowledge_sections(category_id);

CREATE INDEX IF NOT EXISTS idx_knowledge_items_section 
ON knowledge_items(section_id);

CREATE INDEX IF NOT EXISTS idx_knowledge_categories_sort 
ON knowledge_categories(sort_weight);

CREATE INDEX IF NOT EXISTS idx_knowledge_sections_sort 
ON knowledge_sections(sort_weight);

CREATE INDEX IF NOT EXISTS idx_knowledge_items_sort 
ON knowledge_items(sort_weight);

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
  ('app_name', '我的小家', '应用名称'),
  ('theme', 'light', '主题模式');
