Px -> P
P -> Da Sa
P -> Da
P -> Sa
Sa -> Sa S
Sa -> S
# 声明
Da -> Da D
Da -> D
D -> proc id ( IDlist ) { P }
IDlist -> IDlist , id
IDlist -> id
D -> T id ;
T -> X C
T -> X
T -> record D
X -> integer
X -> real
C -> [ num ] C
C -> [ num ]
# 赋值语句
S -> id = E ;
S -> L = E ;
E -> E + Ea
E -> E - Ea
E -> Ea
Ea -> R
R -> R * Ra
R -> R / Ra
R -> Ra
Ra -> Y
Y -> ( E )
Y -> num
Y -> id
Y -> - Y
Y -> L
L -> L [ E ]
L -> id [ E ]
# 控制流语句
S -> if ( B ) { Sa }
S -> if ( B ) { Sa } else { Sa }
S -> while ( B ) { Sa }
B -> B or Ba
B -> Ba
Ba -> N
N -> N and Na
N -> Na
Na -> M
M -> E relop E
M -> not V
M -> V
V -> true
V -> false
V -> ( B )
relop -> <
relop -> <=
relop -> ==
relop -> !=
relop -> >
relop -> >=
# 过程调用
S -> call id ( Elist )
S -> call id ( )
Elist -> Elist , E
Elist -> E
