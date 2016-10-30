Px -> P
P -> Da Sa
P -> Da
P -> Sa
Sa -> Sa S
Sa -> S


# 声明
Da -> Da D
Da -> D
D -> Df ( DFlist ) { P }
D -> Df ( ) { P }
DFlist -> DFlist , Df
DFlist -> Df
D -> Df ;
D -> Ds ;
Ds -> T IDlist
Df -> T id
IDlist -> IDlist , id
IDlist -> IDlist , L
IDlist -> id
IDlist -> L
T -> X C
T -> X
T -> record D
X -> integer
X -> void
X -> real
X -> float
X -> double
C -> [ num ] C
C -> [ num ]


# 赋值语句
S -> id = E ;
S -> L = E ;
S -> id += E ;
S -> id -= E ;
S -> L += E ;
S -> L -= E ;
S -> Df = E ;
S -> Ds = { Elist } ;
S -> return E ;
E -> E + Ea
E -> E - Ea
E -> Ea
Ea -> R
R -> R * Ra
R -> R / Ra
R -> Ra
Ra -> Y
Ra -> ++ Y
Ra -> Y ++
Ra -> -- Y
Ra -> Y --
Y -> ( E )
Y -> num
Y -> F
Y -> id
Y -> - Y
Y -> L
L -> L [ E ]
L -> id [ E ]


# 控制流语句
S -> if ( B ) { Sa }
S -> if ( B ) { Sa } else { Sa }
S -> while ( B ) { Sa }
S -> do { Sa } while ( B ) ;
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
S -> F
F -> id ( Elist )
F -> id ( )
Elist -> Elist , E
Elist -> E
