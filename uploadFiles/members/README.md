# 家庭成员文件上传目录结构

此目录用于存储家庭成员相关的上传文件。

## 目录结构

```
uploadFiles/members/
├── avatars/          # 成员头像图片
├── attributes/       # 属性值图片（动态属性中类型为image的值）
└── logos/           # 属性定义的Logo图标
```

## 各目录用途

- **avatars/**: 存储家庭成员的头像图片，在"添加成员"或编辑头像时上传
- **logos/**: 存储属性定义的Logo图标，在"添加属性"时上传
- **attributes/**: 存储属性值的图片，当属性类型为"图片"时，双击单元格编辑上传

## 命名规范

所有上传的文件将自动按以下格式命名：
- 头像: `avatar_{timestamp}_{randomString}{extension}`
- Logo: `logo_{timestamp}_{randomString}{extension}`
- 属性值: `attr_{timestamp}_{randomString}{extension}`

示例：
- `avatar_1704067200000_a3k9m2.jpg`
- `logo_1704067200000_b5n8p3.png`
- `attr_1704067200000_c7q2w9.webp`

这样的命名方式可以：
1. 避免文件名冲突
2. 保持文件的唯一性
3. 便于追踪文件上传时间
4. 通过前缀快速识别文件类型

## 文件大小限制

- 单个文件最大: 10MB
- 仅支持图片格式: jpg, jpeg, png, gif, webp等

## 对应的API接口

- 头像上传: `POST /api/upload/avatar`
- Logo上传: `POST /api/upload/logo`
- 属性值图片上传: `POST /api/upload/attribute`

## 访问方式

上传后的文件可以通过以下URL访问：
- `http://localhost:3000/uploadFiles/members/avatars/{filename}`
- `http://localhost:3000/uploadFiles/members/logos/{filename}`
- `http://localhost:3000/uploadFiles/members/attributes/{filename}`
