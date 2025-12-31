# 家庭成员功能实现文档

## 功能概述

本文档描述了"家庭成员"功能模块的完整实现，包括前端界面、后端API、数据库设计等。

## 1. 数据库设计

### 1.1 家庭成员表 (family_members)

存储家庭成员的基本信息。

```sql
CREATE TABLE family_members (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  nickname TEXT UNIQUE NOT NULL,              -- 昵称（必选，唯一）
  name TEXT,                                  -- 姓名
  birthday_text TEXT,                         -- 生日文本（字符串格式）
  birthday_date DATE,                         -- 生日日期（时间戳年月日）
  zodiac_sign TEXT,                           -- 星座
  chinese_zodiac TEXT,                        -- 属相
  avatar_path TEXT,                           -- 头像路径
  gender TEXT,                                -- 性别
  sort_weight INTEGER DEFAULT 0,              -- 排序权重
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

### 1.2 属性定义表 (member_attribute_definitions)

定义动态属性的结构。

```sql
CREATE TABLE member_attribute_definitions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  attribute_name TEXT UNIQUE NOT NULL,        -- 属性名（必选）
  attribute_type TEXT NOT NULL,               -- 属性类型：integer, string, decimal, checkbox, image
  options TEXT,                               -- 可选项（JSON格式）
  attribute_logo TEXT,                        -- 属性Logo路径
  sort_weight INTEGER DEFAULT 0,              -- 排序权重
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

### 1.3 属性值表 (member_attribute_values)

存储成员的动态属性值。

```sql
CREATE TABLE member_attribute_values (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  member_id INTEGER NOT NULL,                 -- 成员ID
  attribute_id INTEGER NOT NULL,              -- 属性定义ID
  value_text TEXT,                            -- 文本/字符串值
  value_number REAL,                          -- 数字值（整数或小数）
  value_boolean INTEGER,                      -- 布尔值（复选框）
  value_image TEXT,                           -- 图片路径
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (member_id) REFERENCES family_members(id) ON DELETE CASCADE,
  FOREIGN KEY (attribute_id) REFERENCES member_attribute_definitions(id) ON DELETE CASCADE,
  UNIQUE(member_id, attribute_id)
);
```

## 2. 后端API接口

### 2.1 家庭成员接口

- `GET /api/family-members` - 获取所有成员（按权重排序）
- `GET /api/family-members/:id` - 获取单个成员
- `POST /api/family-members` - 创建成员
- `PUT /api/family-members/:id` - 更新成员
- `DELETE /api/family-members/:id` - 删除成员

### 2.2 属性定义接口

- `GET /api/member-attributes` - 获取所有属性定义
- `POST /api/member-attributes` - 创建属性定义
- `PUT /api/member-attributes/:id` - 更新属性定义
- `DELETE /api/member-attributes/:id` - 删除属性定义

### 2.3 属性值接口

- `GET /api/family-members/:memberId/attributes` - 获取成员的属性值
- `GET /api/member-attribute-values` - 获取所有属性值
- `POST /api/member-attribute-values` - 设置或更新属性值
- `DELETE /api/member-attribute-values/:id` - 删除属性值

### 2.4 文件上传接口

- `POST /api/upload/member-file` - 上传成员相关文件（头像、属性图片等）

## 3. 前端组件

### 3.1 主页面组件 (FamilyMembersPage.tsx)

- 显示"添加成员"和"添加属性"按钮
- 展示家人信息表格
- 固定表头（成员昵称行）
- 双击单元格进入编辑模式

### 3.2 添加成员对话框 (AddMemberDialog.tsx)

**必填字段：**
- 昵称（不可重复）

**可选字段：**
- 姓名
- 性别（下拉选择：男/女）
- 生日文本（字符串）
- 生日日期（日期选择器）
- 星座（下拉选择）
- 属相（下拉选择）
- 头像（图片上传）
- 排序权重（数字）

### 3.3 添加属性对话框 (AddAttributeDialog.tsx)

**必填字段：**
- 属性名（不可重复）
- 属性类型（下拉选择：字符串/整数/小数/复选框/图片）

**可选字段：**
- 可选项（用于下拉选择）
- 属性Logo（图片上传）
- 排序权重（数字）

### 3.4 通用单元格编辑器 (CellEditor.tsx)

支持多种数据类型的编辑：

1. **字符串编辑器**
   - 多行文本框
   - 支持 Enter 保存，Escape 取消

2. **整数/小数编辑器**
   - 数字输入框
   - 自动验证数据格式

3. **复选框编辑器**
   - 可视化复选框
   - 布尔值切换

4. **图片编辑器**
   - 图片预览
   - 上传新图片
   - 删除已有图片
   - 支持拖拽上传

## 4. 界面特性

### 4.1 表格布局

```
+----------+--------+--------+--------+
| 属性     | 爸爸   | 妈妈   | 木木   |  <- 固定表头
+----------+--------+--------+--------+
| 头像     | [图片] | [图片] | [图片] |
| 姓名     | 张三   | 李四   | 王五   |
| 性别     | 男     | 女     | 女     |
| ...      | ...    | ...    | ...    |
+----------+--------+--------+--------+
```

### 4.2 排序规则

- 横轴：成员按 `sort_weight` 字段排序（升序）
- 纵轴：
  1. 固定属性（头像、姓名、性别、生日等）
  2. 动态属性按 `sort_weight` 字段排序（升序）

### 4.3 交互特性

- **双击编辑**：双击任意单元格进入编辑模式
- **固定表头**：滚动时，成员昵称行保持在顶部可见
- **响应式设计**：按钮大小、图片尺寸符合整体风格
- **渐变色**：
  - 添加成员按钮：粉红到玫瑰红渐变
  - 添加属性按钮：蓝色到靛蓝渐变

## 5. 文件存储

### 5.1 目录结构

```
uploadFiles/members/
├── avatars/        # 成员头像
├── attributes/     # 属性值图片
└── logos/          # 属性Logo
```

### 5.2 文件命名

格式：`{timestamp}_{randomString}{extension}`

示例：`1704067200000_a3k9m2.jpg`

### 5.3 访问路径

上传后的文件通过以下URL访问：
`http://localhost:3000/uploadFiles/members/{filename}`

## 6. 配置文件

在 `configs/config.json` 中添加了成员配置：

```json
{
  "membersConfig": {
    "avatarSize": {
      "width": 80,
      "height": 80
    },
    "attributeImageSize": {
      "width": 120,
      "height": 120
    },
    "uploadPath": "uploadFiles/members"
  }
}
```

## 7. 使用说明

### 7.1 启动应用

```bash
# 根目录下启动
npm run dev

# 或分别启动前后端
cd server && npm run dev
cd client && npm run dev
```

### 7.2 访问地址

- 生产环境：http://localhost:3000
- 开发环境：http://localhost:5173（前端）+ http://localhost:3000（后端）

### 7.3 使用流程

1. 点击"添加成员"按钮，填写成员信息
2. 点击"添加属性"按钮，定义动态属性
3. 双击表格单元格，编辑属性值
4. 属性值自动保存到数据库

## 8. 技术栈

### 8.1 前端

- React + TypeScript
- Vite
- TailwindCSS
- Lucide Icons

### 8.2 后端

- Fastify
- TypeScript
- Better-SQLite3
- @fastify/multipart（文件上传）
- @fastify/static（静态文件服务）

## 9. 注意事项

1. **数据验证**
   - 昵称必填且唯一
   - 属性名必填且唯一
   - 文件大小限制10MB

2. **性能优化**
   - 使用索引优化查询
   - 按需加载数据
   - 图片懒加载

3. **安全性**
   - 文件类型验证
   - SQL注入防护
   - XSS防护

## 10. 后续优化建议

1. 添加成员删除功能
2. 添加属性编辑和删除功能
3. 支持批量导入导出
4. 添加成员分组功能
5. 支持属性值历史记录
6. 添加图片裁剪功能
7. 支持更多属性类型（日期、时间等）

---

**实现完成日期：** 2025年12月31日
