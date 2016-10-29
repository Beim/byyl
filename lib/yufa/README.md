- app.js 进行语法分析

- makeLRTable.js 生成LR1 分析表

- grammar/ LR 文法配置

- util/ 生成LR 分析表 和 运行LR 分析表的函数

- /util/test.js 测试文件

```
> yufa@1.0.0 test /home/beim/usr/work/byyl1/lib/yufa
> nyc ava -v


  ✔ getLeftItemInGrammar
  ✔ itemEqual
  ✔ hasItem
  ✔ itemSetEqual
  ✔ hasItemSet
  ✔ closure
  ✔ closure_1
  ✔ goto
  ✔ goto_1
  ✔ combine
  ✔ hasLeft
  ✔ first
  ✔ follow
  ✔ buildLR0
  ✔ buildLR1
  ✔ filter
  ✔ buildLRTable_1
  ✔ RUN!!! (109ms)

  18 tests passed [18:10:30]

----------------|----------|----------|----------|----------|----------------|
File            |  % Stmts | % Branch |  % Funcs |  % Lines |Uncovered Lines |
----------------|----------|----------|----------|----------|----------------|
All files       |    93.98 |    86.59 |    87.88 |    95.01 |                |
 LRBuildUtil.js |    98.53 |     93.8 |    95.24 |      100 |                |
 LRRunUtil.js   |    82.73 |       68 |       75 |    83.18 |... 228,231,238 |
----------------|----------|----------|----------|----------|----------------|
```
