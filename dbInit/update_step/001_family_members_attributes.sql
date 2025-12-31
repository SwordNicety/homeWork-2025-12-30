-- 家庭成员属性系统升级脚本
-- 创建时间: 2025-12-31

-- 1. 修改家庭成员表，添加更多字段
-- 先创建新表
CREATE TABLE IF NOT EXISTS family_members_new (
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

-- 复制旧数据（如果存在）
INSERT INTO family_members_new (id, name, nickname, avatar_path, birthday_date, created_at, updated_at)
SELECT id, name, nickname, avatar_path, birthday, created_at, updated_at 
FROM family_members 
WHERE EXISTS (SELECT 1 FROM family_members);

-- 删除旧表并重命名新表
DROP TABLE IF EXISTS family_members;
ALTER TABLE family_members_new RENAME TO family_members;

-- 2. 创建属性定义表
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

-- 3. 创建属性值表
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

-- 插入一些示例数据（可选）
-- INSERT INTO family_members (nickname, name, birthday_text, birthday_date, zodiac_sign, chinese_zodiac, gender, sort_weight)
-- VALUES ('爸爸', '张三', '1980年1月15日', '1980-01-15', '摩羯座', '猴', '男', 1);
