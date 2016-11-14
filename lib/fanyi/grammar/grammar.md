Px -> P
P -> D S -> P-945
## P -> nP1 D S -> P-945
## nP1 -> nil -> nP1-241

# 赋值语句
S -> S M Sa -> S4-267
S -> Sa -> pass-nextlist-267
Sa -> A ; -> Sa1-267
Sa -> return E ; -> Sa5-271
A -> id = E -> A1-244
A -> L = E -> A2-246
S -> nil
Sa -> nil

Sa -> if ( Bo ) M Sb -> Sa2-267
Sa -> if ( Bo ) M Sb N else M Sb -> Sa3-267
Sa -> while M ( Bo ) M Sb -> Sa4-267
Sb -> { S } -> Sb1-267
Sb -> Sa -> pass-nextlist-267
N -> nil -> N1-267


Sa -> Ef ; -> Sa6-271
E -> Ef -> E4-271
Ef -> id ( Elist ) -> Ef1-271
Elist -> Elist , E -> Elist2-271
Elist -> E -> Elist1-271
Elist -> nil

E -> E + Ea -> E2-244
E -> E - Ea -> E3-244
E -> Ea -> E1-244
Ea -> R -> Ea8-244
R -> R * Ra -> R1-244
R -> R / Ra -> R2-244
R -> Ra -> R3-244
Ra -> Y -> Ra1-244
Ra -> ++ Y -> Ra2-244
Ra -> -- Y -> Ra3-244
Ra -> Y ++ -> Ra4-244
Ra -> Y -- -> Ra5-244
Y -> - Y -> Y1-244
Y -> ( E ) -> Y2-244
Y -> num -> Y3-244
Y -> Float -> Y4-244
Y -> Char -> Y5-244
Y -> id -> Y6-244
Y -> L -> Y7-246

L -> id [ E ] -> L1-246
L -> L [ E ] -> L2-246

D -> D Da
D -> Da
D -> nil
Da -> T id ; -> D1-241
Da -> T id FN ( Flist ) { D S } -> Da1-271
FN -> nil -> nFN1-271
Flist -> Flist , T id -> Flist1-271
Flist -> T id -> Flist2-271
Flist -> nil

# T -> record { nT2 D } -> T3-242
# nT2 -> nil -> nT2-242

T -> B nT1 C -> T-240
nT1 -> nil -> nT1-240

B -> integer -> B1-240
B -> float -> B2-240
B -> short -> B3-240
B -> char -> B4-240

C -> nil -> nC1-240
C -> [ num ] C -> C2-240

# 布尔表达式
Bo -> Bo or M Boa -> Bo1-264
Bo -> Boa -> pass-list-264
Boa -> BN -> pass-list-264
BN -> BN and M BNa -> BN1-264
BN -> BNa -> pass-list-264
BNa -> BM -> pass-list-264
BM -> E relop E -> BM1-264
BM -> not BV -> BM2-264
BM -> BV -> pass-list-264
BV -> true -> BV1-264
BV -> false -> BV2-264
BV -> ( Bo ) -> BV3-264
M -> nil -> nM1-264
relop -> < -> relop-264
relop -> <= -> relop-264
relop -> == -> relop-264
relop -> != -> relop-264
relop -> >= -> relop-264
relop -> > -> relop-264
