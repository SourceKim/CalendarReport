# 介绍

一个帮助用户记录日报，并且整理成周报的简单软件。

用户每天都可以记录日报，并且可以选择日期区间一键帮助用户总结生成周报

# 功能设计

## 页面设计

页面要求兼容移动端，尽量使用 ElementPlus 的组件 https://element-plus.org/zh-CN/component/overview.html

- 顶部标题导航栏，显示「一键生成周报」

- 中间展示日历
    - 日历上方操作栏，用以选择年月日
    - 日历 ElementPlus 组件 https://element-plus.org/zh-CN/component/calendar.html，有输入日报的日期要求有标记

- 底部
    - 周报时间区间选择，使用 date-picker 组件 https://element-plus.org/zh-CN/component/date-picker.html，包括 start & end，以及 With quick options，可以快捷生成
    - 一个「一键生成周报」按钮

## 交互

- 日报：
    - 点击日期，弹出popup，包括输入框（input 组件 https://element-plus.org/zh-CN/component/input.html），以及保存和删除按钮。
    - 点击空白处或者关闭按钮可以关闭弹出的 popup。
    - 如果当前日期已有日报，则显示日报内容。
- 一键生成周报：
    - 检查 date-picker 日期区间是否完整且 end > start，否则提示错误
    - 点击后请求 coze 接口，参数为选中日期的日报内容，返回值预设为一段周报内容，并通过文本 pop-up 展示出内容。

# 技术栈
- 前端语言：Typescript
- 包管理：yarn
- 前端框架：vue + pinia + ElementPlus
- 数据持久化，使用 vue 的浏览器缓存
- 网络访问 axios
- AI 总结功能：coze
- @coze/js js-sdk https://www.coze.cn/open/docs/developer_guides/nodejs_getting_started

个人 coze 令牌：pat_mR6lxEzEZ0bcNWUmVmWnlGL29bGiJkoqmzAi4MUOYbkiDJReoEKql90HlkzdcQ8S