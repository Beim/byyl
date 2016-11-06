# 环境

Ubuntu 16.04
Node.js v6.3.1

# 使用方法

下载第三方模块
npm install

运行服务器
npm start

浏览器访问
http://localhost:2333/

config 按钮选择 ./lib/cifa/DFAtable3.json
source 按钮选择 ./lib/yufa/source/3source.c
点击run 按钮

左侧为源代码. 右侧为词法分析的token
点击LEX 按钮显示/隐藏词法分析结果
点击GRAM 按钮显示/隐藏语法分析结果
点击GTABLE 按钮显示/隐藏语法分析表

# 目录

词法分析
`./lib/cifa`

语法分析
./lib/yufa
